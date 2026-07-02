/**
 * analyzeThreatTool — MCP-style Tool Layer
 *
 * Wraps the Threat Analysis Agent as a callable MCP-style tool.
 * Handles errors gracefully and returns a safe fallback on failure.
 */
import { type ThreatResult } from "../agents/threatAgent.js";
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
/**
 * MCP Tool: analyzeThreat
 * Performs scam classification and psychological tactic detection.
 */
export declare function analyzeThreatTool(input: AnalyzeThreatToolInput): Promise<AnalyzeThreatToolOutput>;
