/**
 * Orchestrator Agent — ScamShield AI Multi-Agent System
 *
 * Role: Coordinates the entire multi-agent pipeline. Manages agent execution
 *       order, batches AI calls intelligently, and assembles the final response.
 *
 * Pipeline Architecture:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │              ORCHESTRATOR                   │
 *   │                                             │
 *   │  1. Intake Agent (sync, rule-based)         │
 *   │            │                                │
 *   │            ▼                                │
 *   │  2. Comprehensive Analysis Agent            │
 *   │     (batches: Threat + Education +          │
 *   │      Vulnerability + Attack Chain +         │
 *   │      AI Likelihood — single AI call)        │
 *   │            │                                │
 *   │            ▼                                │
 *   │  3. URL Intelligence Agent                  │
 *   │     (separate call, only if URL found)      │
 *   │            │                                │
 *   │  4. Reporting Agent (sync, rule-based)      │
 *   │            │                                │
 *   │            ▼                                │
 *   │     Assemble & Return                       │
 *   └─────────────────────────────────────────────┘
 *
 * Design Note:
 *   Each agent module defines its own focused prompt and output schema — they
 *   are independently testable and replaceable. The orchestrator batches AI calls
 *   for efficiency (avoid rate limits on free tier), which is a common production
 *   optimization for multi-agent systems.
 */

import { GoogleGenAI } from "@google/genai";
import { runIntakeAgent } from "./intakeAgent.js";
import { runUrlAgent } from "./urlAgent.js";
import { runReportingAgent } from "./reportingAgent.js";
import { sanitizeInput } from "../lib/security.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export interface OrchestratorResult {
  // From Intake Agent
  inputType: string;
  extractedUrls: string[];

  // From Threat Analysis (via comprehensive call)
  type: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  confidenceScore: number;
  reasoning: string[];
  educationMode: {
    techniques: Array<{ name: string; detected: boolean; explanation: string }>;
    whyThisMatters: string;
  };
  aiGeneratedLikelihood: {
    likelihood: "Low" | "Moderate" | "High";
    reasons: string[];
    disclaimer: string;
  };

  // From Education Agent (via comprehensive call)
  eli15: string;
  preventionTips: string[];
  recommendedActions: string[];

  // From Vulnerability + Attack Chain Agent (via comprehensive call)
  vulnerableGroups: string[];
  scammerStrategy: string[];

  // From URL Agent (optional — only when URLs detected)
  urlIntelligence?: {
    isUrl: boolean;
    domain: string;
    threatScore: number;
    possibleTyposquatting: boolean;
    typosquattingTarget: string;
    usesUrlShortener: boolean;
    suspiciousKeywords: string[];
    recommendation: string;
  };
  domainComparison?: {
    detected: boolean;
    submittedDomain: string;
    officialDomain: string;
    isOfficial: boolean;
    brand: string;
  };

  // From Reporting Agent (sync)
  reportingLinks: Array<{ platform: string; url: string; description: string }>;
}

/**
 * Comprehensive analysis prompt used by the orchestrator.
 *
 * This single prompt covers the responsibilities of:
 *   - Threat Analysis Agent (scam type, tactics, risk, confidence)
 *   - Education Agent (eli15, prevention tips, recommended actions)
 *   - Vulnerability Agent (at-risk groups)
 *   - Attack Chain Agent (step-by-step strategy)
 *   - AI Detection Agent (likelihood content is AI-generated)
 *
 * Batching these into one call avoids rate limit exhaustion while preserving
 * the modular agent architecture at the code level.
 */
