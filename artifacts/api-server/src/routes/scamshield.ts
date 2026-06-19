import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { AnalyzeContentBody, GetEmergencyActionsBody } from "@workspace/api-zod";

const router = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

// ─── POST /analyze ────────────────────────────────────────────────────────────
router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const { content } = parsed.data;

  // Detect if input looks like a URL for extra URL intelligence
  const urlRegex = /https?:\/\/[^\s]+/i;
  const isUrl = urlRegex.test(content.trim());

  try {
    const urlIntelligenceBlock = isUrl ? `
8. URL INTELLIGENCE (only if input contains a URL): analyze the URL itself.
   - Extract the domain
   - Detect possible typosquatting (e.g., amaz0n, paypa1, g00gle)
   - Detect URL shortener usage (bit.ly, tinyurl, t.co, etc.)
   - List suspicious keywords in the URL path/params
   - Give a URL threat score 0-100
   - Give a recommendation

Include in JSON:
"urlIntelligence": {
  "isUrl": true,
  "domain": "extracted domain",
  "threatScore": number,
  "possibleTyposquatting": true/false,
  "typosquattingTarget": "brand being impersonated or empty string",
  "usesUrlShortener": true/false,
  "suspiciousKeywords": ["array", "of", "keywords"],
  "recommendation": "one sentence recommendation"
}` : `Include in JSON: "urlIntelligence": { "isUrl": false, "domain": "", "threatScore": 0, "possibleTyposquatting": false, "typosquattingTarget": "", "usesUrlShortener": false, "suspiciousKeywords": [], "recommendation": "" }`;

    const prompt = `You are the ScamShield AI Agent. Analyze the provided input — it may be a text message, email, URL, QR code content, social media post, job listing, or any communication used in a scam.

INPUT TO ANALYZE:
"${content.replace(/"/g, '\\"')}"

ANALYSIS STEPS:
1. Identify the medium/format (SMS, email, URL, job post, QR redirect, social media DM, etc.).
2. Categorize the scam type (Fake Job Offer, Bank Verification, Phishing, Romance Scam, Lottery Scam, Tech Support, Investment Fraud, QR Code Scam, Credential Harvesting, etc.). If legitimate, say "Legitimate".
3. Analyze psychological triggers: Urgency, Authority, Scarcity, Fear, Emotional Manipulation, Greed.
4. Evaluate risk level (Low/Medium/High/Critical) and confidence score 0-100. Be precise — use numbers like 73 or 91, not round numbers.
5. Identify vulnerable demographic groups.
6. Break down the scammer's step-by-step attack chain.
7. Write an ELI15 summary in plain, friendly language.
${urlIntelligenceBlock}

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "type": "scam category",
  "riskLevel": "Low"|"Medium"|"High"|"Critical",
  "confidenceScore": number,
  "reasoning": ["3-5 specific red flag observations"],
  "recommendedActions": ["3-5 concrete actions"],
  "preventionTips": ["3-4 prevention tips"],
  "eli15": "2-3 sentence plain English explanation",
  "vulnerableGroups": ["specific group", "another group", "another group"],
  "scammerStrategy": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
  "educationMode": {
    "techniques": [
      { "name": "Urgency", "detected": true/false, "explanation": "one sentence" },
      { "name": "Authority", "detected": true/false, "explanation": "one sentence" },
      { "name": "Scarcity", "detected": true/false, "explanation": "one sentence" },
      { "name": "Fear", "detected": true/false, "explanation": "one sentence" },
      { "name": "Emotional Manipulation", "detected": true/false, "explanation": "one sentence" },
      { "name": "Greed Appeal", "detected": true/false, "explanation": "one sentence" }
    ],
    "whyThisMatters": "one sentence"
  },
  "urlIntelligence": { ... as specified above ... }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });

    const rawText = response.text ?? "{}";
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const snippet = content.slice(0, 200) + (content.length > 200 ? "..." : "");
    await db.insert(analysesTable).values({
      contentSnippet: snippet,
      riskLevel: result.riskLevel ?? "Low",
      scamType: result.type ?? "Unknown",
      confidenceScore: result.confidenceScore ?? 0,
      fullResult: JSON.stringify(result),
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini analysis failed");
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

  const prompt = `You are a cybersecurity emergency response expert. A user has just fallen for a scam.

WHAT HAPPENED:
- Exposures: ${exposureList}
${scamContext ? `- Scam context: ${scamContext}` : ""}

Generate an IMMEDIATE recovery action plan. Be concise, calm, and actionable. Every minute matters.

Assess overall severity: "moderate" (no financial/credential exposure), "serious" (credentials exposed), or "critical" (money sent or banking details shared).

RETURN ONLY VALID JSON (no markdown):
{
  "severity": "moderate"|"serious"|"critical",
  "summary": "2-sentence calm reassurance + what to do first",
  "actions": [
    {
      "priority": "immediate",
      "title": "short action title",
      "description": "specific instructions — what exactly to do, where to go, who to call",
      "timeframe": "Do this now / Within 30 minutes / Within 24 hours"
    }
  ],
  "hotlines": ["India: Cyber Crime Helpline 1930", "India: Bank customer care (call the number on your card)", "Emergency: 112"]
}

Rules:
- "immediate" priority: things to do in the next 5 minutes
- "urgent" priority: things to do in the next hour  
- "soon" priority: things to do today
- Include 5-8 actions total, ordered by priority
- Be specific — "Call your bank at the number on the back of your card" not just "Contact your bank"
- Include the most relevant Indian helplines/hotlines`;

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

    const rawText = response.text ?? "{}";
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      res.status(500).json({ error: "Failed to parse emergency response" });
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
      .limit(20);

    res.json(
      records.map((r) => ({
        ...r,
        analyzedAt: r.analyzedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch history");
    res.status(500).json({ error: "Failed to fetch history" });
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
