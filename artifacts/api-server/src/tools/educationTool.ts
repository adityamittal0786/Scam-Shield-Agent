/**
 * educationTool — MCP-style Tool Layer
 *
 * Wraps the Education Agent as a callable MCP-style tool.
 */

import { runEducationAgent, type EducationResult } from "../agents/educationAgent.js";
import type { ThreatResult } from "../agents/threatAgent.js";

export interface EducationToolInput {
  content: string;
  threat: ThreatResult;
}

export interface EducationToolOutput {
  toolName: "education";
  result: EducationResult;
  executionMs: number;
}

const FALLBACK: EducationResult = {
  eli15: "This content may be a scam. Do not share personal information or click any links until you verify the source.",
  preventionTips: ["Always verify the sender", "Never share OTPs", "Report suspicious messages"],
  recommendedActions: ["Do not respond", "Block the sender", "Report to cybercrime.gov.in"],
};

/**
 * MCP Tool: education
 * Generates plain-language educational content and actionable guidance.
 */
export async function educationTool(
  input: EducationToolInput
): Promise<EducationToolOutput> {
  const start = Date.now();
  try {
    const result = await runEducationAgent(input.content, input.threat);
    return { toolName: "education", result, executionMs: Date.now() - start };
  } catch {
    return { toolName: "education", result: FALLBACK, executionMs: Date.now() - start };
  }
}
