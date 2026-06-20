/**
 * Intake Agent — ScamShield AI Multi-Agent System
 *
 * Role: First agent in the pipeline. Classifies input type and extracts
 *       structural metadata WITHOUT making an AI call (fast, deterministic).
 *
 * Responsibilities:
 * - Detect input medium (SMS, Email, URL, Job listing, QR content, Social DM, etc.)
 * - Extract embedded URLs
 * - Detect mentioned brand names that may be impersonated
 * - Provide structured metadata for downstream agents
 *
 * This agent runs synchronously and completes in <1ms.
 */

export interface IntakeResult {
  inputType: InputType;
  extractedUrls: string[];
  detectedBrands: string[];
  containsPhoneNumbers: boolean;
  containsMoneyAmounts: boolean;
  characterCount: number;
}

export type InputType =
  | "URL"
  | "SMS"
  | "Email"
  | "Job Listing"
  | "QR Code Content"
  | "Social Media DM"
  | "Phone Call Script"
  | "General Text";

// Known brands commonly impersonated in Indian scams
const BRAND_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "SBI", pattern: /\bsbi\b/i },
  { name: "HDFC Bank", pattern: /\bhdfc\b/i },
  { name: "ICICI Bank", pattern: /\bicici\b/i },
  { name: "PayTM", pattern: /\bpaytm\b/i },
  { name: "Google Pay", pattern: /\bgpay\b|\bgoogle\s+pay\b/i },
  { name: "PhonePe", pattern: /\bphonepe\b/i },
  { name: "Amazon", pattern: /\bamazon\b/i },
  { name: "Flipkart", pattern: /\bflipkart\b/i },
  { name: "India Post", pattern: /\bindia\s+post\b/i },
  { name: "TRAI", pattern: /\btrai\b/i },
  { name: "IRCTC", pattern: /\birctc\b/i },
  { name: "Aadhaar", pattern: /\baadhaar\b/i },
  { name: "PAN Card", pattern: /\bpan\s+card\b/i },
  { name: "PayPal", pattern: /\bpaypal\b/i },
  { name: "WhatsApp", pattern: /\bwhatsapp\b/i },
  { name: "SEBI", pattern: /\bsebi\b/i },
  { name: "Cyber Crime Division", pattern: /\bcyber\s*crime\b/i },
  { name: "Income Tax Department", pattern: /\bincome\s+tax\b/i },
  { name: "RBI", pattern: /\brbi\b/i },
];

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
const PHONE_REGEX = /(\+91[\-\s]?)?[6-9]\d{9}|\d{4}[\-\s]\d{4}|\b1[89]00\s*\d{2,3}\s*\d{4}\b/g;
const MONEY_REGEX = /₹[\s]?\d+|rs\.?\s*\d+|\d+\s*rupees?|\$\d+|usd\s*\d+/gi;

/**
 * Classifies the input medium based on structural signals and keywords.
 */
function classifyInputType(input: string): InputType {
  const lower = input.toLowerCase();

  // Pure URL input
  if (/^https?:\/\/\S+$/.test(input.trim())) return "URL";

  // Email signals
  if (
    /\bsubject\s*:/i.test(input) ||
    /\bfrom\s*:/i.test(input) ||
    /\bto\s*:/i.test(input) ||
    /\bdear\s+(sir|ma'am|customer|user|valued)/i.test(input)
  )
    return "Email";

  // Job listing signals
  if (
    /\b(work\s+from\s+home|wfh|hiring|job\s+(offer|opportunity)|salary|per\s+month|lpa|ctc)\b/i.test(input) &&
    /\b(apply|requirement|qualification|experience|position)\b/i.test(input)
  )
    return "Job Listing";

  // QR code content (typically raw URLs or short codes)
  if (
    /^(https?:\/\/|upi:\/\/|bitcoin:|ethereum:)/i.test(input.trim()) &&
    input.trim().split(/\s+/).length < 5
  )
    return "QR Code Content";

  // Phone call script signals
  if (
    /\b(calling|i\s+am\s+calling|speaking|officer|department|police|cyber\s+crime|arrest|warrant)\b/i.test(input) &&
    lower.includes("your")
  )
    return "Phone Call Script";

  // Social media DM signals
  if (
    /\b(dm|message|follow|profile|instagram|facebook|twitter|telegram|linkedin)\b/i.test(input)
  )
    return "Social Media DM";

  // SMS-length check (under 160 chars with short words typical of SMS)
  if (input.length < 300 && /\b(click|tap|verify|otp|bank|account)\b/i.test(lower)) {
    return "SMS";
  }

  return "General Text";
}

/**
 * Runs the Intake Agent on the provided input.
 * Returns structured metadata for downstream agents.
 */
export function runIntakeAgent(input: string): IntakeResult {
  const extractedUrls = Array.from(new Set(input.match(URL_REGEX) ?? []));
  const containsPhoneNumbers = PHONE_REGEX.test(input);
  const containsMoneyAmounts = MONEY_REGEX.test(input);

  const detectedBrands = BRAND_PATTERNS
    .filter(({ pattern }) => pattern.test(input))
    .map(({ name }) => name);

  const inputType = classifyInputType(input);

  return {
    inputType,
    extractedUrls,
    detectedBrands,
    containsPhoneNumbers,
    containsMoneyAmounts,
    characterCount: input.length,
  };
}
