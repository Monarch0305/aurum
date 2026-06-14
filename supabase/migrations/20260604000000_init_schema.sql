-- =============================================================================
-- Aurum — initial schema
-- Tables: plaid_items, accounts, transactions
-- All tables use auth.users FK + RLS so users only see their own rows.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- plaid_items
-- One row per linked institution per user.
-- access_token is Plaid's long-lived token — NEVER expose it to the browser.
-- All Plaid API calls must go through server routes using the service-role key,
-- which bypasses RLS. The anon-key SELECT policy lets the frontend show the
-- user their connected institutions (name only); access_token is never
-- requested from the client.
-- ---------------------------------------------------------------------------
create table if not exists public.plaid_items (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  access_token     text        not null,
  item_id          text        not null unique,
  institution_name text        not null,
  created_at       timestamptz not null default now()
);

comment on column public.plaid_items.access_token is
  'Plaid access token — server-side only, never read from the browser';


-- ---------------------------------------------------------------------------
-- accounts
-- One row per bank / credit / investment account within a plaid_item.
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  plaid_account_id text        not null,
  name             text        not null,
  type             text        not null check (type in ('savings', 'credit', 'investment')),
  balance          numeric(14,2) not null default 0,
  currency         text        not null default 'INR',
  last_synced      timestamptz,           -- null until first sync
  created_at       timestamptz not null default now(),

  unique (user_id, plaid_account_id)
);


-- ---------------------------------------------------------------------------
-- transactions
-- Individual financial events pulled from Plaid.
-- amount > 0 = money out (expense); amount < 0 = money in (income/refund).
-- This matches Plaid's sign convention.
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id                   uuid        primary key default gen_random_uuid(),
  account_id           uuid        not null references public.accounts(id) on delete cascade,
  user_id              uuid        not null references auth.users(id) on delete cascade,
  plaid_transaction_id text        not null unique,
  date                 date        not null,
  amount               numeric(14,2) not null,
  merchant             text,
  category             text,
  subcategory          text,
  pending              boolean     not null default false,
  created_at           timestamptz not null default now()
);

comment on column public.transactions.amount is
  'Positive = debit/expense, negative = credit/income — matches Plaid convention';


-- =============================================================================
-- Indexes
-- =============================================================================

-- plaid_items
create index if not exists plaid_items_user_id_idx
  on public.plaid_items (user_id);

-- accounts
create index if not exists accounts_user_id_idx
  on public.accounts (user_id);

create index if not exists accounts_plaid_account_id_idx
  on public.accounts (plaid_account_id);

-- transactions — cover the common query patterns
create index if not exists transactions_user_id_idx
  on public.transactions (user_id);

create index if not exists transactions_account_id_idx
  on public.transactions (account_id);

-- date-range scans (most common: "last 30 days")
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- category breakdown aggregations
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category);

-- pending filter (e.g. exclude pending from totals)
create index if not exists transactions_pending_idx
  on public.transactions (user_id, pending);


-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.plaid_items   enable row level security;
alter table public.accounts      enable row level security;
alter table public.transactions  enable row level security;

-- Force RLS even for the table owner (extra safety layer)
alter table public.plaid_items   force row level security;
alter table public.accounts      force row level security;
alter table public.transactions  force row level security;


-- ---------------------------------------------------------------------------
-- plaid_items policies
-- ---------------------------------------------------------------------------
create policy "plaid_items: users select own"
  on public.plaid_items
  for select
  using (auth.uid() = user_id);

create policy "plaid_items: users insert own"
  on public.plaid_items
  for insert
  with check (auth.uid() = user_id);

create policy "plaid_items: users update own"
  on public.plaid_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plaid_items: users delete own"
  on public.plaid_items
  for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- accounts policies
-- ---------------------------------------------------------------------------
create policy "accounts: users select own"
  on public.accounts
  for select
  using (auth.uid() = user_id);

create policy "accounts: users insert own"
  on public.accounts
  for insert
  with check (auth.uid() = user_id);

create policy "accounts: users update own"
  on public.accounts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "accounts: users delete own"
  on public.accounts
  for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- transactions policies
-- ---------------------------------------------------------------------------
create policy "transactions: users select own"
  on public.transactions
  for select
  using (auth.uid() = user_id);

create policy "transactions: users insert own"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

create policy "transactions: users update own"
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions: users delete own"
  on public.transactions
  for delete
  using (auth.uid() = user_id);
