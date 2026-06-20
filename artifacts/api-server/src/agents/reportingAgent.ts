/**
 * Reporting Agent — ScamShield AI Multi-Agent System
 *
 * Role: Generates context-aware reporting links and actions based on the
 *       specific scam type detected by the Threat Analysis Agent.
 *
 * Responsibilities:
 * - Match scam type to relevant Indian and international reporting authorities
 * - Provide direct, actionable report URLs
 * - Suggest platform-specific reporting (LinkedIn for job scams, etc.)
 *
 * This agent is deterministic (no AI call) — it uses a rule-based mapping
 * for speed and reliability. Reporting links don't require AI inference.
 */

export interface ReportingLink {
  platform: string;
  url: string;
  description: string;
}

// ─── Static Reporting Destinations ────────────────────────────────────────────
// Always-included baseline for any cyber scam in India
const BASE_REPORTS: ReportingLink[] = [
  {
    platform: "Cyber Crime Portal",
    url: "https://cybercrime.gov.in",
    description: "Report to India's National Cyber Crime Reporting Portal (Helpline: 1930)",
  },
  {
    platform: "CERT-In",
    url: "https://www.cert-in.org.in/s2cMainServlet?pageid=WEBFORM",
    description: "Report to India's Computer Emergency Response Team",
  },
];

// ─── Scam-Type-Specific Reporting ─────────────────────────────────────────────
const SCAM_SPECIFIC_REPORTS: Record<string, ReportingLink[]> = {
  "OTP Fraud": [
    { platform: "Your Bank Fraud Helpline", url: "https://www.rbi.org.in", description: "Call the number on the back of your bank card immediately" },
    { platform: "RBI Complaint Portal", url: "https://cms.rbi.org.in", description: "File a complaint against unauthorized banking transactions" },
  ],
  "Phishing": [
    { platform: "TRAI Spam Reporting", url: "https://www.trai.gov.in", description: "Report phishing SMS/calls to the Telecom Regulatory Authority of India" },
    { platform: "Google Safe Browsing", url: "https://safebrowsing.google.com/safebrowsing/report_phish/", description: "Report phishing URLs to Google to protect others" },
  ],
  "Fake Job Offer": [
    { platform: "LinkedIn Report", url: "https://www.linkedin.com/help/linkedin/answer/37822", description: "Report fake job listings on LinkedIn" },
    { platform: "Indeed Report Fraud", url: "https://support.indeed.com/hc/en-us/requests/new", description: "Report fraudulent job postings on Indeed" },
    { platform: "Ministry of Labour", url: "https://labour.gov.in", description: "Report illegal recruitment fraud to the Ministry of Labour" },
  ],
  "Investment Scam": [
    { platform: "SEBI SCORES", url: "https://scores.gov.in", description: "Report investment fraud to SEBI (Securities and Exchange Board of India)" },
    { platform: "RBI Complaint Portal", url: "https://cms.rbi.org.in", description: "Report unauthorized financial activity" },
  ],
  "QR Code Scam": [
    { platform: "Your Bank Fraud Helpline", url: "https://www.rbi.org.in", description: "Report unauthorized UPI transactions immediately" },
    { platform: "NPCI Complaint", url: "https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism", description: "Report fraudulent UPI/QR transactions to NPCI" },
  ],
  "Impersonation": [
    { platform: "TRAI Spam Reporting", url: "https://www.trai.gov.in/consumer-info/spam", description: "Report impersonation calls to TRAI" },
    { platform: "Local Police", url: "https://www.india.gov.in/topics/law-justice/police", description: "File an FIR at your local cyber crime police station" },
  ],
  "Tech Support Scam": [
    { platform: "Microsoft Report", url: "https://www.microsoft.com/en-us/wdsi/support/report-unsafe-site-guest", description: "Report Microsoft impersonation to Microsoft" },
    { platform: "Google Report", url: "https://safebrowsing.google.com/safebrowsing/report_phish/", description: "Report Google impersonation to Google" },
  ],
};

/**
 * Runs the Reporting Agent.
 * Returns contextual reporting links based on scam type. No AI call needed.
 */
export function runReportingAgent(scamType: string): ReportingLink[] {
  const links: ReportingLink[] = [...BASE_REPORTS];

  // Find matching specific reports (fuzzy match on scam type keywords)
  for (const [key, extraLinks] of Object.entries(SCAM_SPECIFIC_REPORTS)) {
    if (
      scamType.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(scamType.toLowerCase())
    ) {
      links.push(...extraLinks);
      break;
    }
  }

  // Deduplicate by platform name
  const seen = new Set<string>();
  return links.filter(({ platform }) => {
    if (seen.has(platform)) return false;
    seen.add(platform);
    return true;
  });
}
