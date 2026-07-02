/**
 * ScamShield API Routes
 *
 * This module wires the multi-agent orchestrator into the Express route layer.
 * Security checks (rate limiting, input validation) run BEFORE the orchestrator
 * is invoked, ensuring no agent ever receives malicious input.
 *
 * Route overview:
 *   POST /analyze      → Full multi-agent analysis pipeline
 *   POST /emergency    → Emergency recovery action plan
 *   GET  /history      → Recent analysis records
 *   DELETE /history/:id → Delete a record
 *   GET  /stats        → Aggregate statistics
 */

import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db, analysesTable } from "@workspace/db";
import { desc, sql, eq } from "drizzle-orm";
import { AnalyzeContentBody, GetEmergencyActionsBody } from "@workspace/api-zod";
import { runOrchestrator } from "../agents/orchestrator.js";
import { validateInput, checkRateLimit, sanitizeInput } from "../lib/security.js";

const router = Router();

// Shared AI client for the emergency route (other routes use agent modules)
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

// ─── POST /analyze ────────────────────────────────────────────────────────────
router.post("/analyze", async (req, res) => {
  // 1. Rate limiting — enforce per-IP request budget
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `Too many requests. Please wait ${Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000)} seconds before trying again.`,
    });
    return;
  }

  // 2. Zod schema validation
  const parsed = AnalyzeContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "content field is required." });
    return;
  }

  // 3. Security validation (injection detection + sanitization)
  const validation = validateInput(parsed.data.content);
  if (!validation.valid) {
    res.status(400).json({ error: validation.reason });
    return;
  }

  try {
    // 4. Run the full multi-agent orchestrator pipeline
    //    (Intake → Threat+URL in parallel → Education+Vulnerability+Reporting)
    const result = await runOrchestrator(parsed.data.content);

    // 5. Persist the analysis to the database
    const snippet =
      parsed.data.content.slice(0, 200) +
      (parsed.data.content.length > 200 ? "..." : "");

    await db.insert(analysesTable).values({
      contentSnippet: snippet,
      riskLevel: result.riskLevel,
      scamType: result.type,
      confidenceScore: result.confidenceScore,
      fullResult: JSON.stringify(result),
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Orchestrator pipeline failed");
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

// ─── POST /emergency ──────────────────────────────────────────────────────────
router.post("/emergency", async (req, res) => {
  const parsed = GetEmergencyActionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "exposures array is required" });
    return;
  }

  const { exposures, scamContext } = parsed.data;

  const exposureDescriptions: Record<string, string> = {
    otp: "shared an OTP (one-time password)",
    bank_details: "shared bank account details or card numbers",
    installed_app: "installed an app from the scammer",
    scanned_qr: "scanned a QR code that may have redirected to a malicious site",
    sent_money: "sent money to the scammer",
    shared_password: "shared a password or login credentials",
    clicked_link: "clicked a suspicious link",
  };

  const exposureList = exposures
    .map((e) => exposureDescriptions[e] || e)
    .join(", ");

  // Sanitize optional context field
  const safeContext = scamContext ? sanitizeInput(scamContext) : "";

  const prompt = `You are a cybersecurity emergency response expert. A user has just fallen for a scam.

WHAT HAPPENED:
- Exposures: ${exposureList}
${safeContext ? `- Scam context: ${safeContext}` : ""}

Generate an IMMEDIATE recovery action plan. Be concise, calm, and actionable. Every minute matters.

Assess overall severity: "moderate" (no financial/credential exposure), "serious" (credentials exposed), or "critical" (money sent or banking details shared).

RETURN ONLY VALID JSON (no markdown):
{
  "severity": "moderate"|"serious"|"critical",
  "summary": "2-sentence calm reassurance + what to do first",
  "actions": [
    {
      "priority": "immediate"|"urgent"|"soon",
      "title": "short action title",
      "description": "specific instructions",
      "timeframe": "Do this now / Within 30 minutes / Within 24 hours"
    }
  ],
  "hotlines": ["India: Cyber Crime Helpline 1930", "India: Bank customer care (call number on your card)", "Emergency: 112"]
}

Rules:
- "immediate" priority: next 5 minutes
- "urgent" priority: next hour
- "soon" priority: today
- Include 5-8 actions total, ordered by priority
- Be specific about what to do and who to call
- Include the most relevant Indian helplines`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });

    const cleanedText = (response.text ?? "{}")
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    let result;
    try {
      result = JSON.parse(cleanedText);
    } catch {
      res.status(500).json({ error: "Failed to parse emergency response. Please try again." });
      return;
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Emergency route failed");
    res.status(500).json({ error: "Failed to generate emergency plan. Please try again." });
  }
});

// ─── GET /history ─────────────────────────────────────────────────────────────
router.get("/history", async (req, res) => {
  try {
    const records = await db
      .select({
        id: analysesTable.id,
        contentSnippet: analysesTable.contentSnippet,
        riskLevel: analysesTable.riskLevel,
        scamType: analysesTable.scamType,
        confidenceScore: analysesTable.confidenceScore,
        analyzedAt: analysesTable.analyzedAt,
      })
      .from(analysesTable)
      .orderBy(desc(analysesTable.analyzedAt))
      .limit(50);

    res.json(
      records.map((record: { analyzedAt: Date }) => ({
        ...record,
        analyzedAt: record.analyzedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ─── DELETE /history/:id ──────────────────────────────────────────────────────
router.delete("/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const deleted = await db
      .delete(analysesTable)
      .where(eq(analysesTable.id, id))
      .returning({ id: analysesTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Record not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete history record");
    res.status(500).json({ error: "Failed to delete record" });
  }
});

// ─── GET /stats ───────────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysesTable);

    const byRiskRows = await db
      .select({
        riskLevel: analysesTable.riskLevel,
        count: sql<number>`count(*)::int`,
      })
      .from(analysesTable)
      .groupBy(analysesTable.riskLevel);

    const byTypeRows = await db
      .select({
        scamType: analysesTable.scamType,
        count: sql<number>`count(*)::int`,
      })
      .from(analysesTable)
      .groupBy(analysesTable.scamType)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const [avgRow] = await db
      .select({ avg: sql<number>`avg(confidence_score)::float` })
      .from(analysesTable);

    const byRiskLevel: Record<string, number> = {};
    for (const row of byRiskRows) byRiskLevel[row.riskLevel] = row.count;

    const byType: Record<string, number> = {};
    for (const row of byTypeRows) byType[row.scamType] = row.count;

    res.json({
      totalAnalyzed: totalRow?.count ?? 0,
      byRiskLevel,
      byType,
      averageConfidence: Math.round(avgRow?.avg ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
