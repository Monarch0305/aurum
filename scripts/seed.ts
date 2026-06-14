/**
 * Aurum — seed script
 *
 * Inserts realistic mock data for a given Supabase user:
 *   • 1 fake Plaid item  (HDFC Bank)
 *   • 3 accounts         (HDFC Savings, ICICI Credit Card, SBI Fixed Deposit)
 *   • ~150 transactions  across the last 6 calendar months
 *
 * All amounts are in Indian Rupees (INR). Transaction patterns exercise every
 * app feature:
 *   • 6 recurring subscriptions  → subscription detection
 *   • Large travel purchase in current month → anomaly detection (>20 % spike)
 *   • Monthly salary deposit     → savings rate + annual projection
 *   • Varied Food, Shopping, Travel, Utilities, Healthcare
 *
 * Usage — see README.md § "Seeding mock data"
 */

import { readFileSync } from 'fs'
import { resolve }      from 'path'
import { createClient } from '@supabase/supabase-js'
import ws              from 'ws'

// ─── 1. Load .env.local ───────────────────────────────────────────────────────
// tsx doesn't auto-load Next.js env files, so we parse .env.local ourselves.
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch { /* rely on existing env */ }

// ─── 2. Parse arguments ───────────────────────────────────────────────────────

const args = process.argv.slice(2)
const cleanFlag  = args.includes('--clean')
const userIdx    = args.indexOf('--user')
const userArgId  = userIdx !== -1 ? args[userIdx + 1] : undefined
const USER_ID    = userArgId ?? process.env.SEED_USER_ID

if (!USER_ID) {
  console.error(
    '\n  ✗ No user ID supplied.\n' +
    '    Pass one of:\n' +
    '      SEED_USER_ID=<uuid> npx tsx scripts/seed.ts\n' +
    '      npx tsx scripts/seed.ts --user <uuid>\n'
  )
  process.exit(1)
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n  ✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    '    Make sure .env.local is populated.\n'
  )
  process.exit(1)
}

// ─── 3. Supabase admin client ─────────────────────────────────────────────────

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
})

// ─── 4. Seeded pseudo-random number generator ─────────────────────────────────
// LCG — deterministic so every run produces the same dataset.

class RNG {
  private s: number
  constructor(seed = 0xA04B7C3E) { this.s = seed >>> 0 }

  next(): number {
    this.s = (Math.imul(1_664_525, this.s) + 1_013_904_223) | 0
    return (this.s >>> 0) / 4_294_967_296
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]
  }

  /** Vary a base amount by ±pct (default ±10 %) */
  vary(base: number, pct = 0.10): number {
    return base * (1 + (this.next() * 2 - 1) * pct)
  }
}

const rng = new RNG(0xA04B7C3E)

// ─── 5. Helpers ───────────────────────────────────────────────────────────────

function pad(n: number): string { return String(n).padStart(2, '0') }
function r2(n: number):  number { return Math.round(n * 100) / 100 }

/** Today's year/month/day */
const TODAY = new Date()
const TODAY_YEAR  = TODAY.getFullYear()
const TODAY_MONTH = TODAY.getMonth()   // 0-indexed
const TODAY_DAY   = TODAY.getDate()

