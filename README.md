# Aurum — AI Personal Finance Copilot

A premium personal finance dashboard for India. Connects bank accounts via Plaid, visualises spending across every dimension, and lets you interrogate your finances in plain English through an AI copilot backed by Google Gemini. All amounts are in **Indian Rupees (₹)**.

The defining engineering choice: **the LLM never touches numbers**. Gemini routes questions to deterministic database queries; your code computes every figure. This makes financial data provably correct while the model handles what it is actually good at — understanding intent and generating natural language.

---

## Contents

1. [Screenshots](#screenshots)
2. [What it does](#what-it-does)
3. [Tech stack](#tech-stack)
4. [AI architecture — the key design decision](#ai-architecture--the-key-design-decision)
5. [Automated insights engine](#automated-insights-engine)
6. [Database schema](#database-schema)
7. [Project structure](#project-structure)
8. [Prerequisites](#prerequisites)
9. [Environment variables](#environment-variables)
10. [Local setup](#local-setup)
11. [Seeding mock data](#seeding-mock-data)
12. [Running locally](#running-locally)
13. [Deploying to Vercel](#deploying-to-vercel)

---

## Screenshots

| | |
|---|---|
| **Dashboard** | [screenshot coming soon] |
| **Transactions** | [screenshot coming soon] |
| **Analytics** | [screenshot coming soon] |
| **Accounts** | [screenshot coming soon] |
| **AI Copilot** | [screenshot coming soon] |
| **Settings** | [screenshot coming soon] |

---

## What it does

| Page | What you get |
|---|---|
| **Dashboard** | Animated KPI cards (balance, income, spend), bar chart with week/month/year toggle, category breakdown, recent transactions, AI insight strip + mini chat |
| **Transactions** | Paginated full-history table with live search, date range, and category filters; skeleton loading state; per-row 3D merchant icons |
| **Analytics** | 6-month income-vs-expenses area chart, month-over-month grouped bar, category donut, 3-card AI trend strip (anomaly alert, subscription audit, savings projection) |
| **Accounts** | Cards per connected account — animated balance counter, sync status, credit utilisation bar (credit), APY/maturity/interest (FD). "Connect account" triggers Plaid Link |
| **AI Copilot** | Full-page chat — type plain-English finance questions, get back exact numbers with an optional structured data card (mini bar chart + legend). Suggested prompt starters, follow-up chips |
| **Settings** | Profile (display name, password change), preferences (currency, date format, month start day), notification toggles, connected-account management with one-click disconnect, CSV export, account deletion |

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server components for secure data fetching by default; API routes for Plaid/AI calls; file-based routing; `loading.tsx` Suspense skeletons |
| Language | **TypeScript (strict)** | End-to-end type safety; no silent `any` |
| Auth + database | **Supabase** | Postgres with Row Level Security; built-in Auth (email/password); `auth.admin.deleteUser` for account deletion |
| Bank data | **Plaid (sandbox)** | Structured transactions, balances, and categories; no real money in sandbox |
| AI | **Google Gemini API** | Function calling for intent routing; `gemini-2.0-flash` |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Utility-first; v4 native CSS variables; accessible primitives |
| Charts | **Recharts** | Composable React chart library; built-in animation; SVG output |
| Animations | **Framer Motion** | Page transitions; `motion.div` with `usePathname` key re-fires on every navigation |
| Deployment | **Vercel** | Zero-config Next.js deploys; Edge Network; environment variable management |

---

## AI architecture — the key design decision

This is the part worth understanding deeply, because it captures a general pattern that applies to any AI system that touches numbers.

### The problem with asking an LLM for financial data

Language models are very good at many things. Arithmetic is not one of them. A model asked "how much did I spend on food last month?" might generate a plausible figure — but that figure could be hallucinated, rounded, or simply wrong. In a financial context a wrong number is not a minor UX problem; it destroys trust and leads users to make bad decisions.

The naive architecture is:

```
User question → LLM with transaction context → LLM produces answer
```

This fails because:
- Sending all transactions to the LLM is expensive and hits context limits
- The model performs arithmetic in an unauditable way
- Numbers cannot be verified or traced back to source data
- Any rounding or hallucination is invisible to the user

### The Aurum pattern: route, query, narrate

The architecture treats the LLM as an **intent router** and your own code as the **computation engine**:

```
1. User types:  "How much did I spend on food in March?"
                         │
                         ▼
2. Gemini API  ── function calling ──────►  Gemini decides what to look up
   (no data sent,       │                   Returns: { name: "sum_spending",
    only the question)  │                             args: { category: "Food and Drink",
                        │                                     date_range: { start: "2026-03-01",
                        │                                                   end: "2026-03-31" }}}
                        │
                        ▼
3. Your code   ──── Supabase query ──────►  SELECT SUM(amount) FROM transactions
   (exact SQL,          │                   WHERE user_id = $1
    deterministic)      │                   AND category ILIKE '%food%'
                        │                   AND date BETWEEN '2026-03-01' AND '2026-03-31'
                        │                   AND amount > 0
                        │                   Result: { total: 18420.00, count: 23 }
                        │
                        ▼
4. Tool result ──── back to Gemini ──────►  Gemini writes a friendly response using
   (exact number)       │                   the real number it was given
                        │
                        ▼
5. Response:   "You spent ₹18,420 on food in March across 23 transactions.
                Zomato and Swiggy orders account for ₹9,200 of that —
                roughly half your food budget."
```

### Why this matters

**Correctness guarantees.** The figure ₹18,420 came from a SQL `SUM()` on your actual transaction rows. Gemini never saw your transactions and never did any addition.

**Auditability.** Every figure in every response is traceable to a specific database query. If a user questions a number, you can replay the exact query.

**Cost efficiency.** You never send transaction data to the LLM. Gemini sees only (1) the natural-language question, (2) tool result summaries (aggregated totals, not raw rows). A typical exchange uses a few hundred tokens.

**Separation of concerns.** Gemini does what it is genuinely good at: parsing "last month" into exact date boundaries, deciding which function fits the question, writing a clear human explanation of a number. Your code does what it is good at: running precise, indexed SQL.

### Implementation: the five tools

`app/api/ai/chat/route.ts` defines five function declarations that Gemini can call:

```typescript
sum_spending(category?, date_range?)
  → SELECT SUM(amount) grouped by subcategory, returns total + breakdown

count_transactions(category?, date_range?)
  → SELECT COUNT(*), returns count + top merchants by frequency

get_subscriptions()
  → Detects merchants appearing in ≥2 of the last 3 months
    with charges within 15% of each other (consistent = subscription)
    Returns list + monthly total + annual total

compare_periods(category?, period1, period2)
  → Runs sum_spending for both periods in parallel
    Returns both totals + change amount + change percent

get_top_categories(date_range?, limit?)
  → GROUP BY category ORDER BY SUM(amount) DESC
    Returns ranked list with percentages
```

Each function declaration's `parameters` is a JSON Schema object. Gemini reads those schemas and decides which function to invoke — it cannot invent function names or parameters outside the schema.

### The two-round exchange

```typescript
// Round 1: give Gemini the question + function declarations (AUTO mode)
const round1 = await gemini.generateContent({
  contents: [{ role: 'user', parts: [{ text: question }] }],
  toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
})
// round1.response.functionCalls() → [{ name, args }]

// Execute the function (real Supabase query — LLM never does the math)
const { toolResult, card } = await dispatchTool(call.name, call.args, userId)

// Round 2: give Gemini the exact number, ask for the natural language response
const round2 = await gemini.generateContent({
  contents: [
    { role: 'user',  parts: [{ text: question }] },
    { role: 'model', parts: round1Response.candidates[0].content.parts },
    { role: 'user',  parts: [{ functionResponse: { name, response: { result: toolResult } } }] },
  ],
  toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.NONE } },
})
// round2 contains the natural language response referencing the exact number
```

`FunctionCallingMode.NONE` on Round 2 is a **hard API-level guard**, not a prompt instruction. Gemini physically cannot emit another function call, eliminating an entire class of infinite-loop bugs.

### The DataCard: structured display, not LLM output

The response also includes a `DataCard` object that drives the chart and breakdown in the UI. This card is built entirely by your code from the raw query results — it is never described to Gemini:

```typescript
// Built by runSumSpending(), not by Gemini:
const card: DataCard = {
  title: 'Food and Drink Spending',
  total: 18420.00,              // from SQL SUM()
  period: 'Mar 1 – Mar 31',
  chartData: buildChartData(txns, range),    // bucketed into 6 bars
  breakdown: subcategoryTotals,              // from GROUP BY subcategory
}
```

Gemini receives only `{ total: 18420.00, count: 23, top_subcategories: [...] }`. The visual card is 100% deterministic.

### Interview talking points

- **"The LLM routes intent; code runs the math."** This one sentence captures the architecture.
- The system prompt injects the current date and pre-computed date-range strings ("last month" = "2026-05-01 to 2026-05-31") so Gemini always passes valid ISO dates to function calls.
- `FunctionCallingMode.NONE` is a hard guard — it is not possible for Round 2 to trigger another DB query.
- RLS (Supabase Row Level Security) means function executors cannot accidentally leak another user's data even if the user_id is somehow spoofed — the Supabase server client rejects mismatched auth.
- Every monetary value displayed in the UI originated from a SQL aggregate. The LLM only authored the surrounding sentence.

---

## Automated insights engine

`lib/insights.ts` runs four server functions on every dashboard and analytics page load. They run in `Promise.all` so they add only the slowest single query's latency.

### Top spending categories

Fetches the current calendar month's expenses, groups by category, sorts by total, returns top N with percentage-of-total.

### Subscription detection

Fetches 90 days of transactions. For each merchant: records which calendar months it appears in, and collects all charge amounts. A merchant is a subscription if (a) it appears in ≥ 2 of the last 3 months, and (b) all charges are within 15% of the average — the "consistent recurring charge" heuristic. Returns list sorted by monthly amount, plus monthly and annual totals.

*Example:* Netflix at ₹649/month every month → flagged. Zomato at varying amounts → not flagged.

### Anomaly detection

Fetches 4 months in one query. Per category:
- **Baseline** = average monthly spend across the prior 3 complete months (months with non-zero spend)
- **Current** = this month's actual spend, **prorated** to a full-month projection: `currentAmount × (daysInMonth / daysElapsed)`
- **Threshold**: projected current > baseline × 1.20 (20% spike)
- **Guard**: skips if fewer than 5 days have elapsed (insufficient signal for proration)

*Example:* Air India ₹12,500 on day 4. Prorated = ₹12,500 × (30/4) = ₹93,750 projected vs Travel 3-month avg of ~₹3,200 → anomaly fires.

### Savings rate and annual projection

Fetches 6 months. Savings rate = `(income − spending) / income`. Annual projection = rolling 6-month average monthly savings × 12 (prior complete months only, not the current partial month).

---

## Database schema

Four tables, all with RLS enabled. Policies enforce `auth.uid() = user_id` on every operation — users can only ever see their own data.

### `plaid_items`

```sql
id               uuid  PK
user_id          uuid  FK → auth.users
access_token     text  -- Plaid long-lived token, server-side only
item_id          text  UNIQUE
institution_name text  -- e.g. "HDFC Bank"
created_at       timestamptz
```

### `accounts`

```sql
id               uuid  PK
user_id          uuid  FK → auth.users
plaid_account_id text  UNIQUE(user_id, plaid_account_id)
name             text  -- e.g. "HDFC Savings Account"
type             text  -- 'savings' | 'credit' | 'investment'
balance          numeric(14,2)
currency         text  DEFAULT 'INR'
last_synced      timestamptz  -- null until first sync
created_at       timestamptz
```

### `transactions`

```sql
id                   uuid  PK
account_id           uuid  FK → accounts
user_id              uuid  FK → auth.users
plaid_transaction_id text  UNIQUE  -- upsert key
date                 date
amount               numeric(14,2)  -- positive = expense, negative = income
merchant             text
category             text  -- Plaid top-level category
subcategory          text  -- Plaid second-level category
pending              boolean  DEFAULT false
created_at           timestamptz
```

**Sign convention (Plaid standard):** `amount > 0` = money leaving the account (expense/debit). `amount < 0` = money entering (income/credit). Every query in the app filters on this explicitly.

### `profiles`

Stores user preferences and display settings. Created separately from the core schema — see the migration in `supabase/migrations/001_profiles.sql`.

```sql
id            uuid  PK  DEFAULT gen_random_uuid()
user_id       uuid  UNIQUE  FK → auth.users  ON DELETE CASCADE
display_name  text  -- shown in the sidebar instead of email when set
avatar_url    text
preferences   jsonb  DEFAULT '{"currency":"INR","date_format":"DD/MM/YYYY","month_start_day":1}'
notifications jsonb  DEFAULT '{"anomaly_alerts":true,"weekly_summary":true,"subscription_reminders":true}'
created_at    timestamptz  DEFAULT now()
```

The `preferences` and `notifications` columns are JSON blobs rather than typed columns so future settings fields can be added without schema migrations. The Settings page reads defaults from the JSON blob and falls back to sensible values if the row does not yet exist.

---

## Project structure

```
app/
├── (auth)/
│   ├── login/page.tsx         — email + password login
│   └── signup/page.tsx        — registration
├── (protected)/
│   ├── layout.tsx              — auth guard + profile fetch + sidebar + Framer Motion wrapper
│   ├── dashboard/
│   │   ├── page.tsx            — SSR: KPIs, charts, insights, recent transactions
│   │   └── loading.tsx         — gold shimmer skeleton matching dashboard layout
│   ├── transactions/
│   │   ├── page.tsx            — SSR shell; client TransactionTable handles pagination
│   │   └── loading.tsx         — skeleton: filter row + 12-row table
│   ├── analytics/
│   │   ├── page.tsx            — SSR: 6-month charts + AI trend strip
│   │   └── loading.tsx         — skeleton: 4 KPIs + line chart + bar/donut + trend strip
│   ├── accounts/
│   │   ├── page.tsx            — SSR: account cards with credit/FD enrichment
│   │   └── loading.tsx         — skeleton: 3 account cards + dashed add-card
│   ├── copilot/
│   │   ├── page.tsx            — SSR shell; client CopilotPage handles chat
│   │   └── loading.tsx         — skeleton: thread sidebar + chat area with prompt chips
│   └── settings/
│       ├── page.tsx            — SSR: fetches profile + plaid_items; renders SettingsClient
│       └── loading.tsx         — skeleton: 5 stacked section cards
└── api/
    ├── ai/chat/route.ts         — POST: Gemini function-calling Q&A (2-round exchange)
    ├── plaid/
    │   ├── create-link-token/   — POST: generate Plaid Link token
    │   ├── exchange/            — POST: exchange public token → access token
    │   └── sync-transactions/   — POST: pull Plaid transactions → upsert to DB
    └── settings/
        ├── profile/route.ts     — GET + PATCH: read/upsert profiles row
        ├── password/route.ts    — POST: Supabase auth.updateUser password change
        ├── disconnect/route.ts  — POST: remove plaid_item + cascade accounts/transactions
        ├── export-csv/route.ts  — GET: stream all transactions as a CSV download
        └── delete-account/route.ts — DELETE: wipe all data + auth.admin.deleteUser

components/
├── shared/
│   ├── Sidebar.tsx              — responsive nav; pendingHref for instant active highlight;
│   │                              prefetch={true} on all Links; shows display_name when set
│   └── PageTransition.tsx       — Framer Motion fade+slide per route
├── dashboard/
│   ├── KpiCard.tsx              — animated counter (cubic easing), trend badge
│   ├── SpendingChart.tsx        — period-toggle bar chart (Week/Month/Year)
│   ├── CategoryBreakdown.tsx    — staggered progress-bar breakdown
│   ├── TransactionList.tsx      — staggered fade-in recent transactions
│   └── AiWidget.tsx             — insight cards + inline chat → /copilot
├── analytics/
│   ├── AnalyticsKpiCard.tsx     — accent-colour variant of KpiCard
│   ├── IncomeExpensesChart.tsx  — dual area chart
│   ├── GroupedBarChart.tsx      — side-by-side monthly bars
│   ├── DonutChart.tsx           — category donut with hover legend
│   └── TrendStrip.tsx           — 3-card AI insight strip
├── accounts/
│   ├── AccountCard.tsx          — animated balance, credit bar, FD details
│   └── AccountsClient.tsx       — Plaid Link integration + Sync button
├── transactions/
│   └── TransactionTable.tsx     — search/filter/paginate with skeleton loading
├── copilot/
│   └── CopilotPage.tsx          — full chat UI with DataCard rendering
├── settings/
│   └── SettingsClient.tsx       — all 5 settings sections as one client component
└── ui/
    ├── button.tsx               — shadcn base button
    └── gold-select.tsx          — custom themed Select (dark dropdown, gold highlight)
                                    replaces native <select> throughout settings

lib/
├── fmt.ts                       — central ₹ formatters: fmtCurrency, fmtCurrencyCompact, fmtTxnAmount
├── insights.ts                  — server functions: top categories, subscriptions, anomalies, savings
├── categoryUtils.ts             — Plaid category → icon + colour mapping
├── plaid/client.ts              — PlaidApi singleton
└── supabase/
    ├── client.ts                — browser Supabase client
    ├── server.ts                — server Supabase client (reads cookies)
    └── admin.ts                 — service-role client (bypasses RLS)

scripts/
└── seed.ts                      — deterministic INR mock-data generator (~150 txns, 6 months)

supabase/
└── migrations/
    ├── 20260604000000_init_schema.sql  — plaid_items, accounts, transactions tables + RLS
    └── 001_profiles.sql                — profiles table + RLS (run after init_schema)

types/
└── index.ts                     — Account, Transaction, PlaidItem, InsightCard, TrendInsight …
```

---

## Prerequisites

- **Node.js 18+** (20+ recommended)
- **npm 9+**
- A [Supabase](https://supabase.com) account (free tier works)
- A [Plaid](https://plaid.com) account with sandbox credentials (free)
- A [Google AI](https://aistudio.google.com) API key (Gemini)

---

## Environment variables

Create `.env.local` at the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Plaid (sandbox)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox

# Google Gemini
GEMINI_API_KEY=AIza...
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → `service_role` key — **never expose to the browser** |
| `PLAID_CLIENT_ID` | [Plaid dashboard](https://dashboard.plaid.com) → Team Settings → Keys |
| `PLAID_SECRET` | Plaid dashboard → Team Settings → Keys → Sandbox secret |
| `PLAID_ENV` | Always `sandbox` for local development |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → Get API key |

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It is only used in server-side API routes and the seed script — never in a component or the public bundle. `GEMINI_API_KEY` and `PLAID_SECRET` are likewise server-only.

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/aurum.git
cd aurum
npm install
```

### 2. Configure environment variables

Copy the example block above into `.env.local` and fill in your actual keys.

### 3. Apply the database schema

Run **both** migration files in order. You can use the Supabase CLI or the SQL editor.

**Option A — Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

**Option B — Supabase SQL editor (paste and run each file separately, in order):**

1. Open your Supabase project → SQL Editor
2. Paste and run `supabase/migrations/20260604000000_init_schema.sql`
   — creates `plaid_items`, `accounts`, `transactions` with indexes and RLS policies
3. Paste and run `supabase/migrations/001_profiles.sql`
   — creates the `profiles` table used by the Settings page

### 4. Create a user account

```bash
npm run dev
```

Navigate to `http://localhost:3000/signup` and register with any email and password.

### 5. Seed mock data

See [Seeding mock data](#seeding-mock-data) below.

---

## Seeding mock data

`scripts/seed.ts` generates a deterministic dataset of ~150 transactions across 6 months in Indian Rupees, designed to exercise every app feature.

### What gets inserted

| Table | Rows | Details |
|---|---|---|
| `plaid_items` | 1 | Fake "HDFC Bank" item (`item_id = 'seed-item-001'`) |
| `accounts` | 3 | HDFC Savings · ICICI Coral Credit Card · SBI Fixed Deposit |
| `transactions` | ~150 | 6 calendar months; INR amounts throughout |

### Accounts

| Account | Type | Seed balance |
|---|---|---|
| HDFC Savings Account | savings | ₹1,84,320.50 |
| ICICI Coral Credit Card | credit | ₹38,450 outstanding |
| SBI Fixed Deposit | investment | ₹5,00,000 |

### Monthly recurring transactions (INR)

| Merchant | Amount | Category |
|---|---|---|
| Infosys Ltd Salary | −₹85,000 | Transfer / Payroll |
| Prestige Apartments Rent | ₹25,000 | Housing / Rent |
| Netflix | ₹649 | Entertainment / Streaming |
| Spotify | ₹119 | Entertainment / Music |
| Apple (iCloud+) | ₹75 | Technology / Cloud |
| Amazon Prime | ₹1,499 | Shopping / Memberships |
| Cult.fit | ₹2,000 | Recreation / Gym |
| Adobe Creative Cloud | ₹4,230 | Technology / Software |
| ACT Fibernet | ₹999 | Utilities / Internet |
| Duolingo (3 months) | ₹416 | Education |

### Variable transactions per month (INR ranges)

| Category | Merchants | Range |
|---|---|---|
| Groceries (3×) | BigBasket, DMart, Reliance Fresh | ₹3,000 – ₹5,500 |
| Restaurants (4×) | Zomato, Swiggy, Barbeque Nation, Social … | ₹500 – ₹1,500 |
| Coffee (3×) | Starbucks, Blue Tokai, Third Wave, CCD | ₹150 – ₹300 |
| Online shopping (2×) | Amazon, Myntra, Flipkart, Nykaa | ₹500 – ₹5,000 |
| Rideshare (2×) | Uber, Ola | ₹200 – ₹500 |
| Fuel (2×) | HPCL, Indian Oil, BPCL | ₹2,500 – ₹4,500 |
| Electricity (1×) | BESCOM, Tata Power, MSEDCL | ₹1,200 – ₹2,500 |

### Feature coverage

| Feature | Seed data |
|---|---|
| **Subscription detection** | Netflix, Spotify, Apple, Amazon Prime, Cult.fit, Adobe CC (all 6 months); Duolingo (3 months) — all flagged by the 15%-variance heuristic |
| **Anomaly detection** | Air India ₹12,500 on day 4 of the current month → prorated ₹93,750 vs Travel 3-month avg ≈ ₹3,200 → anomaly fires |
| **Savings rate** | ₹85,000 Infosys salary on the 1st of every month |
| **Top categories** | Food and Drink (groceries + restaurants + coffee) dominates |
| **One-off travel** | IndiGo Airlines ₹8,500 + Taj Hotels ₹6,200 in March (Goa weekend trip) |
| **One-off shopping** | Croma ₹4,999 (electronics), IKEA ₹7,450 (home goods), Westside ₹3,200 (clothing) |
| **Healthcare** | Apollo Pharmacy ₹780, Apollo Hospitals ₹1,500 (doctor visit in May) |

### Running the seed

Find your user UUID:

```bash
# Supabase dashboard → Authentication → Users → copy UUID
# Or in the SQL editor:
SELECT id FROM auth.users WHERE email = 'you@example.com';
```

Then:

```bash
# Via environment variable
SEED_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx npx tsx scripts/seed.ts

# Via flag
npx tsx scripts/seed.ts --user xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Wipe and re-seed
npx tsx scripts/seed.ts --user <uuid> --clean
```

### Flags

| Flag | Effect |
|---|---|
| `--user <uuid>` | Target user (overrides `SEED_USER_ID` env var) |
| `--clean` | Deletes only rows with `plaid_transaction_id LIKE 'seed-txn-%'`, `plaid_account_id LIKE 'seed-acc-%'`, and `item_id = 'seed-item-001'`. Real synced data is never touched. |

All inserts use `upsert` — running the script twice without `--clean` is idempotent.

---

## Running locally

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). Log in with the account you created, then seed mock data if you haven't already. You should immediately see:

- KPI cards with animated ₹ counters
- Spending chart with 6 months of INR data
- AI insight strip showing the subscription total (₹9,987/mo) and the Air India travel anomaly
- Recent transactions: Zomato, BigBasket, Uber, Netflix …

### Connecting a Plaid sandbox bank

On the Accounts page, click "Connect account". Plaid sandbox credentials:

- **Username:** `user_good`
- **Password:** `pass_good`

After connecting, click **Sync** to pull transactions into the database.

### Using the Settings page

Navigate to `/settings`. On first visit the `profiles` row does not exist yet — the page shows defaults (INR, DD/MM/YYYY, day 1). Save any field to create the row. The sidebar immediately reflects your display name on the next navigation.

The **Disconnect** button on a connected bank removes the `plaid_items` row and cascades to delete all associated accounts and transactions. The **Export CSV** button downloads all your transactions as a UTF-8 CSV. The **Delete Account** button requires typing `DELETE` to confirm, then wipes all data and calls `auth.admin.deleteUser` server-side.

### Using the AI Copilot

Navigate to `/copilot`. Questions that work well with seeded data:

```
How much did I spend on food last month?
What are my top 3 spending categories this month?
Find all my recurring subscriptions
Compare my grocery spending in January vs March
What is my savings rate?
How much did I spend on Zomato and Swiggy combined?
```

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js — no build config needed

### 3. Add environment variables

In the Vercel project → Settings → Environment Variables, add all seven variables from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENV        ← set to "sandbox" unless you have Plaid production approval
GEMINI_API_KEY
```

### 4. Deploy

Click **Deploy** — or push a commit. Vercel deploys on every push to `main` automatically.

### 5. Update Supabase allowed URLs

Supabase restricts which origins can initiate auth flows:

1. Supabase dashboard → Authentication → URL Configuration
2. Set **Site URL** to your Vercel URL (e.g. `https://aurum-xyz.vercel.app`)
3. Add `https://aurum-xyz.vercel.app/**` to **Redirect URLs**

### Environment variable security

- `NEXT_PUBLIC_*` variables are bundled into client JS — only the Supabase URL and anon key should be public
- `SUPABASE_SERVICE_ROLE_KEY`, `PLAID_SECRET`, and `GEMINI_API_KEY` are server-only and never appear in the browser bundle; Vercel keeps them in an encrypted store

---

## Key design decisions

**Server components by default.** Dashboard, analytics, accounts, and settings pages fetch data on the server and pass it to client components as props. Only components that need interactivity (charts, transaction table, copilot chat, settings forms) are `'use client'`. No API-key exposure to the browser; no loading spinners for initial data.

**Instant navigation with `loading.tsx`.** Every protected route has a `loading.tsx` Suspense boundary. The URL updates immediately on click, the sidebar active highlight fires instantly via a `pendingHref` state, and a gold-tinted shimmer skeleton appears in under 50 ms while the server fetches real data. `prefetch={true}` on every sidebar link primes the loading state before the user clicks.

**Supabase RLS as the data boundary.** Every table has `auth.uid() = user_id` policies. All server routes also add explicit `.eq('user_id', userId)` — belt and suspenders. A misconfigured route cannot leak another user's data.

**Custom `GoldSelect` instead of native `<select>`.** Native select dropdowns inherit browser styling for the option list, which produces a jarring white popup on the dark theme. `components/ui/gold-select.tsx` builds the trigger and dropdown entirely from divs, giving full control over the dark background, gold border, and checkmark on the selected option. It includes keyboard navigation (Arrow Up/Down, Escape, Enter) and click-outside detection.

**Single currency formatter in `lib/fmt.ts`.** All monetary display goes through `fmtCurrency`, `fmtCurrencyCompact`, and `fmtTxnAmount`. Currency symbol or locale changes require editing one file.

**Deterministic PRNG in the seed script.** The seed uses a Linear Congruential Generator with a fixed seed constant. Every run of `seed.ts` produces the same dataset in the same order — makes automated-insight tests predictable.

**`FunctionCallingMode.NONE` on Round 2.** Not a soft prompt instruction — a hard API constraint. Gemini physically cannot emit another function call in Round 2, eliminating infinite-loop bugs at the API level.
