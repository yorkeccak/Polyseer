# Polyseer - See the Future.

> *Everyone wishes they could go back and buy Bitcoin at $1. Polyseer brings the future to you, so you never have to wonder "what if?" again.*

**NOT FINANCIAL ADVICE** | Polyseer provides analysis for entertainment and research purposes only. Always DYOR.

## Quick Start (Self-Hosted)

The easiest way to run Polyseer is in self-hosted mode with just 3 required environment variables:

```bash
git clone https://github.com/yorkeccak/polyseer.git
cd polyseer
npm install

# Create .env.local with:
# NEXT_PUBLIC_APP_MODE=self-hosted
# VALYU_API_KEY=valyu_xxx        # Get from platform.valyu.ai
# OPENAI_API_KEY=sk-xxx          # Get from platform.openai.com
# ADANOS_API_KEY=optional        # Optional: https://api.adanos.org/docs/

npm run dev
```

Open [localhost:3000](http://localhost:3000), paste any **Polymarket or Kalshi** URL, and get your analysis.

Self-hosted mode features:
- No authentication required
- Local SQLite database (automatically created)
- Unlimited queries using your API keys
- Optional Adanos stock sentiment enrichment for equity-linked markets
- Perfect for personal use and development

## What is Polyseer?

Prediction markets tell you what might happen. Polyseer tells you why.

Drop in any **Polymarket or Kalshi** URL and get a structured analysis that breaks down the actual factors driving an outcome. Instead of gut feelings or surface-level takes, you get systematic research across academic papers, news, market data, and expert analysis.

The system uses multiple AI agents to research both sides of a question, then aggregates the evidence using Bayesian probability math. Think of it as having a research team that can read thousands of sources in minutes and give you the key insights.

**Core features:**
- Systematic research across academic, web, and market data sources
- Evidence classification and quality scoring
- Mathematical probability aggregation (not just vibes)
- Both sides research to avoid confirmation bias
- Real-time data, not stale information

Built for developers, researchers and anyone who wants rigorous analysis instead of speculation.

### Optional Adanos Market Sentiment Integration

Polyseer can optionally enrich stock-linked prediction markets with Adanos Market Sentiment snapshots across:

- Reddit
- X
- News
- Polymarket

This integration is disabled by default. If `ADANOS_API_KEY` is not configured, Polyseer behaves exactly as before.

When enabled, the research agents may call Adanos only for markets that clearly concern a public company, stock, earnings event, or ticker-linked catalyst. The signal is used as directional context to improve follow-up research, not as standalone proof.

```bash
ADANOS_API_KEY=your_adanos_key
ADANOS_API_BASE_URL=https://api.adanos.org
ADANOS_SENTIMENT_DEFAULT_DAYS=7
ADANOS_API_TIMEOUT_MS=10000
```

---

## Architecture Overview

Polyseer is built on a **multi-agent AI architecture** that orchestrates specialized agents to conduct deep analysis. Here's how it works:

```mermaid
graph TD
    A[User Input: Market URL] --> B[Platform Detector]
    B --> C{Polymarket or Kalshi?}
    C -->|Polymarket| D[Polymarket API Client]
    C -->|Kalshi| E[Kalshi API Client]
    D --> F[Unified Market Data]
    E --> F
    B --> C[Orchestrator]
    C --> D[Planner Agent]
    D --> E[Research Agents]
    E --> F[Valyu Search Network]
    F --> G[Evidence Collection]
    G --> H[Critic Agent]
    H --> I[Analyst Agent]
    I --> J[Reporter Agent]
    J --> K[Final Verdict]

    style A fill:#e1f5fe
    style K fill:#c8e6c9
    style F fill:#fff3e0
    style C fill:#f3e5f5
```

### Agent System Deep Dive

```mermaid
sequenceDiagram
    participant User
    participant Orch as Orchestrator
    participant Plan as Planner
    participant Res as Researcher
    participant Valyu as valyuAI
    participant Critic
    participant Analyst
    participant Reporter

    User->>Orch: Polymarket URL
    Orch->>Plan: Generate research strategy
    Plan->>Orch: Subclaims + search seeds

    par Research Cycle 1
        Orch->>Res: Research PRO evidence
        Res->>Valyu: Deep + Web searches
        Valyu-->>Res: Academic papers, news, data
        and
        Orch->>Res: Research CON evidence
        Res->>Valyu: Targeted counter-searches
        Valyu-->>Res: Contradicting evidence
    end

    Orch->>Critic: Analyze evidence gaps
    Critic->>Orch: Follow-up search recommendations

    par Research Cycle 2 (if gaps found)
        Orch->>Res: Targeted follow-up searches
        Res->>Valyu: Fill identified gaps
        Valyu-->>Res: Missing evidence
    end

    Orch->>Analyst: Bayesian probability aggregation
    Analyst->>Orch: pNeutral, pAware, evidence weights

    Orch->>Reporter: Generate final report
    Reporter->>User: Analyst-grade verdict
```

## Deep Research System

### Valyu Integration

Polyseer uses the Valyu API for its research capabilities, providing access to:

- **Academic Papers**: Real-time research publications
- **Web Intelligence**: Fresh news and analysis
- **Market Data**: Financial and trading information
- **Proprietary Datasets**: Exclusive Valyu intelligence

```mermaid
graph LR
    A[Research Query] --> B[Valyu Deep Search]
    B --> C[Academic Sources]
    B --> D[Web Sources]
    B --> E[Market Data]
    B --> F[Proprietary Intel]

    C --> G[Evidence Classification]
    D --> G
    E --> G
    F --> G

    G --> H[Type A: Primary Sources]
    G --> I[Type B: High-Quality Secondary]
    G --> J[Type C: Standard Secondary]
    G --> K[Type D: Weak/Speculative]

    style B fill:#fff3e0
    style H fill:#c8e6c9
    style I fill:#dcedc8
    style J fill:#f0f4c3
    style K fill:#ffcdd2
```

### Evidence Quality System

Each piece of evidence is rigorously classified:

| Type | Description | Cap | Examples |
|------|-------------|-----|----------|
| **A** | Primary Sources | 2.0 | Official documents, press releases, regulatory filings |
| **B** | High-Quality Secondary | 1.6 | Reuters, Bloomberg, WSJ, expert analysis |
| **C** | Standard Secondary | 0.8 | Reputable news with citations, industry publications |
| **D** | Weak/Speculative | 0.3 | Social media, unverified claims, rumors |

## Mathematical Foundation

### Bayesian Probability Aggregation

Polyseer uses sophisticated mathematical models to combine evidence:

```mermaid
graph TD
    A[Prior Probability p0] --> B[Evidence Weights]
    B --> C[Log Likelihood Ratios]
    C --> D[Correlation Adjustments]
    D --> E[Cluster Analysis]
    E --> F[Final Probabilities]

    F --> G[pNeutral: Objective Assessment]
    F --> H[pAware: Market-Informed]

    style A fill:#e3f2fd
    style F fill:#c8e6c9
    style G fill:#dcedc8
    style H fill:#f0f4c3
```

**Key Formulas:**
- **Log Likelihood Ratio**: `LLR = log(P(evidence|YES) / P(evidence|NO))`
- **Probability Update**: `p_new = p_old * exp(LLR)`
- **Correlation Adjustment**: Accounts for evidence clustering and dependencies

### Evidence Influence Calculation

Each piece of evidence receives an influence score based on:
- **Verifiability**: Can the claim be independently verified?
- **Consistency**: Internal logical coherence
- **Independence**: Number of independent corroborations
- **Recency**: How fresh is the information?

## Technology Stack

### Frontend
- **Next.js 16** - React framework with Turbopack
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible components
- **React 19** - Latest React features

### Backend & APIs
- **AI SDK** - LLM orchestration
- **GPT-4o / GPT-5** - Advanced reasoning models
- **Valyu API** - Search and research capabilities
- **Polymarket API** - Market data fetching
- **Kalshi API** - Market data fetching
- **SQLite/Supabase** - Database (mode-dependent)

### State Management
- **Zustand** - Simple state management
- **TanStack Query** - Server state synchronization

### Infrastructure
- **TypeScript** - Type safety throughout
- **Zod** - Runtime type validation
- **ESLint** - Code quality

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm/pnpm/yarn**
- **OpenAI API key** - For GPT-4o / GPT-5 access
- **Valyu API key** - For search capabilities (get at [platform.valyu.ai](https://platform.valyu.ai))

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/polyseer.git
cd polyseer
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Setup

Create `.env.local` with your configuration:

#### Self-Hosted Mode (Recommended)

```env
# ===========================================
# Self-Hosted Mode Configuration
# ===========================================
NEXT_PUBLIC_APP_MODE=self-hosted
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# Required API Keys
# ===========================================
# Get your Valyu API key at: https://platform.valyu.ai
VALYU_API_KEY=valyu_your_api_key_here

# Get your OpenAI API key at: https://platform.openai.com
OPENAI_API_KEY=sk-your_openai_api_key_here
```

That's it! Self-hosted mode uses a local SQLite database that's automatically created.

#### Valyu Mode (Advanced)

> **Note:** Valyu OAuth apps will be in general availability soon. Currently client id/secret are not publicly available. Contact contact@valyu.ai if you need access.

```env
# ===========================================
# Valyu Mode Configuration
# ===========================================
NEXT_PUBLIC_APP_MODE=valyu
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ===========================================
# Valyu OAuth Configuration
# ===========================================
NEXT_PUBLIC_VALYU_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_VALYU_CLIENT_ID=your-oauth-client-id
VALYU_CLIENT_SECRET=your-oauth-client-secret
VALYU_APP_URL=https://platform.valyu.ai

# ===========================================
# App's Own Supabase (Required for Valyu Mode)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-app.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===========================================
# Required API Keys
# ===========================================
VALYU_API_KEY=valyu_your_api_key_here
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start analyzing.

---

## Agent System Details

### Planner Agent
**Purpose**: Break down complex questions into research pathways
**Input**: Market question
**Output**: Subclaims, search seeds, key variables, decision criteria

```typescript
interface Plan {
  subclaims: string[];      // Causal pathways to outcome
  keyVariables: string[];   // Leading indicators to monitor
  searchSeeds: string[];    // Targeted search queries
  decisionCriteria: string[]; // Evidence evaluation criteria
}
```

### Researcher Agent
**Purpose**: Gather evidence from multiple sources
**Tools**: Valyu Deep Search, Valyu Web Search
**Process**:
1. Initial bilateral research (PRO/CON)
2. Evidence classification (A/B/C/D)
3. Follow-up targeted searches

### Critic Agent
**Purpose**: Identify gaps and provide quality feedback
**Analysis**:
- Missing evidence areas
- Duplication detection
- Data quality concerns
- Correlation adjustments
- Follow-up search recommendations

### Analyst Agent
**Purpose**: Mathematical probability aggregation
**Methods**:
- Bayesian updating
- Evidence clustering
- Correlation adjustments
- Log-likelihood calculations

### Reporter Agent
**Purpose**: Generate human-readable analysis
**Output**: Markdown report with:
- Executive summary
- Evidence synthesis
- Risk factors
- Confidence assessment

---

## Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- Secure session management
- Input sanitization for all user data
- No personal data stored in search queries

### API Security
- Request validation using Zod schemas
- Audit logging for all API calls

---

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests: `npm run test`
5. Submit a pull request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow the configuration
- **Prettier**: Auto-formatting on save
- **Conventional Commits**: Use semantic commit messages

---

## Legal & Disclaimers

### Important Notice
**NOT FINANCIAL ADVICE**: Polyseer provides analysis for entertainment and research purposes only. All predictions are probabilistic and should not be used as the sole basis for financial decisions.

### Terms of Service
- Privacy Policy: We respect your privacy
- Terms of Use: Fair use and guidelines
- Liability: Limited liability for predictions
- Jurisdiction: Governed by applicable laws

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

### Powered By
- **valyuAI**: Real-time search API
- **OpenAI GPT-4o / GPT-5**: Advanced reasoning capabilities
- **Polymarket**: Prediction market data
- **Kalshi**: Prediction market data

---

**Ready to see the future? Clone the repo and start analyzing markets locally.**

*Remember: The future belongs to those who can see it coming. Don't miss out again.*

---

<div align="center">
  <img src="public/polyseer.svg" alt="Polyseer" width="200"/>

  **See the Future. Don't Miss Out.**
</div>
