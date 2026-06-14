import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Shared types (must match CopilotPage) ────────────────────────────────────

interface BarEntry  { label: string; amount: number }
interface LegendRow { name: string; amount: number; color: string }
export interface DataCard {
  title: string
  total: number
  period: string
  changePercent?: number
  chartData: BarEntry[]
  breakdown: LegendRow[]
}

interface DateRange { start: string; end: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'gemini-2.0-flash'

const COLORS = [
  '#e57373', '#81c784', '#64b5f6', '#ffb74d',
  '#ba68c8', '#4db6ac', '#f06292', '#dce775',
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function daysAgoStr(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().split('T')[0]
}

function monthRange(offset: number): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + offset          // offset 0 = this month, -1 = last month
  const first = new Date(y, m, 1)
  const last  = new Date(y, m + 1, 0)
  return {
    start: first.toISOString().split('T')[0],
    end:   last.toISOString().split('T')[0],
  }
}

function defaultRange(): DateRange {
  return { start: daysAgoStr(30), end: todayStr() }
}

function fmtShortRange(d: DateRange): string {
  const fmt = (s: string) =>
    new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(d.start)} – ${fmt(d.end)}`
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function buildChartData(
  txns: Array<{ date: string; amount: number }>,
  start: string,
  end: string,
  buckets = 6,
): BarEntry[] {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime() + 86_400_000   // inclusive end
  const step = Math.max((e - s) / buckets, 1)
  const sums = new Array<number>(buckets).fill(0)

  for (const tx of txns) {
    const t = new Date(tx.date + 'T12:00:00').getTime()
    const idx = Math.min(Math.floor((t - s) / step), buckets - 1)
    if (idx >= 0) sums[idx] += tx.amount
  }

  const daysPerBucket = ((e - s) / 86_400_000) / buckets

  return sums.map((amount, i) => {
    const d = new Date(s + i * step)
    let label: string
    if (daysPerBucket <= 2) {
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (daysPerBucket <= 8) {
      label = `Wk ${i + 1}`
    } else {
      label = d.toLocaleDateString('en-US', { month: 'short' })
    }
    return { label, amount: Math.round(amount * 100) / 100 }
  })
}

// ─── Gemini function declarations ─────────────────────────────────────────────

const FUNCTION_DECLARATIONS = [
  {
    name: 'sum_spending',
    description:
      'Get the exact total amount spent for a category and/or time period. Use this for "how much did I spend on X?" questions. Only counts expenses (positive amounts = money leaving the account).',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'Spending category keyword (e.g. "Food and Drink", "Travel", "Shopping"). Omit to sum ALL spending.',
        },
        date_range: {
          type: 'object',
          description: 'Date range. Omit to default to the last 30 days.',
          properties: {
            start: { type: 'string', description: 'YYYY-MM-DD' },
            end:   { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['start', 'end'],
        },
      },
    },
  },
  {
    name: 'count_transactions',
    description:
      'Count the number of transactions (optionally filtered by category and date range). Use for "how many times did I…" questions.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category keyword to filter by. Omit for all transactions.',
        },
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', description: 'YYYY-MM-DD' },
            end:   { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['start', 'end'],
        },
      },
    },
  },
  {
    name: 'get_subscriptions',
    description:
      'Detect recurring subscriptions by finding merchants that charged the user in 2 or more of the last 3 months with consistent amounts. Use for "what are my subscriptions?" questions.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'compare_periods',
    description:
      'Compare spending totals for a category (or all spending) across two time periods. Use for "compare X to Y" or "how does this month compare to last month?" questions.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category keyword. Omit to compare all spending.',
        },
        period1: {
          type: 'object',
          description: 'The primary/newer period.',
          properties: {
            start: { type: 'string', description: 'YYYY-MM-DD' },
            end:   { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['start', 'end'],
        },
        period2: {
          type: 'object',
          description: 'The comparison/older period.',
          properties: {
            start: { type: 'string', description: 'YYYY-MM-DD' },
            end:   { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['start', 'end'],
        },
      },
      required: ['period1', 'period2'],
    },
  },
  {
    name: 'get_top_categories',
    description:
      'Get the top spending categories ranked by total amount for a time period. Use for "what did I spend the most on?" or "spending breakdown" questions.',
    parameters: {
      type: 'object',
      properties: {
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', description: 'YYYY-MM-DD' },
            end:   { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['start', 'end'],
        },
        limit: {
          type: 'number',
          description: 'Max categories to return. Defaults to 5.',
        },
      },
    },
  },
]

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const thisMonth = monthRange(0)
  const lastMonth = monthRange(-1)
  const last30    = { start: daysAgoStr(30), end: todayStr() }
  const thisYear  = {
    start: `${new Date().getFullYear()}-01-01`,
    end: todayStr(),
  }

  return `You are Aurum's AI Finance Copilot — an expert personal finance assistant.
Today's date: ${today}.

CRITICAL RULE: You NEVER compute or estimate financial numbers yourself. You MUST always call a function to retrieve exact data from the user's database before answering any financial question.

Relative date references (use these exact dates):
- "this month"   → ${thisMonth.start} to ${thisMonth.end}
- "last month"   → ${lastMonth.start} to ${lastMonth.end}
- "last 30 days" → ${last30.start} to ${last30.end}
- "this year"    → ${thisYear.start} to ${thisYear.end}
- "last 3 months"→ ${daysAgoStr(90)} to ${todayStr()}

After receiving function results, respond ONLY with this exact JSON (no markdown, no code fences):
{
  "reply": "2-3 sentence conversational response using the exact numbers provided. Use **bold** for key figures. Be insightful.",
  "followUps": ["Relevant follow-up question 1", "Relevant follow-up question 2", "Relevant follow-up question 3"]
}

If no transactions are found, say so honestly in the reply and suggest syncing data.`
}

// ─── Supabase query helpers ───────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>

interface RawTx {
  date: string
  amount: number
  merchant: string
  category: string
  subcategory: string
}

async function fetchTransactions(
  admin: AdminClient,
  userId: string,
  range: DateRange,
  category?: string,
): Promise<RawTx[]> {
  let q = admin
    .from('transactions')
    .select('date, amount, merchant, category, subcategory')
    .eq('user_id', userId)
    .gte('date', range.start)
    .lte('date', range.end)
    .gt('amount', 0)   // expenses only

  if (category?.trim()) {
    q = q.ilike('category', `%${category.trim()}%`)
  }

  const { data } = await q
  return (data ?? []) as RawTx[]
}

// ─── Tool executors ───────────────────────────────────────────────────────────

async function runSumSpending(
  input: { category?: string; date_range?: DateRange },
  userId: string,
  admin: AdminClient,
): Promise<{ toolResult: string; card: DataCard }> {
  const range = input.date_range ?? defaultRange()
  const txns  = await fetchTransactions(admin, userId, range, input.category)
  const total = txns.reduce((s, t) => s + t.amount, 0)

  // Breakdown by subcategory (top 5)
  const subMap = new Map<string, number>()
  for (const t of txns) {
    const key = t.subcategory || t.category || 'Other'
    subMap.set(key, (subMap.get(key) ?? 0) + t.amount)
  }
  const breakdown: LegendRow[] = [...subMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], i) => ({ name, amount: Math.round(amount * 100) / 100, color: COLORS[i] }))

  const card: DataCard = {
    title: input.category ? `${input.category} Spending` : 'Total Spending',
    total: Math.round(total * 100) / 100,
    period: fmtShortRange(range),
    chartData: buildChartData(txns, range.start, range.end),
    breakdown,
  }

  const toolResult = JSON.stringify({
    total: card.total,
    currency: 'INR',
    period: range,
    transaction_count: txns.length,
    top_subcategories: breakdown.map((b) => ({ name: b.name, amount: b.amount })),
  })

  return { toolResult, card }
}

async function runCountTransactions(
  input: { category?: string; date_range?: DateRange },
  userId: string,
  admin: AdminClient,
): Promise<{ toolResult: string; card: DataCard }> {
  const range = input.date_range ?? defaultRange()
  const txns  = await fetchTransactions(admin, userId, range, input.category)

  // Group by merchant for breakdown
  const mMap = new Map<string, number>()
  for (const t of txns) {
    mMap.set(t.merchant, (mMap.get(t.merchant) ?? 0) + 1)
  }
  const breakdown: LegendRow[] = [...mMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({ name, amount: count, color: COLORS[i] }))

  const card: DataCard = {
    title: input.category ? `${input.category} Transactions` : 'Transaction Count',
    total: txns.length,
    period: fmtShortRange(range),
    chartData: buildChartData(txns, range.start, range.end),
    breakdown,
  }

  const toolResult = JSON.stringify({
    count: txns.length,
    period: range,
    category: input.category ?? 'all',
    top_merchants: breakdown.map((b) => ({ merchant: b.name, visits: b.amount })),
  })

  return { toolResult, card }
}

async function runGetSubscriptions(
  userId: string,
  admin: AdminClient,
): Promise<{ toolResult: string; card: DataCard }> {
  // Fetch 90 days of expense transactions
  const range = { start: daysAgoStr(90), end: todayStr() }
  const { data } = await admin
    .from('transactions')
    .select('merchant, amount, date')
    .eq('user_id', userId)
    .gte('date', range.start)
    .gt('amount', 0)

  const txns = (data ?? []) as Array<{ merchant: string; amount: number; date: string }>

  // Group by merchant: collect unique months and amounts
  const mMap = new Map<string, { months: Set<string>; amounts: number[] }>()
  for (const t of txns) {
    const monthKey = t.date.slice(0, 7)   // YYYY-MM
    if (!mMap.has(t.merchant)) mMap.set(t.merchant, { months: new Set(), amounts: [] })
    const entry = mMap.get(t.merchant)!
    entry.months.add(monthKey)
    entry.amounts.push(t.amount)
  }

  // A subscription: appears in ≥2 months AND amounts are within 15% of each other
  const subs: Array<{ merchant: string; monthlyAmount: number; monthsFound: number }> = []
  for (const [merchant, { months, amounts }] of mMap) {
    if (months.size < 2) continue
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const isConsistent = amounts.every((a) => Math.abs(a - avg) / avg <= 0.15)
    if (isConsistent) {
      subs.push({ merchant, monthlyAmount: Math.round(avg * 100) / 100, monthsFound: months.size })
    }
  }
  subs.sort((a, b) => b.monthlyAmount - a.monthlyAmount)

  const monthlyTotal = subs.reduce((s, sub) => s + sub.monthlyAmount, 0)

  // Chart: same flat monthly total across last 6 months (subscriptions are recurring)
  const chartData: BarEntry[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      amount: Math.round(monthlyTotal * 100) / 100,
    }
  })

  const breakdown: LegendRow[] = subs.slice(0, 6).map((s, i) => ({
    name: s.merchant,
    amount: s.monthlyAmount,
    color: COLORS[i],
  }))

  const card: DataCard = {
    title: 'Recurring Subscriptions',
    total: Math.round(monthlyTotal * 100) / 100,
    period: 'Per month',
    chartData,
    breakdown,
  }

  const toolResult = JSON.stringify({
    subscriptions: subs.slice(0, 10),
    monthly_total: card.total,
    annual_total: Math.round(card.total * 12 * 100) / 100,
    subscription_count: subs.length,
  })

  return { toolResult, card }
}

async function runComparePeriods(
  input: { category?: string; period1: DateRange; period2: DateRange },
  userId: string,
  admin: AdminClient,
): Promise<{ toolResult: string; card: DataCard }> {
  const [txns1, txns2] = await Promise.all([
    fetchTransactions(admin, userId, input.period1, input.category),
    fetchTransactions(admin, userId, input.period2, input.category),
  ])

  const total1 = Math.round(txns1.reduce((s, t) => s + t.amount, 0) * 100) / 100
  const total2 = Math.round(txns2.reduce((s, t) => s + t.amount, 0) * 100) / 100
  const changePercent = total2 > 0
    ? Math.round(((total1 - total2) / total2) * 100)
    : null

  const p1Label = fmtShortRange(input.period1)
  const p2Label = fmtShortRange(input.period2)

  const card: DataCard = {
    title: input.category ? `${input.category} Comparison` : 'Spending Comparison',
    total: total1,
    period: p1Label,
    changePercent: changePercent ?? undefined,
    chartData: [
      { label: p2Label, amount: total2 },
      { label: p1Label, amount: total1 },
    ],
    breakdown: [
      { name: p1Label, amount: total1, color: COLORS[0] },
      { name: p2Label, amount: total2, color: COLORS[1] },
    ],
  }

  const toolResult = JSON.stringify({
    period1: { range: input.period1, total: total1, count: txns1.length },
    period2: { range: input.period2, total: total2, count: txns2.length },
    change_percent: changePercent,
    change_amount: Math.round((total1 - total2) * 100) / 100,
  })

  return { toolResult, card }
}

async function runGetTopCategories(
  input: { date_range?: DateRange; limit?: number },
  userId: string,
  admin: AdminClient,
): Promise<{ toolResult: string; card: DataCard }> {
  const range = input.date_range ?? defaultRange()
  const limit = input.limit ?? 5
  const txns  = await fetchTransactions(admin, userId, range)

  // Aggregate by category
  const catMap = new Map<string, number>()
  for (const t of txns) {
    const key = t.category || 'Other'
    catMap.set(key, (catMap.get(key) ?? 0) + t.amount)
  }

  const sorted = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  const grandTotal = sorted.reduce((s, [, a]) => s + a, 0)

  const breakdown: LegendRow[] = sorted.map(([name, amount], i) => ({
    name,
    amount: Math.round(amount * 100) / 100,
    color: COLORS[i % COLORS.length],
  }))

  const card: DataCard = {
    title: 'Top Spending Categories',
    total: Math.round(grandTotal * 100) / 100,
    period: fmtShortRange(range),
    chartData: breakdown.map((b) => ({ label: b.name.split(' ')[0], amount: b.amount })),
    breakdown,
  }

  const toolResult = JSON.stringify({
    categories: breakdown.map((b) => ({
      category: b.name,
      total: b.amount,
      percentage: grandTotal > 0 ? Math.round((b.amount / grandTotal) * 100) : 0,
    })),
    grand_total: card.total,
    period: range,
  })

  return { toolResult, card }
}

// ─── Tool dispatcher ──────────────────────────────────────────────────────────

async function dispatchTool(
  name: string,
  input: Record<string, unknown>,
  userId: string,
  admin: AdminClient,
): Promise<{ toolResult: string; card: DataCard }> {
  switch (name) {
    case 'sum_spending':
      return runSumSpending(
        input as { category?: string; date_range?: DateRange },
        userId, admin,
      )
    case 'count_transactions':
      return runCountTransactions(
        input as { category?: string; date_range?: DateRange },
        userId, admin,
      )
    case 'get_subscriptions':
      return runGetSubscriptions(userId, admin)
    case 'compare_periods':
      return runComparePeriods(
        input as { category?: string; period1: DateRange; period2: DateRange },
        userId, admin,
      )
    case 'get_top_categories':
      return runGetTopCategories(
        input as { date_range?: DateRange; limit?: number },
        userId, admin,
      )
    default:
      return {
        toolResult: JSON.stringify({ error: `Unknown function: ${name}` }),
        card: { title: '', total: 0, period: '', chartData: [], breakdown: [] },
      }
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const question: string = body?.question?.trim()
    if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

    const admin = createAdminClient()
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const systemPrompt = buildSystemPrompt()

    const gemini = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS as any }],
    })

    // ── Round 1: Gemini routes the question to a function ──────────────────
    const round1Result = await gemini.generateContent({
      contents: [{ role: 'user', parts: [{ text: question }] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    })

    const round1Response = round1Result.response
    const functionCalls = round1Response.functionCalls()

    // If Gemini answered directly (no function call — rare for financial questions)
    if (!functionCalls?.length) {
      const text = round1Response.text()
      const parsed = tryParseJson(text)
      return NextResponse.json({
        reply:     parsed?.reply     ?? text,
        followUps: parsed?.followUps ?? [],
      })
    }

    // ── Execute function calls ────────────────────────────────────────────────
    let card: DataCard | undefined
    const functionResponseParts: Array<{
      functionResponse: { name: string; response: { result: string } }
    }> = []

    for (const call of functionCalls) {
      const { toolResult, card: toolCard } = await dispatchTool(
        call.name,
        call.args as Record<string, unknown>,
        user.id,
        admin,
      )

      functionResponseParts.push({
        functionResponse: { name: call.name, response: { result: toolResult } },
      })

      // Keep the card from the most data-rich function (last one wins if multiple)
      if (toolCard.total > 0 || toolCard.breakdown.length > 0) card = toolCard
    }

    // ── Round 2: Gemini writes the natural-language response ──────────────────
    // FunctionCallingMode.NONE prevents any further function calls.
    const candidates = round1Response.candidates
    if (!candidates?.length) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const round2Result = await gemini.generateContent({
      contents: [
        { role: 'user',  parts: [{ text: question }] },
        { role: 'model', parts: candidates[0].content.parts },
        { role: 'user',  parts: functionResponseParts },
      ],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.NONE } },
    })

    const rawText = round2Result.response.text()
    const parsed  = tryParseJson(rawText)

    return NextResponse.json({
      reply:     parsed?.reply     ?? rawText,
      followUps: parsed?.followUps ?? [],
      card:      card?.breakdown.length ? card : undefined,
    })
  } catch (err) {
    console.error('[ai/chat]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function tryParseJson(text: string): { reply?: string; followUps?: string[] } | null {
  try {
    // Gemini sometimes wraps JSON in markdown code fences
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}
