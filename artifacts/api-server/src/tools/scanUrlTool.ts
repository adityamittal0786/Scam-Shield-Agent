/**
 * scanUrlTool — MCP-style Tool Layer
 *
 * Wraps the URL Intelligence Agent as a callable MCP-style tool.
 * Returns null safely when no URLs are present.
 */

import { runUrlAgent, type UrlAgentResult } from "../agents/urlAgent.js";

export interface ScanUrlToolInput {
  content: string;
  extractedUrls: string[];
}

export interface ScanUrlToolOutput {
  toolName: "scanUrl";
  result: UrlAgentResult | null;
  executionMs: number;
}

/**
 * MCP Tool: scanUrl
 * Analyzes URLs for typosquatting, domain impersonation, and threat signals.
 */
export async function scanUrlTool(
  input: ScanUrlToolInput
): Promise<ScanUrlToolOutput> {
  const start = Date.now();
  try {
    const result = await runUrlAgent(input.content, input.extractedUrls);
    return { toolName: "scanUrl", result, executionMs: Date.now() - start };
  } catch {
    return { toolName: "scanUrl", result: null, executionMs: Date.now() - start };
  }
}
