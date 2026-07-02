/**
 * educationTool — MCP-style Tool Layer
 *
 * Wraps the Education Agent as a callable MCP-style tool.
 */
import { type EducationResult } from "../agents/educationAgent.js";
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
/**
 * MCP Tool: education
 * Generates plain-language educational content and actionable guidance.
 */
export declare function educationTool(input: EducationToolInput): Promise<EducationToolOutput>;