/** Calendar month at `offset` months from today (offset 0 = current). */
function calMonth(offset: number): { year: number; month: number } {
  const raw = TODAY_MONTH + offset
  const year  = TODAY_YEAR + Math.floor(raw / 12)
  const month = ((raw % 12) + 12) % 12
  return { year, month }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** YYYY-MM-DD string */
function dateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** Upper bound on date for a given month (capped at today for current month). */
function maxDay(offset: number): number {
  if (offset === 0) return TODAY_DAY
  return daysInMonth(calMonth(offset).year, calMonth(offset).month)
}

// ─── 6. Account definitions ───────────────────────────────────────────────────

const PLAID_ITEM = {
  user_id:          USER_ID,
  access_token:     'access-sandbox-seed-001',
  item_id:          'seed-item-001',
  institution_name: 'HDFC Bank',
}

interface AccountDef {
  key:              'savings' | 'credit' | 'investment'
  plaid_account_id: string
  name:             string
  type:             'savings' | 'credit' | 'investment'
  balance:          number
  currency:         string
}

// AccountKey matches the 'key' field, used to route transactions to the right account
type AccountKey = 'savings' | 'credit' | 'investment'

const ACCOUNT_DEFS: AccountDef[] = [
  {
    key:              'savings',
    plaid_account_id: 'seed-acc-savings-001',
    name:             'HDFC Savings Account',
    type:             'savings',
    balance:          1_84_320.50,   // ₹1,84,320.50
    currency:         'INR',
  },
  {
    key:              'credit',
    plaid_account_id: 'seed-acc-credit-001',
    name:             'ICICI Coral Credit Card',
    type:             'credit',
    balance:          38_450.00,     // ₹38,450 outstanding
    currency:         'INR',
  },
  {
    key:              'investment',
    plaid_account_id: 'seed-acc-invest-001',
    name:             'SBI Fixed Deposit',
    type:             'investment',
    balance:          5_00_000.00,   // ₹5,00,000 FD
    currency:         'INR',
  },
]

// ─── 7. Transaction templates ─────────────────────────────────────────────────

interface TxnDef {
  merchant:    string
  category:    string
  subcategory: string
  account:     AccountKey
  amount:      number  // positive = expense, negative = income (Plaid convention)
  day:         number  // fixed day-of-month
  /** Month offsets to include. Default: all 6 months [-5..0]. */
  months?:     number[]
}

// All 6 months unless overridden
const ALL_MONTHS = [-5, -4, -3, -2, -1, 0]

// ── Monthly fixed transactions ────────────────────────────────────────────────

const FIXED_TXNS: TxnDef[] = [
  // ── Income ──────────────────────────────────────────────────────────────────
  {
    merchant:    'Infosys Ltd Salary',
    category:    'Transfer',
    subcategory: 'Payroll',
    account:     'savings',
    amount:      -85_000.00,   // ₹85,000 salary (negative = credit / income)
    day:         1,
  },

  // ── Housing ─────────────────────────────────────────────────────────────────
  {
    merchant:    'Prestige Apartments Rent',
    category:    'Housing',
    subcategory: 'Rent',
    account:     'savings',
    amount:      25_000.00,    // ₹25,000/month rent
    day:         1,
  },

  // ── Subscriptions (all 6 months → subscription detection fires) ──────────────
  {
    merchant:    'Netflix',
    category:    'Entertainment',
    subcategory: 'Streaming Services',
    account:     'credit',
    amount:      649.00,       // Netflix India Premium plan
    day:         8,
  },
  {
    merchant:    'Spotify',
    category:    'Entertainment',
    subcategory: 'Music and Audio',
    account:     'credit',
    amount:      119.00,       // Spotify India Individual
    day:         12,
  },
  {
    merchant:    'Apple',
    category:    'Technology',
    subcategory: 'Cloud Services',
    account:     'credit',
    amount:      75.00,        // iCloud+ 50 GB India pricing
    day:         5,
  },
  {
    merchant:    'Amazon',
    category:    'Shopping',
    subcategory: 'Memberships and Subscriptions',
    account:     'credit',
    amount:      1_499.00,     // Amazon Prime India annual / monthly
    day:         10,
  },
  {
    merchant:    'Cult.fit',
    category:    'Recreation',
    subcategory: 'Gyms and Fitness Centers',
    account:     'credit',
    amount:      2_000.00,     // Cult.fit monthly membership
    day:         3,
  },
  {
    merchant:    'Adobe Creative Cloud',
    category:    'Technology',
    subcategory: 'Software',
    account:     'credit',
    amount:      4_230.00,     // Adobe CC India plan (monthly)
    day:         20,
  },

  // ── Utilities ────────────────────────────────────────────────────────────────
  {
    merchant:    'ACT Fibernet',
    category:    'Utilities',
    subcategory: 'Internet and Phone',
    account:     'savings',
    amount:      999.00,       // ACT Fibernet broadband plan
    day:         22,
  },

  // ── Duolingo Plus — starts month -3 so subscription detector finds 3 months ─
  {
    merchant:    'Duolingo',
    category:    'Education',
    subcategory: 'Online Courses',
    account:     'credit',
    amount:      416.00,       // Duolingo Super India (monthly)
    day:         14,
    months:      [-3, -2, -1],   // 3 months; day 14 is past today (day 6) so skipped in current month
  },
]

// ── Variable transactions — generated per month ───────────────────────────────

interface VarGroup {
  count:       number
  merchants:   readonly string[]
  category:    string
  subcategory: string
  account:     AccountKey
  amountMin:   number
  amountMax:   number
}

const VAR_GROUPS: VarGroup[] = [
  {
    // Groceries: BigBasket, DMart, Reliance Fresh — ₹3,000–5,000 per trip
    count:       3,
    merchants:   ['BigBasket', 'DMart', 'Reliance Fresh', 'Nature\'s Basket', 'Spencer\'s'],
    category:    'Food and Drink',
    subcategory: 'Groceries',
    account:     'credit',
    amountMin:   3_000,
    amountMax:   5_500,
  },
  {
    // Restaurants: Zomato, Swiggy orders and dine-out — ₹500–1,500
    count:       4,
    merchants:   [
      'Zomato', 'Swiggy', 'Barbeque Nation', 'Social',
      'Burma Burma', 'Smoke House Deli', 'Pizza Express',
      'Chaayos', 'Mainland China', 'Farzi Cafe',
    ],
    category:    'Food and Drink',
    subcategory: 'Restaurants',
    account:     'credit',
    amountMin:   500,
    amountMax:   1_500,
  },
  {
    // Coffee shops — ₹150–300
    count:       3,
    merchants:   ['Starbucks', 'Blue Tokai Coffee', 'Third Wave Coffee', 'Café Coffee Day', 'Barista'],
    category:    'Food and Drink',
    subcategory: 'Coffee Shop',
    account:     'credit',
    amountMin:   150,
    amountMax:   300,
  },
  {
    // Online shopping: Amazon, Myntra, Flipkart — ₹500–5,000
    count:       2,
    merchants:   ['Amazon', 'Myntra', 'Flipkart', 'Nykaa'],
    category:    'Shopping',
    subcategory: 'Online Marketplaces',
    account:     'credit',
    amountMin:   500,
    amountMax:   5_000,
  },
  {
    // Rideshare: Uber, Ola — ₹200–500
    count:       2,
    merchants:   ['Uber', 'Ola'],
    category:    'Travel',
    subcategory: 'Taxi',
    account:     'credit',
    amountMin:   200,
    amountMax:   500,
  },
  {
    // Fuel: HPCL, IOCL, BPCL petrol pump — ₹2,500–4,500 per fill-up
    count:       2,
    merchants:   ['HPCL Petrol Pump', 'Indian Oil', 'BPCL'],
    category:    'Travel',
    subcategory: 'Gas Stations',
    account:     'savings',
    amountMin:   2_500,
    amountMax:   4_500,
  },
  {
    // Electricity: BESCOM, Tata Power — ₹1,200–2,500/month
    count:       1,
    merchants:   ['BESCOM', 'Tata Power', 'MSEDCL'],
    category:    'Utilities',
    subcategory: 'Electric',
    account:     'savings',
    amountMin:   1_200,
    amountMax:   2_500,
  },
]

// ── One-off transactions (specific month offsets) ─────────────────────────────

interface OneOff {
  merchant:    string
  category:    string
  subcategory: string
  account:     AccountKey
  amount:      number
  monthOffset: number
  day:         number
}

const ONE_OFFS: OneOff[] = [
  // Month -5 (Jan): book purchase at Crossword
  {
    merchant: 'Crossword Bookstores', category: 'Shopping', subcategory: 'Books',
    account: 'credit', amount: 850, monthOffset: -5, day: 18,
  },
  // Month -4 (Feb): clothing (Westside) + salon
  {
    merchant: 'Westside', category: 'Shopping', subcategory: 'Clothing and Accessories',
    account: 'credit', amount: 3_200, monthOffset: -4, day: 11,
  },
  {
    merchant: 'Naturals Salon', category: 'Personal Care', subcategory: 'Hair Salon',
    account: 'credit', amount: 1_200, monthOffset: -4, day: 24,
  },
  // Month -3 (Mar): domestic flight + hotel (weekend trip to Goa)
  {
    merchant: 'IndiGo Airlines', category: 'Travel', subcategory: 'Airlines',
    account: 'credit', amount: 8_500, monthOffset: -3, day: 7,
  },
  {
    merchant: 'Taj Hotels', category: 'Travel', subcategory: 'Hotels and Motels',
    account: 'credit', amount: 6_200, monthOffset: -3, day: 8,
  },
  // Month -3 (Mar): movie at PVR
  {
    merchant: 'PVR Cinemas', category: 'Entertainment', subcategory: 'Movies and DVDs',
    account: 'credit', amount: 950, monthOffset: -3, day: 22,
  },
  // Month -2 (Apr): electronics (OnePlus accessories) at Croma
  {
    merchant: 'Croma', category: 'Shopping', subcategory: 'Electronics',
    account: 'credit', amount: 4_999, monthOffset: -2, day: 15,
  },
  // Month -2 (Apr): home goods from IKEA
  {
    merchant: 'IKEA', category: 'Shopping', subcategory: 'Hardware Stores',
    account: 'credit', amount: 7_450, monthOffset: -2, day: 27,
  },
  // Month -1 (May): pharmacy + doctor visit
  {
    merchant: 'Apollo Pharmacy', category: 'Healthcare', subcategory: 'Pharmacies and Supplements',
    account: 'credit', amount: 780, monthOffset: -1, day: 9,
  },
  {
    merchant: 'Apollo Hospitals', category: 'Healthcare', subcategory: 'Doctor and Dentist',
    account: 'credit', amount: 1_500, monthOffset: -1, day: 21,
  },
  // Month -1 (May): special dinner at fine-dining restaurant
  {
    merchant: 'Indian Accent', category: 'Food and Drink', subcategory: 'Restaurants',
    account: 'credit', amount: 5_800, monthOffset: -1, day: 16,
  },
  // Month 0 (Jun, day ≤6): ANOMALY — domestic flight booking.
  // Travel 3-month avg ≈ ₹3,200 (Uber/Ola in Apr & May, trip in Mar).
  // ₹12,500 × (30/6) = ₹62,500 projected → anomaly fires.
  {
    merchant: 'Air India', category: 'Travel', subcategory: 'Airlines',
    account: 'credit', amount: 12_500, monthOffset: 0, day: 4,
  },
  // Month 0 (Jun): normal grocery run so Food/Drink doesn't spike
  {
    merchant: 'BigBasket', category: 'Food and Drink', subcategory: 'Groceries',
    account: 'credit', amount: 3_850, monthOffset: 0, day: 2,
  },
  // Month 0 (Jun): coffee
  {
    merchant: 'Blue Tokai Coffee', category: 'Food and Drink', subcategory: 'Coffee Shop',
    account: 'credit', amount: 280, monthOffset: 0, day: 3,
  },
]

// ─── 8. Build transaction rows ────────────────────────────────────────────────

interface TxnRow {
  merchant:    string
  category:    string
  subcategory: string
  account:     AccountKey
  amount:      number
  date:        string
}

function buildTransactions(): TxnRow[] {
  const rows: TxnRow[] = []

  // ── Fixed monthly ──────────────────────────────────────────────────────────
  for (const def of FIXED_TXNS) {
    const applicableMonths = def.months ?? ALL_MONTHS
    for (const offset of applicableMonths) {
      const { year, month } = calMonth(offset)
      const limit = maxDay(offset)
      if (def.day > limit) continue  // billing date hasn't hit yet in current month
      rows.push({
        merchant:    def.merchant,
        category:    def.category,
        subcategory: def.subcategory,
        account:     def.account,
        amount:      def.amount,
        date:        dateStr(year, month, def.day),
      })
    }
  }

  // ── Variable per month ─────────────────────────────────────────────────────
  for (const offset of ALL_MONTHS) {
    const { year, month } = calMonth(offset)
    const limit = maxDay(offset)
    if (limit < 1) continue

    // For the current month, reduce count proportionally to days elapsed
    const scaleFactor = offset === 0 ? (limit / 30) : 1

    for (const grp of VAR_GROUPS) {
      const count = Math.max(1, Math.round(grp.count * scaleFactor))
      for (let i = 0; i < count; i++) {
        const day = rng.int(1, limit)
        rows.push({
          merchant:    rng.pick(grp.merchants),
          category:    grp.category,
          subcategory: grp.subcategory,
          account:     grp.account,
          amount:      r2(rng.float(grp.amountMin, grp.amountMax)),
          date:        dateStr(year, month, day),
        })
      }
    }
  }

  // ── One-offs ────────────────────────────────────────────────────────────────
  for (const oo of ONE_OFFS) {
    const { year, month } = calMonth(oo.monthOffset)
    const limit = maxDay(oo.monthOffset)
    if (oo.day > limit) continue
    rows.push({
      merchant:    oo.merchant,
      category:    oo.category,
      subcategory: oo.subcategory,
      account:     oo.account,
      amount:      oo.amount,
      date:        dateStr(year, month, oo.day),
    })
  }

  // Sort oldest → newest for clean display
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

// ─── 9. Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n  Aurum seed script  (INR / India)')
  console.log('  ─────────────────────────────────────────')
  console.log(`  User    : ${USER_ID}`)
  console.log(`  Project : ${SUPABASE_URL}`)
  console.log(`  Date    : ${dateStr(TODAY_YEAR, TODAY_MONTH, TODAY_DAY)}`)
  if (cleanFlag) console.log('  Mode    : --clean  (existing seed data will be deleted)')
  console.log()

  // ── Optional clean ────────────────────────────────────────────────────────
  if (cleanFlag) {
    process.stdout.write('  Deleting existing seed data … ')

    await db.from('transactions').delete()
      .eq('user_id', USER_ID)
      .like('plaid_transaction_id', 'seed-txn-%')

    await db.from('accounts').delete()
      .eq('user_id', USER_ID)
      .like('plaid_account_id', 'seed-acc-%')

    await db.from('plaid_items').delete()
      .eq('user_id', USER_ID)
      .eq('item_id', 'seed-item-001')

    console.log('done')
  }

  // ── Plaid item ────────────────────────────────────────────────────────────
  process.stdout.write('  Inserting plaid_item … ')
  const { error: itemErr } = await db.from('plaid_items')
    .upsert(PLAID_ITEM, { onConflict: 'item_id' })
  if (itemErr) throw new Error(`plaid_items: ${itemErr.message}`)
  console.log('done')

  // ── Accounts ──────────────────────────────────────────────────────────────
  process.stdout.write('  Inserting 3 accounts … ')
  const { data: insertedAccounts, error: accErr } = await db
    .from('accounts')
    .upsert(
      ACCOUNT_DEFS.map((a) => ({
        user_id:          USER_ID,
        plaid_account_id: a.plaid_account_id,
        name:             a.name,
        type:             a.type,
        balance:          a.balance,
        currency:         a.currency,
        last_synced:      new Date().toISOString(),
      })),
      { onConflict: 'user_id,plaid_account_id', ignoreDuplicates: false }
    )
    .select('id, plaid_account_id')

  if (accErr) throw new Error(`accounts: ${accErr.message}`)
  console.log('done')

  // Map account key → DB uuid
  const accountIdMap = new Map<AccountKey, string>()
  for (const def of ACCOUNT_DEFS) {
    const row = (insertedAccounts ?? []).find(
      (a: { id: string; plaid_account_id: string }) =>
        a.plaid_account_id === def.plaid_account_id
    )
    if (row) accountIdMap.set(def.key, row.id as string)
  }

  if (accountIdMap.size !== 3) {
    const { data: fetched } = await db
      .from('accounts')
      .select('id, plaid_account_id')
      .eq('user_id', USER_ID)
      .in('plaid_account_id', ACCOUNT_DEFS.map((a) => a.plaid_account_id))

    for (const def of ACCOUNT_DEFS) {
      const row = (fetched ?? []).find(
        (a: { id: string; plaid_account_id: string }) =>
          a.plaid_account_id === def.plaid_account_id
      )
      if (row) accountIdMap.set(def.key, row.id as string)
    }
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  const txnRows = buildTransactions()
  process.stdout.write(`  Inserting ${txnRows.length} transactions … `)

  const txnInserts = txnRows.map((row, i) => ({
    account_id:           accountIdMap.get(row.account)!,
    user_id:              USER_ID!,
    plaid_transaction_id: `seed-txn-${String(i + 1).padStart(4, '0')}`,
    date:                 row.date,
    amount:               row.amount,
    merchant:             row.merchant,
    category:             row.category,
    subcategory:          row.subcategory,
    pending:              false,
  }))

  // Upsert in batches of 100 to stay within Supabase payload limits
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < txnInserts.length; i += BATCH) {
    const batch = txnInserts.slice(i, i + BATCH)
    const { error: txErr } = await db
      .from('transactions')
      .upsert(batch, { onConflict: 'plaid_transaction_id' })
    if (txErr) throw new Error(`transactions batch ${i / BATCH + 1}: ${txErr.message}`)
    inserted += batch.length
  }

  console.log('done')

  // ── Summary ───────────────────────────────────────────────────────────────
  const catCounts = new Map<string, number>()
  for (const t of txnRows) {
    catCounts.set(t.category, (catCounts.get(t.category) ?? 0) + 1)
  }

  const expenses = txnRows.filter((t) => t.amount > 0)
  const income   = txnRows.filter((t) => t.amount < 0)
  const totalExp = r2(expenses.reduce((s, t) => s + t.amount, 0))
  const totalInc = r2(income.reduce((s, t) => s + Math.abs(t.amount), 0))

  console.log()
  console.log('  ✓ Seed complete')
  console.log('  ─────────────────────────────────────────')
  console.log(`  Transactions : ${inserted}`)
  console.log(`  Expenses     : ₹${totalExp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
  console.log(`  Income       : ₹${totalInc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)
  console.log()
  console.log('  By category:')

  const sorted = [...catCounts.entries()].sort((a, b) => b[1] - a[1])
  for (const [cat, count] of sorted) {
    console.log(`    ${String(count).padStart(3)}  ${cat}`)
  }

  console.log()
  console.log('  App features exercised:')
  console.log('    • Subscription detection  — Netflix ₹649, Spotify ₹119, Apple ₹75,')
  console.log('                                Amazon Prime ₹1,499, Cult.fit ₹2,000,')
  console.log('                                Adobe CC ₹4,230, Duolingo ₹416 (3 mo)')
  console.log('    • Anomaly detection       — Air India ₹12,500 on day 4 of current month')
  console.log('    • Savings rate            — ₹85,000 Infosys salary each month')
  console.log('    • Top categories          — Food and Drink dominates')
  console.log()
}

main().catch((err) => {
  console.error('\n  ✗ Seed failed:', err.message)
  process.exit(1)
})
