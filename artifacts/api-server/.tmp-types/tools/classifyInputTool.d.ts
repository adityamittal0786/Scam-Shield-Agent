/**
 * classifyInputTool — MCP-style Tool Layer
 *
 * Wraps the Intake Agent as a callable tool following the
 * Model Context Protocol (MCP) tool interface pattern.
 *
 * In a full MCP deployment this tool would be registered with an MCP server
 * and discoverable by any compatible AI host. Here it serves as a structured
 * wrapper that enforces typed I/O and makes the agent's capability explicit.
 */
import { type IntakeResult } from "../agents/intakeAgent.js";
export interface ClassifyInputToolInput {
    content: string;
}
export interface ClassifyInputToolOutput {
    toolName: "classifyInput";
    result: IntakeResult;
    executionMs: number;
}
/**
 * MCP Tool: classifyInput
 * Classifies the input medium and extracts structural metadata.
 */
export declare function classifyInputTool(input: ClassifyInputToolInput): Promise<ClassifyInputToolOutput>;
