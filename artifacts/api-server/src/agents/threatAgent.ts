/**
 * Threat Analysis Agent — ScamShield AI Multi-Agent System
 *
 * Role: Core analysis agent. Identifies scam type, psychological tactics,
 *       risk level, and generates confidence-scored threat assessment.
 *
 * Responsibilities:
 * - Classify scam category (Phishing, Job Scam, OTP Fraud, etc.)
 * - Detect psychological manipulation triggers
 * - Score confidence and risk level
 * - Extract specific red flags with evidence
 * - Assess AI-generated content likelihood
 *
 * This agent uses Gemini 2.5 Flash with a focused, scoped prompt.
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export interface ThreatResult {
  type: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  confidenceScore: number;
  reasoning: string[];
  educationMode: {
    techniques: Array<{
      name: string;
      detected: boolean;
      explanation: string;
    }>;
    whyThisMatters: string;
  };
  aiGeneratedLikelihood: {
    likelihood: "Low" | "Moderate" | "High";
    reasons: string[];
    disclaimer: string;
  };
}

/**
 * Runs the Threat Analysis Agent.
 * Accepts the raw content and intake metadata to produce a focused threat report.
 */
export async function runThreatAgent(
  content: string,
  inputType: string,
  detectedBrands: string[]
): Promise<ThreatResult> {
  const brandContext = detectedBrands.length > 0
    ? `Detected brand mentions: ${detectedBrands.join(", ")}.`
    : "";

  const prompt = `You are the ScamShield Threat Analysis Agent. Your only job is to analyze the provided content for scam indicators and psychological manipulation tactics.

Input type already classified as: ${inputType}
${brandContext}

CONTENT TO ANALYZE:
"${content.replace(/"/g, '\\"').slice(0, 3000)}"

Produce a focused threat assessment. Use precise confidence scores (e.g. 73, 91) not round numbers.

Respond with ONLY valid JSON (no markdown):
{
  "type": "specific scam category (e.g. OTP Fraud, Fake Job Offer, Phishing, Investment Scam, Impersonation, Delivery Scam, Romance Scam, Tech Support Scam, Lottery Scam, or Legitimate if safe)",
  "riskLevel": "Low"|"Medium"|"High"|"Critical",
  "confidenceScore": number,
  "reasoning": ["specific red flag 1", "specific red flag 2", "specific red flag 3", "specific red flag 4"],
  "educationMode": {
    "techniques": [
      { "name": "Urgency", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Authority", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Scarcity", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Fear", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Emotional Manipulation", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Greed Appeal", "detected": bool, "explanation": "one sentence specific to this content" }
    ],
    "whyThisMatters": "one sentence about why understanding this scam is important"
  },
  "aiGeneratedLikelihood": {
    "likelihood": "Low"|"Moderate"|"High",
    "reasons": ["reason 1", "reason 2"],
    "disclaimer": "This is an estimate and not proof of AI generation."
  }
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  const raw = (response.text ?? "{}")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  return JSON.parse(raw) as ThreatResult;
}
