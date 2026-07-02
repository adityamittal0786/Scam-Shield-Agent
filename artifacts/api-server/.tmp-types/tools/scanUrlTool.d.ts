/**
 * scanUrlTool — MCP-style Tool Layer
 *
 * Wraps the URL Intelligence Agent as a callable MCP-style tool.
 * Returns null safely when no URLs are present.
 */
import { type UrlAgentResult } from "../agents/urlAgent.js";
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
export declare function scanUrlTool(input: ScanUrlToolInput): Promise<ScanUrlToolOutput>;
