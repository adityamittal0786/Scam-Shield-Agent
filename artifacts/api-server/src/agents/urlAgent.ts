/**
 * URL Intelligence Agent — ScamShield AI Multi-Agent System
 *
 * Role: Specialized agent for analyzing URLs and domains found in scam content.
 *       Runs in parallel with the Threat Analysis Agent when URLs are present.
 *
 * Responsibilities:
 * - Detect typosquatting (e.g. amaz0n, paypa1, sbi-verify.net)
 * - Identify URL shorteners that hide malicious destinations
 * - Find suspicious keywords in URL paths and parameters
 * - Score URL threat level independently
 * - Compare against known official domains for brand impersonation
 * - Generate domain comparison report
 *
 * This agent uses Gemini 2.5 Flash with a URL-specific prompt.
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export interface UrlIntelligenceResult {
  isUrl: boolean;
  domain: string;
  threatScore: number;
  possibleTyposquatting: boolean;
  typosquattingTarget: string;
  usesUrlShortener: boolean;
  suspiciousKeywords: string[];
  recommendation: string;
}

export interface DomainComparisonResult {
  detected: boolean;
  submittedDomain: string;
  officialDomain: string;
  isOfficial: boolean;
  brand: string;
}

export interface UrlAgentResult {
  urlIntelligence: UrlIntelligenceResult;
  domainComparison: DomainComparisonResult;
}

/**
 * Runs the URL Intelligence Agent on the first detected URL.
 * Returns null if no URL is present in the content.
 */
export async function runUrlAgent(
  content: string,
  extractedUrls: string[]
): Promise<UrlAgentResult | null> {
  if (extractedUrls.length === 0) return null;

  const primaryUrl = extractedUrls[0];

  const prompt = `You are the ScamShield URL Intelligence Agent. Your only job is to perform a deep security analysis of the provided URL.

URL TO ANALYZE: ${primaryUrl}
FULL CONTEXT: "${content.replace(/"/g, '\\"').slice(0, 1000)}"

Analyze the URL structure, domain name, and path for security threats.

Respond with ONLY valid JSON (no markdown):
{
  "urlIntelligence": {
    "isUrl": true,
    "domain": "extracted domain only (e.g. sbi-verify-now.xyz)",
    "threatScore": number 0-100,
    "possibleTyposquatting": bool,
    "typosquattingTarget": "brand being impersonated, or empty string",
    "usesUrlShortener": bool,
    "suspiciousKeywords": ["list", "of", "suspicious", "path", "words"],
    "recommendation": "one clear actionable sentence"
  },
  "domainComparison": {
    "detected": bool (true if impersonating a known brand),
    "submittedDomain": "domain from the URL",
    "officialDomain": "the real official domain (e.g. sbi.co.in, indiapost.gov.in, amazon.in)",
    "isOfficial": bool (false if this is a fake domain),
    "brand": "brand name being impersonated, or empty string"
  }
}

Known official domains for reference:
- SBI: sbi.co.in, onlinesbi.sbi
- HDFC Bank: hdfcbank.com
- ICICI: icicibank.com
- Amazon India: amazon.in
- Flipkart: flipkart.com
- India Post: indiapost.gov.in
- IRCTC: irctc.co.in
- PayTM: paytm.com
- PhonePe: phonepe.com
- Google: google.com
- PayPal: paypal.com
- Income Tax: incometaxindia.gov.in
- Cyber Crime Portal: cybercrime.gov.in`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  const raw = (response.text ?? "{}")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  return JSON.parse(raw) as UrlAgentResult;
}
