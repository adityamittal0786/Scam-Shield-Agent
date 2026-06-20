# ScamShield AI Agent

> **Kaggle 5-Day AI Agents Intensive — Capstone Project**  
> Track: **Agents for Good**  
> Stack: Node.js · TypeScript · Express · Google Gemini 2.5 Flash · PostgreSQL · React · Vite

ScamShield is a multi-agent AI system that analyzes suspicious messages, URLs, QR codes, emails, and job offers — then explains what the scam is, how it works, who it targets, and exactly what the user should do next.

**Live Demo:** [ScamShield on Replit](https://scamshield.replit.app)  
**Video:** [YouTube Demo (5 min)](https://youtube.com/your-link-here)

---

## The Problem

Over **₹11,000 crore** is lost to cyber fraud in India every year. Most victims are not tech-illiterate — they are caught off-guard by psychologically sophisticated attacks that exploit urgency, authority, and fear. Existing tools tell you *if* something is a scam; ScamShield tells you *why* it works and *what to do about it*.

---

## Agent Architecture

ScamShield implements a true multi-agent pipeline inspired by Google's Agent Development Kit (ADK). Seven specialized agents collaborate — each with a focused responsibility, independent prompt, and typed output schema.

```
 User Input
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. INTAKE AGENT  (sync, rule-based, no AI call)        │   │
│  │  · Detects input type: SMS / Email / URL / Job Listing   │   │
│  │  · Extracts embedded URLs                                │   │
│  │  · Identifies impersonated brands (SBI, Amazon, etc.)   │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  2. COMPREHENSIVE ANALYSIS  (single Gemini call)         │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐  │   │
│  │  │   THREAT    │  │   EDUCATION    │  │ VULNERABILITY │  │   │
│  │  │   AGENT     │  │   AGENT        │  │   AGENT       │  │   │
│  │  │             │  │                │  │               │  │   │
│  │  │ · Scam type │  │ · ELI15 explai │  │ · At-risk     │  │   │
│  │  │ · Risk level│  │ · Prevention   │  │   groups      │  │   │
│  │  │ · Tactics   │  │   tips         │  │ · Attack      │  │   │
│  │  │ · Confidence│  │ · Actions      │  │   chain       │  │   │
│  │  └─────────────┘  └────────────────┘  └──────────────┘  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  3. URL INTELLIGENCE AGENT  (separate Gemini call)       │   │
│  │  · Only activates when URLs are detected                 │   │
│  │  · Typosquatting detection (amaz0n, sbi-verify.xyz)      │   │
│  │  · Domain comparison vs official brand domains           │   │
│  │  · URL threat score + suspicious keyword extraction      │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │  4. REPORTING AGENT  (sync, rule-based, no AI call)      │   │
│  │  · Maps scam type → relevant reporting authorities       │   │
│  │  · cybercrime.gov.in, CERT-In, SEBI, RBI, TRAI, etc.    │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│                    Final Response                               │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Modules

| File | Agent | AI Call | Responsibility |
|------|-------|---------|----------------|
| `intakeAgent.ts` | Intake Agent | ❌ Rules | Input classification, URL extraction, brand detection |
| `threatAgent.ts` | Threat Analysis Agent | ✅ Gemini | Scam type, risk level, confidence, psychological tactics |
| `educationAgent.ts` | Education Agent | ✅ Gemini | ELI15 explanation, prevention tips, recommended actions |
| `vulnerabilityAgent.ts` | Vulnerability Agent | ✅ Gemini | At-risk demographic groups, attacker's step-by-step strategy |
| `urlAgent.ts` | URL Intelligence Agent | ✅ Gemini | Domain analysis, typosquatting, threat scoring |
| `reportingAgent.ts` | Reporting Agent | ❌ Rules | Context-aware reporting links (Indian + global authorities) |
| `orchestrator.ts` | Orchestrator | — | Pipeline coordination, agent sequencing, response assembly |

---

## MCP-Style Tool System

Each agent is wrapped in a typed **MCP-style tool** (`/src/tools/`) that enforces:
- Structured input/output schemas (TypeScript interfaces)
- Safe fallback responses on agent failure
- Execution timing metadata
- Independent testability

```
tools/
├── classifyInputTool.ts    → wraps intakeAgent
├── analyzeThreatTool.ts    → wraps threatAgent
├── scanUrlTool.ts          → wraps urlAgent
├── educationTool.ts        → wraps educationAgent
└── vulnerabilityTool.ts    → wraps vulnerabilityAgent
```

---

## Security Features

`/src/lib/security.ts` implements four defensive layers:

### 1. Prompt Injection Detection
Thirteen regex patterns detect known injection phrases before any input reaches an agent:
```
"ignore previous instructions" / "system prompt" / "act as" / "DAN mode" / "jailbreak" ...
```

### 2. Input Sanitization
- Strips null bytes (`\0`) and zero-width characters
- Normalizes unicode to prevent encoding attacks
- Enforces 5,000 character maximum

### 3. In-Memory Rate Limiting
- 10 analyses per minute per IP
- Rolling time window with automatic stale-entry cleanup
- Returns `Retry-After` duration on limit exceeded

### 4. Safe Fallback Responses
- All agent failures return non-revealing error messages
- No internal implementation details leaked to clients
- JSON schema validation via Zod before agents are invoked

---

## Agent Thinking Timeline (UI)

While the agent pipeline runs, the frontend displays a real-time animated timeline showing which agent is active:

```
✅ Intake Agent          — Classifying input type and extracting entities
⟳ Threat Analysis Agent — Scanning for scam patterns and psychological tactics   ← active
◯ URL Intelligence Agent — Analyzing domain and checking for typosquatting
◯ Education Agent        — Generating plain-language explanation and safety tips
◯ Vulnerability Agent    — Identifying at-risk groups and mapping attack chain
◯ Reporting Agent        — Selecting relevant authorities to report this scam
◯ Orchestrator           — Assembling final threat report
```

---

## Supported Input Types

The Intake Agent automatically classifies:

| Type | Example |
|------|---------|
| **SMS** | "URGENT: Your SBI account is suspended. Click here..." |
| **Email** | Phishing emails with Subject/From/Dear fields |
| **URL** | `http://sbi-verify-now.xyz` |
| **QR Code Content** | Decoded QR text (UPI deep links, short URLs) |
| **Job Listing** | "Work from home, ₹50,000/month, no experience needed" |
| **Phone Call Script** | "I'm calling from Cyber Crime Division..." |
| **Social Media DM** | Instagram/WhatsApp DMs requesting personal info |

---

## Scam Categories Detected

OTP Fraud · Phishing · Fake Job Offer · Investment Scam · Impersonation (Police/Government) · QR Code Scam · Delivery Scam · Romance Scam · Tech Support Scam · Lottery Scam

---

## Psychological Tactics Analyzed

For each analysis, ScamShield detects 6 manipulation techniques:

| Technique | What it looks for |
|-----------|-------------------|
| **Urgency** | Time pressure, countdown language ("2 hours", "immediately") |
| **Authority** | Government/police/bank impersonation |
| **Scarcity** | Limited slots, exclusive offers |
| **Fear** | Arrest threats, account closure, legal action |
| **Emotional Manipulation** | Sympathy, excitement, shock |
| **Greed Appeal** | Unrealistic rewards, lottery winnings |

---

## Repo Structure

```
scamshield/
│
├── artifacts/
│   ├── api-server/              # Express API (port 8080)
│   │   └── src/
│   │       ├── agents/          # Multi-agent system
│   │       │   ├── intakeAgent.ts
│   │       │   ├── threatAgent.ts
│   │       │   ├── educationAgent.ts
│   │       │   ├── vulnerabilityAgent.ts
│   │       │   ├── urlAgent.ts
│   │       │   ├── reportingAgent.ts
│   │       │   └── orchestrator.ts
│   │       ├── tools/           # MCP-style tool wrappers
│   │       │   ├── classifyInputTool.ts
│   │       │   ├── analyzeThreatTool.ts
│   │       │   ├── scanUrlTool.ts
│   │       │   ├── educationTool.ts
│   │       │   └── vulnerabilityTool.ts
│   │       ├── lib/
│   │       │   └── security.ts  # Injection protection, rate limiting
│   │       └── routes/
│   │           └── scamshield.ts
│   │
│   └── scamshield/              # React + Vite frontend
│       └── src/
│           ├── components/
│           │   ├── AgentThinkingTimeline.tsx
│           │   ├── AnalysisResultView.tsx
│           │   └── ...
│           └── pages/
│               ├── Analyzer.tsx
│               ├── Dashboard.tsx
│               ├── History.tsx
│               └── Learn.tsx
│
├── lib/
│   ├── api-spec/               # OpenAPI contract
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod validators
│   └── db/                     # Drizzle ORM schema + client
│
└── README.md
```

---

## Kaggle Course Concepts Demonstrated

| Concept | Where | How |
|---------|-------|-----|
| **Multi-Agent System (ADK)** | `src/agents/` | 7 agents with focused responsibilities, orchestrated by the Orchestrator Agent |
| **MCP-Style Tool System** | `src/tools/` | 5 typed tool wrappers with structured I/O and safe fallbacks |
| **Security Features** | `src/lib/security.ts` | Prompt injection detection, input sanitization, rate limiting |
| **Agent Skills** | `intakeAgent.ts`, `reportingAgent.ts` | Specialized rule-based agents as non-AI skills |
| **Deployability** | Replit + `.replit-artifact/` | Live deployment at `scamshield.replit.app` |

---

## Setup Instructions

### Prerequisites
- Node.js 24+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)
- Google AI Studio API key ([Get one free](https://aistudio.google.com/app/apikey))

### 1. Clone and install

```bash
git clone https://github.com/your-username/scamshield-ai
cd scamshield-ai
pnpm install
```

### 2. Environment variables

Create `artifacts/api-server/.env`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/scamshield
GOOGLE_GEMINI_API_KEY=your_api_key_here
SESSION_SECRET=any_long_random_string_here
PORT=8080
```

> ⚠️ **Never commit `.env` to version control.** The `.gitignore` already excludes it.

### 3. Initialize the database

```bash
pnpm --filter @workspace/db run push
```

### 4. Generate API client code

```bash
pnpm --filter @workspace/api-spec run codegen
```

### 5. Start development servers

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/scamshield run dev
```

Frontend: `http://localhost:24814`  
API: `http://localhost:8080`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scamshield/analyze` | Run the full multi-agent analysis pipeline |
| `POST` | `/api/scamshield/emergency` | Generate an emergency recovery action plan |
| `GET` | `/api/scamshield/history` | Fetch recent analysis history (last 50) |
| `DELETE` | `/api/scamshield/history/:id` | Delete a history record |
| `GET` | `/api/scamshield/stats` | Aggregate statistics (counts by risk level + type) |

### Example: Analyze a message

```bash
curl -X POST https://your-deployment/api/scamshield/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "URGENT: Your SBI account has been suspended. Click http://sbi-verify-now.xyz"
  }'
```

**Response:**
```json
{
  "inputType": "SMS",
  "type": "Phishing",
  "riskLevel": "Critical",
  "confidenceScore": 98,
  "reasoning": [
    "Fake domain 'sbi-verify-now.xyz' impersonating the State Bank of India",
    "Urgency language ('URGENT') designed to bypass rational thinking",
    "Account suspension threat creates fear to force immediate action",
    "Official SBI domain is sbi.co.in — this URL is not affiliated"
  ],
  "eli15": "This is a trick message pretending to be from your bank...",
  "vulnerableGroups": ["...", "..."],
  "scammerStrategy": ["Step 1: ...", "Step 2: ..."],
  "urlIntelligence": {
    "domain": "sbi-verify-now.xyz",
    "threatScore": 97,
    "possibleTyposquatting": true,
    "typosquattingTarget": "SBI"
  },
  "reportingLinks": [
    { "platform": "Cyber Crime Portal", "url": "https://cybercrime.gov.in" }
  ]
}
```

---

## Deployment (Replit)

This project is deployed via Replit's native artifact system:

1. Fork/clone this Repl
2. Set environment secrets in the Replit Secrets panel (not `.env`)
3. Click **Deploy** → Replit handles build, TLS, health checks, and CDN

The production app is available at the `.replit.app` subdomain immediately after deployment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| API | Express 5, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, `drizzle-zod` |
| API Contract | OpenAPI 3.0 spec + Orval codegen |
| Frontend | React 19, Vite 7, Tailwind CSS, shadcn/ui |
| State | TanStack Query v5 |
| QR Decode | `jsQR` (client-side, no server upload) |
| Runtime | Node.js 24, pnpm workspaces |

---

## Security Notes

- **No API keys in code.** All secrets via environment variables.
- QR code images are processed **entirely client-side** (jsQR in the browser) — raw images are never uploaded to the server.
- Input is sanitized and prompt-injection-checked before any agent sees it.
- Rate limiting prevents API abuse (10 req/min per IP).
- The `security.ts` module is independently testable and replaceable.

---

## Reporting Scams (India)

ScamShield automatically generates context-aware reporting links. For reference:

| Authority | URL | For |
|-----------|-----|-----|
| National Cyber Crime Portal | [cybercrime.gov.in](https://cybercrime.gov.in) | All cyber fraud (Helpline: **1930**) |
| CERT-In | [cert-in.org.in](https://www.cert-in.org.in) | Technical cyber incidents |
| SEBI SCORES | [scores.gov.in](https://scores.gov.in) | Investment / stock fraud |
| TRAI | [trai.gov.in](https://www.trai.gov.in) | Spam calls and SMS |
| RBI Complaint Portal | [cms.rbi.org.in](https://cms.rbi.org.in) | Banking fraud |
| NPCI | [npci.org.in](https://www.npci.org.in) | UPI / QR payment fraud |

---

## License

MIT — Free to use, modify, and distribute.

---

*Built for the Kaggle 5-Day AI Agents Intensive Capstone · Agents for Good Track*  
*Powered by Google Gemini 2.5 Flash*
