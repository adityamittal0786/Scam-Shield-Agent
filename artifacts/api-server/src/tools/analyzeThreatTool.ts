/**
 * analyzeThreatTool — MCP-style Tool Layer
 *
 * Wraps the Threat Analysis Agent as a callable MCP-style tool.
 * Handles errors gracefully and returns a safe fallback on failure.
 */

import { runThreatAgent, type ThreatResult } from "../agents/threatAgent.js";

export interface AnalyzeThreatToolInput {
  content: string;
  inputType: string;
  detectedBrands: string[];
}

export interface AnalyzeThreatToolOutput {
  toolName: "analyzeThreat";
  result: ThreatResult;
  executionMs: number;
}

const FALLBACK_THREAT: ThreatResult = {
  type: "Unknown",
  riskLevel: "Medium",
  confidenceScore: 50,
  reasoning: ["Analysis incomplete — please try again"],
  educationMode: {
    techniques: [],
    whyThisMatters: "Could not complete threat analysis at this time.",
  },
  aiGeneratedLikelihood: {
    likelihood: "Low",
    reasons: [],
    disclaimer: "This is an estimate and not proof of AI generation.",
  },
};

/**
 * MCP Tool: analyzeThreat
 * Performs scam classification and psychological tactic detection.
 */
export async function analyzeThreatTool(
  input: AnalyzeThreatToolInput
): Promise<AnalyzeThreatToolOutput> {
  const start = Date.now();
  try {
    const result = await runThreatAgent(
      input.content,
      input.inputType,
      input.detectedBrands
    );
    return { toolName: "analyzeThreat", result, executionMs: Date.now() - start };
  } catch {
    return { toolName: "analyzeThreat", result: FALLBACK_THREAT, executionMs: Date.now() - start };
  }
}