async function runComprehensiveAnalysis(
  content: string,
  inputType: string,
  detectedBrands: string[]
): Promise<Omit<OrchestratorResult, "inputType" | "extractedUrls" | "urlIntelligence" | "domainComparison" | "reportingLinks">> {
  const brandContext = detectedBrands.length > 0
    ? `Detected brand mentions: ${detectedBrands.join(", ")}.`
    : "";

  const prompt = `You are the ScamShield AI system — a multi-agent threat analysis platform. Analyze the content below across all agent domains.

Input type: ${inputType}
${brandContext}

CONTENT:
"${content.replace(/"/g, '\\"').slice(0, 3000)}"

Produce a complete multi-domain analysis covering all agent responsibilities. Use specific evidence from the content. Use precise confidence scores (e.g. 73, 91), not round numbers.

Respond with ONLY valid JSON (no markdown fences):
{
  "type": "specific scam category (e.g. OTP Fraud, Fake Job Offer, Phishing, Investment Scam, Impersonation, Delivery Scam, Romance Scam, Tech Support Scam, Lottery Scam, QR Code Scam — or 'Legitimate' if safe)",
  "riskLevel": "Low"|"Medium"|"High"|"Critical",
  "confidenceScore": number 0-100,
  "reasoning": ["specific red flag 1 with evidence", "red flag 2", "red flag 3", "red flag 4"],
  "educationMode": {
    "techniques": [
      { "name": "Urgency", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Authority", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Scarcity", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Fear", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Emotional Manipulation", "detected": bool, "explanation": "one sentence specific to this content" },
      { "name": "Greed Appeal", "detected": bool, "explanation": "one sentence specific to this content" }
    ],
    "whyThisMatters": "one sentence about why understanding this specific scam is important"
  },
  "aiGeneratedLikelihood": {
    "likelihood": "Low"|"Moderate"|"High",
    "reasons": ["reason 1", "reason 2"],
    "disclaimer": "This is an estimate and not proof of AI generation."
  },
  "eli15": "2-3 sentence plain English explanation a 15-year-old can understand. What is this trying to do and why is it dangerous?",
  "preventionTips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "recommendedActions": [
    "Immediate action 1 — be specific (e.g. Do not click any links in this message)",
    "Immediate action 2",
    "Immediate action 3",
    "Immediate action 4"
  ],
  "vulnerableGroups": [
    "Demographic group — brief reason why (e.g. 'First-time smartphone users — unfamiliar with phishing indicators')",
    "Another group — reason",
    "Another group — reason"
  ],
  "scammerStrategy": [
    "Step 1: specific action the scammer takes",
    "Step 2: specific action",
    "Step 3: specific action",
    "Step 4: how the scammer benefits"
  ]
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

  const raw = (response.text ?? "{}")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  return JSON.parse(raw);
}

/**
 * Runs the full ScamShield multi-agent pipeline.
 * @param rawInput — Raw user-provided content to analyze
 * @returns Assembled analysis result from all agents
 */
export async function runOrchestrator(rawInput: string): Promise<OrchestratorResult> {
  // ── Step 1: Sanitize input before any agent sees it ──────────────────────
  const content = sanitizeInput(rawInput);

  // ── Step 2: Intake Agent (synchronous, no AI) ────────────────────────────
  // Classifies input type, extracts URLs, detects brands — instant
  const intake = runIntakeAgent(content);

  // ── Step 3: Comprehensive Analysis (single Gemini call) ──────────────────
  // Covers: Threat Agent + Education Agent + Vulnerability Agent + Attack Chain Agent
  // Batched into one call to respect free-tier rate limits while preserving
  // the modular agent architecture in code.
  const analysis = await runComprehensiveAnalysis(
    content,
    intake.inputType,
    intake.detectedBrands
  );

  // ── Step 4: URL Intelligence Agent (separate call, only when URLs found) ─
  // Runs as a separate focused agent because URL analysis requires different
  // context and reasoning than the main threat assessment.
  let urlResult = null;
  if (intake.extractedUrls.length > 0) {
    try {
      urlResult = await runUrlAgent(content, intake.extractedUrls);
    } catch {
      // URL agent failure is non-fatal — analysis continues without it
      urlResult = null;
    }
  }

  // ── Step 5: Reporting Agent (synchronous, rule-based) ────────────────────
  const reportingLinks = runReportingAgent(analysis.type);

  // ── Step 6: Assemble final response ──────────────────────────────────────
  const assembled: OrchestratorResult = {
    // Intake metadata
    inputType: intake.inputType,
    extractedUrls: intake.extractedUrls,

    // Threat analysis + all other agents from comprehensive call
    ...analysis,

    // URL Intelligence (present only if URLs were found)
    ...(urlResult && {
      urlIntelligence: urlResult.urlIntelligence,
      domainComparison: urlResult.domainComparison,
    }),

    // Reporting links
    reportingLinks,
  };

  return assembled;
}
