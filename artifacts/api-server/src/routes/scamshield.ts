import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { AnalyzeContentBody } from "@workspace/api-zod";

const router = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const { content } = parsed.data;

  try {
    const prompt = `You are the ScamShield AI Agent. Analyze the provided input which may be a text message, email, URL, QR code content, social media post, job listing, or any other form of communication that could be used in a scam.

INPUT TO ANALYZE:
"${content.replace(/"/g, '\\"')}"

ANALYSIS STEPS:
1. Identify the medium/format (e.g., SMS, email, URL, job post, QR redirect, social media DM).
2. Categorize the scam type (e.g., Fake Job Offer, Bank Verification, Phishing, Romance Scam, Lottery Scam, Tech Support, Investment Fraud, Emergency Scam, Prize Winning, QR Code Scam, Credential Harvesting, etc.). If legitimate, say "Legitimate".
3. Analyze psychological triggers: Urgency, Authority, Scarcity, Fear, Emotional Manipulation, Greed, Trust Building.
4. Evaluate risk level (Low/Medium/High/Critical) and confidence score 0-100. Be precise — use specific numbers like 73 or 91, not round numbers like 70 or 90.
5. Identify which demographic groups are most vulnerable to this specific scam.
6. Break down the scammer's step-by-step strategy as a numbered attack chain.
7. Write an ELI15 summary in friendly, plain language.

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "type": "string describing scam category",
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "confidenceScore": number 0-100 (be precise, not round),
  "reasoning": ["3-5 specific red flag observations"],
  "recommendedActions": ["3-5 concrete actions to take right now"],
  "preventionTips": ["3-4 tips to avoid this type of scam in future"],
  "eli15": "2-3 sentence plain English explanation for a 15-year-old",
  "vulnerableGroups": ["specific demographic or situation description", "another group", "another group"],
  "scammerStrategy": ["Step 1: what scammer does first", "Step 2: next action", "Step 3: how they extract value", "Step 4: what happens to the victim"],
  "educationMode": {
    "techniques": [
      { "name": "Urgency", "detected": true or false, "explanation": "one sentence" },
      { "name": "Authority", "detected": true or false, "explanation": "one sentence" },
      { "name": "Scarcity", "detected": true or false, "explanation": "one sentence" },
      { "name": "Fear", "detected": true or false, "explanation": "one sentence" },
      { "name": "Emotional Manipulation", "detected": true or false, "explanation": "one sentence" },
      { "name": "Greed Appeal", "detected": true or false, "explanation": "one sentence" }
    ],
    "whyThisMatters": "one sentence on why recognizing these patterns matters"
  }
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

    // Save to DB
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
    for (const row of byRiskRows) {
      byRiskLevel[row.riskLevel] = row.count;
    }

    const byType: Record<string, number> = {};
    for (const row of byTypeRows) {
      byType[row.scamType] = row.count;
    }

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
