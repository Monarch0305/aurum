# Aurum — AI Personal Finance Copilot

## What this is
A premium personal finance dashboard where users connect bank accounts (via Plaid sandbox), see transactions/spending on a dashboard, and ask questions about their money in plain English via an AI copilot.

## Tech stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Auth + DB**: Supabase (Auth for login/signup, Postgres for data)
- **Bank connection**: Plaid (sandbox mode only — no real money)
- **AI**: Anthropic Claude API (structured output / tool use for Q&A)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Design system — BLACK AND GOLD GLASSMORPHISM

This is non-negotiable. The entire app uses a premium dark theme:

### Colors
```
Background base:     #09090d (near-black, slight blue tint)
Gold primary:        #D4AF37
Gold light:          #F5D576
Gold dark:           #9A7B2A
Text primary:        #f0ece2 (warm off-white, NOT pure white)
Text muted:          rgba(240, 236, 226, 0.45)
Text hint:           rgba(240, 236, 226, 0.25)
Success/Income:      #81c784
Danger/Expense:      #e57373
Card background:     rgba(255, 255, 255, 0.03)
Card border:         rgba(212, 175, 55, 0.1)
Card border hover:   rgba(212, 175, 55, 0.25)
Gold accent border:  rgba(212, 175, 55, 0.2) — used as directional 1.5px accents
```

### Card style (glassmorphism)
- Background: rgba(255,255,255,0.03)
- Border: 0.5px solid rgba(212,175,55,0.1)
- Border radius: 16px
- On hover: border-color transitions to rgba(212,175,55,0.25)
- Some cards get a directional gold accent: border-top, border-left, or border-right at 1.5px

### 3D Icon style
Every icon sits on a raised slab:
- Background: linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))
- Box shadow: 4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)
- Border: 0.5px solid rgba(212,175,55,0.12)
- Icon color: linear-gradient(180deg, #F5D576, #D4AF37, #9A7B2A) as background-clip text
- Sizes: 44px (large/KPI), 36px (transaction rows), 28-30px (section headers), 22-24px (inline/small)

### Gold ambient glows
Subtle radial gradients placed behind content:
- background: radial-gradient(circle, rgba(212,175,55,0.06), transparent 65%)
- Position absolute, pointer-events none
- Usually 250-350px circles, 2-3 per page

### Typography
- Two weights only: 400 (regular) and 500 (medium)
- KPI numbers: 26px, weight 500
- Section headers: 13-14px, weight 500
- Body/labels: 12-13px, weight 400
- Hints/timestamps: 10-11px
- Letter spacing on uppercase labels: 0.04-0.05em

### Micro-interactions
- Number counters animate up on page load (requestAnimationFrame with cubic easing)
- Bar charts grow with staggered animation-delay
- Transaction rows fade + slide in staggered
- Cards lift 2px on hover (translateY(-2px))
- Gold border brightens on hover
- Skeleton shimmer while loading

### Navigation
- Sidebar with icon3d logo "Aurum" at top
- Nav items: Dashboard, Transactions, Analytics, Accounts, AI Copilot, Settings
- Active item: background rgba(212,175,55,0.1), text color #D4AF37, icon uses gold gradient

## Database schema

### accounts table
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- plaid_account_id (text)
- name (text) — e.g. "HDFC Savings Account"
- type (text) — savings, credit, investment
- balance (numeric)
- currency (text, default 'INR')
- last_synced (timestamptz)
- created_at (timestamptz)

### transactions table
- id (uuid, PK)
- account_id (uuid, FK to accounts)
- user_id (uuid, FK to auth.users)
- plaid_transaction_id (text, unique)
- date (date)
- amount (numeric)
- merchant (text)
- category (text) — from Plaid categories
- subcategory (text)
- pending (boolean)
- created_at (timestamptz)

### plaid_items table
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- access_token (text, encrypted)
- item_id (text)
- institution_name (text)
- created_at (timestamptz)

## Pages and routes

### /login and /signup
- Auth forms with Supabase Auth (email + password)
- Same black-gold theme
- Redirect to /dashboard on success

### /dashboard (protected)
- KPI cards: total balance, income, spending (animated counters)
- Spending overview bar chart (week/month/year toggle)
- Category breakdown with gold progress bars
- Recent transactions list with 3D icons
- Compact AI copilot widget (insight cards + mini chat)

### /transactions (protected)
- Full transaction list with search, date filter, category filter
- Each row has 3D merchant icon, name, category, date, amount
- Pagination or infinite scroll

### /analytics (protected)
- 4 KPI cards with period comparison
- Income vs expenses line chart (Recharts)
- Month-over-month grouped bar chart
- Category donut chart
- AI trend analysis strip (3 insight cards)

### /accounts (protected)
- Connected accounts list (savings, credit, investment cards)
- Per-account balance, sync status, recent activity
- Credit utilization bar for credit cards
- FD maturity/interest details for investments
- "Connect account" button triggers Plaid Link
- Dashed "link another" card at bottom

### /copilot (protected)
- Full-page chat interface
- Chat history sidebar
- Structured data response cards (mini charts, subscription lists, etc.)
- Suggested prompt starters grid
- "142 transactions indexed" status in header

## AI Q&A architecture (CRITICAL — explain in interviews)

The LLM does NOT compute financial numbers. Here's the flow:
1. User types: "How much did I spend on food in March?"
2. Server sends question to Claude API with tool_use / structured output
3. Claude returns JSON: { "category": "food", "month": "March", "operation": "sum" }
4. YOUR CODE runs the actual SQL query against Supabase
5. Your code computes the exact number deterministically
6. Optionally pass the result back to Claude for a friendly natural language response

Why: LLMs hallucinate arithmetic. Money must be exact. The model ROUTES the question; deterministic code does the math.

## AI insights (auto-generated, Step 7)

Server functions that run on dashboard load:
- Top spending categories (simple aggregation)
- Recurring subscription detection (find merchants appearing monthly)
- Anomaly detection (compare current month to 3-month average, flag >20% spikes)
- Savings rate and projection

## Environment variables needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
ANTHROPIC_API_KEY=
```

## Build order
1. Next.js scaffold + Tailwind + shadcn/ui setup
2. Supabase Auth (login, signup, protected routes)
3. Database tables (migration SQL)
4. Plaid Link integration (connect bank button)
5. Transaction sync (server route to pull from Plaid → upsert to DB)
6. Dashboard UI (KPIs, chart, transactions, theme)
7. Transactions page
8. Analytics page
9. Accounts page
10. AI Q&A (structured output → deterministic query)
11. AI insights (auto-summaries, anomaly detection)
12. Copilot full page
13. Polish (animations, loading states, error handling)
14. Deploy to Vercel

## Code conventions
- Use server components by default, client components only when needed (interactivity)
- All Plaid/AI API calls happen in server routes (API keys never touch browser)
- Use Supabase RLS (Row Level Security) so users only see their own data
- TypeScript strict mode
- Components go in /components, organized by feature
- Reusable UI primitives in /components/ui (shadcn)
- Server actions or API routes in /app/api/
