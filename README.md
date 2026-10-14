# Polyseer - See the Future.

> *Everyone wishes they could go back and buy Bitcoin at $1. Polyseer brings the future to you, so you never have to wonder "what if?" again.*

**NOT FINANCIAL ADVICE** | Polyseer provides analysis for entertainment and research purposes only. Always DYOR.

## Quick Start (Self-Hosted)

The easiest way to run Polyseer is in self-hosted mode with two environment variables:

```bash
git clone https://github.com/yorkeccak/polyseer.git
cd polyseer
pnpm install

# Create .env.local with:
# NEXT_PUBLIC_APP_MODE=self-hosted
# VALYU_API_KEY=valyu_xxx        # Get from platform.valyu.ai

pnpm dev
```

Open [localhost:3000](http://localhost:3000), paste any **Polymarket or Kalshi** URL, pick a research effort, and get your forecast.

Self-hosted mode features:
- No authentication required
- Research billed to your own Valyu API key
- Research history pulled straight from your Valyu account
- Perfect for personal use and development

## What is Polyseer?

Prediction markets tell you what might happen. Polyseer tells you why, and whether the price is right.

Drop in any **Polymarket or Kalshi** URL. Polyseer reads the live market (question, prices, close date, resolution rules) and hands it to [Valyu DeepResearch](https://docs.valyu.ai/guides/deepresearch), an autonomous research agent that searches news, primary sources, data releases, and related markets. You watch every step live, then get:

- **A calibrated probability** against the market price, with a plausible range and a confidence level
- **A side to take**: buy YES, buy NO, or no edge
- **Evidence ranked by weight**, for and against, each with its source
- **Base rate, catalysts, risks, and what would change the forecast**
- **A full PDF report** and **a CSV of every factor** affecting the market
- **An email** when the research finishes, so you can close the tab

**Research effort** has four levels, chosen from the settings pill under the search box. Fast is the default. Each level maps to a DeepResearch mode:

| Effort   | DeepResearch mode | Typical time | Cost per run |
|----------|-------------------|--------------|--------------|
| Fast     | `fast`            | About 5 min  | $0.10        |
| Standard | `standard`        | 10 to 20 min | $0.50        |
| Deep     | `heavy`           | 30 to 60 min | $2.50        |
| Max      | `max`             | Up to 2 hours| $15.00       |

The second deliverable file adds $0.10 per run. Deeper effort means more sources, more cross-checking, and a longer report.

---

## Architecture Overview

Polyseer is a thin Next.js app around one external research job. There is no in-process LLM pipeline.

```mermaid
graph TD
    A[User pastes market URL and picks effort] --> B[POST /api/research]
    B --> C{Polymarket or Kalshi?}
    C -->|Polymarket| D[Gamma and CLOB APIs]
    C -->|Kalshi| E[Kalshi trade API]
    D --> F[Market facts: question, prices, close time, rules]
    E --> F
    F --> G[Forecast prompt + research strategy + output schema]
    G --> H[Valyu DeepResearch task]
    H --> I[/research/id page polls GET /api/research/id]
    I --> J[Live activity feed: searches, reads, sources]
    H --> K[Structured forecast JSON]
    H --> L[PDF report + CSV of factors]
    H --> M[Completion email]
    K --> I
    L --> I

    style A fill:#e1f5fe
    style H fill:#fff3e0
    style K fill:#c8e6c9
```

### Request flow

1. **Create.** `POST /api/research` validates the URL, fetches the live market, builds the prompt, and creates a DeepResearch task with a JSON output schema, two deliverables (PDF report, CSV of factors), and an optional completion email. It returns the task id.
2. **Watch.** The browser navigates to `/research/[id]` and polls `GET /api/research/[id]` every few seconds, backing off to 20 seconds and pausing when the tab is hidden. The status response's message trace is turned into an activity feed of searches, reads, and sources.
3. **Read.** When the task completes, the structured output renders as a verdict card (side, probability versus market, edge, confidence) plus evidence, base rate, catalysts, risks, and rationale. Deliverables download through `GET /api/research/[id]/files/[fileId]`, which proxies the signed Valyu URL.
4. **History.** `GET /api/research` lists the account's DeepResearch tasks and keeps the ones this app created. `/history` shows them with live status.

Every forecast link is stable: reopen it later to see progress or the finished report.

### Two modes

| | Self-hosted | Valyu |
|---|---|---|
| Auth | None | Sign in with Valyu (OAuth 2.1 + PKCE) |
| Billing | Your `VALYU_API_KEY` | Each user's Valyu organisation credits, via the platform proxy |
| History | Tasks on your API key | Tasks on the user's organisation |
| Completion email | `DEEPRESEARCH_ALERT_EMAIL` | The signed-in user's email |
| Database | Local SQLite | Your own Supabase (users) |

### Key files

| Path | Purpose |
|------|---------|
| `src/lib/research/prompt.ts` | Builds the query and research strategy from live market data |
| `src/lib/research/schema.ts` | JSON schema for the structured forecast, plus the parser that validates it |
| `src/lib/research/activity.ts` | Turns the DeepResearch message trace into activity steps |
| `src/lib/research/task.ts` | Normalises status and list responses for the UI |
| `src/lib/research/service.ts` | Create, status, list, cancel, deliverable lookup |
| `src/lib/valyu/client.ts` | Server-side Valyu client: API key or OAuth proxy |
| `src/lib/tools/` | Polymarket and Kalshi market fetchers and URL parsing |
| `src/lib/markets/discovery.ts` | Live trending markets and market search for the home page |
| `src/app/api/research/` | API routes |
| `src/components/research/` | Effort selector, progress, activity feed, verdict, details, downloads, history |

---

## Technology Stack

- **Next.js 16** with React 19 and Turbopack
- **Tailwind CSS 4**, Radix UI, Framer Motion
- **Valyu DeepResearch** for research, structured output, deliverables, and completion emails
- **Polymarket and Kalshi APIs** for live market data
- **SQLite (self-hosted) or Supabase (Valyu mode)** for users
- **Zustand** for auth state, **TypeScript** throughout

---

## Getting Started

### Prerequisites

- **Node.js 20+** and **pnpm**
- **Valyu API key** from [platform.valyu.ai](https://platform.valyu.ai)

### Environment

Copy `.env.example` to `.env.local`. Self-hosted mode needs only:

```env
NEXT_PUBLIC_APP_MODE=self-hosted
VALYU_API_KEY=valyu_your_api_key_here
# Optional: email an address in your Valyu org when research finishes
# DEEPRESEARCH_ALERT_EMAIL=you@example.com
```

Valyu mode (OAuth) needs the client id and secret, the Valyu platform URLs, and your own Supabase project. See `.env.example` for the full list.

Completion emails link back to `NEXT_PUBLIC_APP_URL/research/{id}`. That link must be `https`; on plain `http` (for example local development) the email links to the Valyu platform's report page instead.

> **Note:** Valyu OAuth apps will be in general availability soon. Contact contact@valyu.ai if you need access.

### Run

```bash
pnpm dev
```

### Scripts

```bash
pnpm test:kalshi   # Check Kalshi API connectivity and URL parsing
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Keep commits small and focused
4. Submit a pull request

Code style: TypeScript strict mode, 2-space indentation, semicolons.

---

## Legal & Disclaimers

**NOT FINANCIAL ADVICE**: Polyseer provides analysis for entertainment and research purposes only. All forecasts are probabilistic and should not be used as the sole basis for financial decisions.

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Valyu**: DeepResearch and search
- **Polymarket** and **Kalshi**: Prediction market data

---

**Ready to see the future? Clone the repo and start forecasting markets locally.**

---

<div align="center">
  <img src="public/polyseer.svg" alt="Polyseer" width="200"/>

  **See the Future. Don't Miss Out.**
</div>
