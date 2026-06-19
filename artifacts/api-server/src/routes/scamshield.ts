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
    const prompt = `You are the ScamShield AI Agent. Perform a multi-step security reasoning analysis on the provided text.

TEXT TO ANALYZE:
"${content.replace(/"/g, '\\"')}"

STEPS:
1. Categorize the scam type (e.g., Fake Job Offer, Bank Verification, Phishing, Romance Scam, Lottery Scam, Tech Support, Investment Fraud, Emergency Scam, Prize Winning, etc.). If it appears legitimate, say "Legitimate".
2. Analyze psychological triggers: Urgency, Authority, Scarcity, Fear, Emotional Manipulation, Greed, Trust Building.
3. Evaluate risk level (Low, Medium, High, Critical) and assign confidence score 0-100.
4. Formulate an 'Explain Like I'm 15' (ELI15) summary in plain, friendly language.

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "type": "string describing scam category",
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "confidenceScore": number between 0 and 100,
  "reasoning": ["array", "of", "specific", "reasoning", "points"],
  "recommendedActions": ["array", "of", "specific", "recommended", "actions"],
  "preventionTips": ["array", "of", "prevention", "tips"],
  "eli15": "A friendly explanation for a 15-year-old of why this is or isn't suspicious",
  "educationMode": {
    "techniques": [
      {
        "name": "Urgency",
        "detected": true or false,
        "explanation": "How this technique is used or why it's absent"
      },
      {
        "name": "Authority",
        "detected": true or false,
        "explanation": "How this technique is used or why it's absent"
      },
      {
        "name": "Scarcity",
        "detected": true or false,
        "explanation": "How this technique is used or why it's absent"
      },
      {
        "name": "Fear",
        "detected": true or false,
        "explanation": "How this technique is used or why it's absent"
      },
      {
        "name": "Emotional Manipulation",
        "detected": true or false,
        "explanation": "How this technique is used or why it's absent"
      },
      {
        "name": "Greed Appeal",
        "detected": true or false,
        "explanation": "How this technique is used or why it's absent"
      }
    ],
    "whyThisMatters": "Why recognizing these patterns matters for personal safety"
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
