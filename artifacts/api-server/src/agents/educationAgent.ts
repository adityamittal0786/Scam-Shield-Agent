/**
 * Education Agent — ScamShield AI Multi-Agent System
 *
 * Role: Generates beginner-friendly educational content based on the threat
 *       assessment produced by the Threat Analysis Agent.
 *
 * Responsibilities:
 * - Produce an ELI15 (Explain Like I'm 15) plain-English summary
 * - Generate specific, actionable prevention tips
 * - Provide concrete recommended actions for the user
 *
 * This agent runs after the Threat Agent and uses its output.
 * It uses Gemini 2.5 Flash with an education-focused prompt.
 */

import { GoogleGenAI } from "@google/genai";
import type { ThreatResult } from "./threatAgent.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export interface EducationResult {
  eli15: string;
  preventionTips: string[];
  recommendedActions: string[];
}

/**
 * Runs the Education Agent.
 * Translates technical threat analysis into accessible, actionable guidance.
 */
export async function runEducationAgent(
  content: string,
  threat: ThreatResult
): Promise<EducationResult> {
  const prompt = `You are the ScamShield Education Agent. Your job is to translate a threat analysis result into simple, actionable guidance for everyday users — including people who are not tech-savvy.

SCAM TYPE: ${threat.type}
RISK LEVEL: ${threat.riskLevel}
DETECTED RED FLAGS: ${threat.reasoning.join("; ")}

ORIGINAL CONTENT:
"${content.replace(/"/g, '\\"').slice(0, 1000)}"

Generate user-friendly educational content. Use plain language a 15-year-old can understand.

Respond with ONLY valid JSON (no markdown):
{
  "eli15": "2-3 sentence plain English explanation of what this scam is trying to do and why it's dangerous. No jargon.",
  "preventionTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "recommendedActions": [
    "Immediate action 1 — be specific (e.g. Do not click any links in this message)",
    "Immediate action 2",
    "Immediate action 3",
    "Immediate action 4"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  });

  const raw = (response.text ?? "{}")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  return JSON.parse(raw) as EducationResult;
}
