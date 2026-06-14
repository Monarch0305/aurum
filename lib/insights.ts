/**
 * Server-side insight functions.
 * Each function fetches its own slice of the transactions table and
 * returns deterministic computed results — the LLM never does this math.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { InsightCard, TrendInsight } from '@/types'

// ─── Public result types ──────────────────────────────────────────────────────

export interface TopCategory {
  category: string
  amount: number
  percentage: number
}

export interface Subscription {
  merchant: string
  monthlyAmount: number
  monthsFound: number
}

export interface Anomaly {
  category: string
  /** Raw amount in the (partial) current month */
  currentAmount: number
  /** Average monthly amount over the prior 3 complete months */
  avgAmount: number
  /** Based on full-month projection of the current partial month */
  spikePercent: number
}

export interface SavingsData {
  thisMonthIncome: number
  thisMonthSpending: number
  thisMonthSavings: number
  /** 0–100 */
  savingsRate: number
  sixMonthAvgMonthlySavings: number
  annualProjection: number
}

// ─── Date utilities ───────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function r2(n: number) {
  return Math.round(n * 100) / 100
}

/** YYYY-MM-DD string for the first day of month at `offset` from today. */
function monthStart(offset: number): string {
  const d = new Date()
  const t = new Date(d.getFullYear(), d.getMonth() + offset, 1)
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-01`
}

/** YYYY-MM-DD string for the last day of month at `offset` from today. */
function monthEnd(offset: number): string {
  const d = new Date()
  const t = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0)
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmt$(n: number): string {
  return `₹${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

// ─── 1. Top spending categories ───────────────────────────────────────────────

/**
 * Returns the top `limit` spending categories for the current calendar month,
 * ranked by total amount with percentage-of-total included.
 */
export async function getTopCategories(
  userId: string,
  limit = 5,
): Promise<TopCategory[]> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('transactions')
    .select('category, amount')
    .eq('user_id', userId)
    .gte('date', monthStart(0))
    .lte('date', monthEnd(0))
    .gt('amount', 0)  // expenses only (Plaid: positive = money leaving account)

  const txns = data ?? []

  const catMap = new Map<string, number>()
  for (const t of txns) {
    const c = t.category || 'Other'
    catMap.set(c, (catMap.get(c) ?? 0) + (t.amount as number))
  }

  const total = [...catMap.values()].reduce((a, b) => a + b, 0)

  return [...catMap.entries()]
    .map(([category, amount]) => ({
      category,
      amount: r2(amount),
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

// ─── 2. Recurring subscription detection ─────────────────────────────────────

/**
 * Finds merchants that charged the user in ≥2 of the last 3 calendar months
 * with amounts within 15% of each other (consistent charge = subscription).
 * Returns results sorted by monthly amount descending.
 */
export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('transactions')
    .select('merchant, amount, date')
    .eq('user_id', userId)
    .gte('date', monthStart(-2))  // 3 months: m-2, m-1, m-0
    .lte('date', monthEnd(0))
    .gt('amount', 0)

  const txns = data ?? []

  // Group by merchant → track amounts and distinct months
  const mMap = new Map<string, { amounts: number[]; months: Set<string> }>()
  for (const t of txns) {
    const monthKey = (t.date as string).slice(0, 7)  // YYYY-MM
    if (!mMap.has(t.merchant as string)) {
      mMap.set(t.merchant as string, { amounts: [], months: new Set() })
    }
    const entry = mMap.get(t.merchant as string)!
    entry.amounts.push(t.amount as number)
    entry.months.add(monthKey)
  }

  const subs: Subscription[] = []
  for (const [merchant, { amounts, months }] of mMap) {
    if (months.size < 2) continue
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
    // All charges within 15% of the average → consistent recurring charge
    const isConsistent = amounts.every((a) => avg > 0 && Math.abs(a - avg) / avg <= 0.15)
    if (isConsistent) {
      subs.push({ merchant, monthlyAmount: r2(avg), monthsFound: months.size })
    }
  }

  return subs.sort((a, b) => b.monthlyAmount - a.monthlyAmount)
}

// ─── 3. Anomaly detection ─────────────────────────────────────────────────────

/**
 * Compares current-month spending per category (prorated to full month)
 * against the average of the prior 3 complete months.
 * Flags any category where the projected current-month total is >20% above average.
 */
export async function getAnomalies(userId: string): Promise<Anomaly[]> {
  const today = new Date()
  const daysElapsed = today.getDate()

  // Need at least 5 days of current-month data for a reliable signal
  if (daysElapsed < 5) return []

  const daysInCurrentMonth = new Date(
    today.getFullYear(), today.getMonth() + 1, 0,
  ).getDate()
  const prorationFactor = daysInCurrentMonth / daysElapsed

  const admin = createAdminClient()

  // Fetch 4 months in one query: 3 complete baseline months + current month
  const { data } = await admin
    .from('transactions')
    .select('category, amount, date')
    .eq('user_id', userId)
    .gte('date', monthStart(-3))
    .lte('date', todayStr())
    .gt('amount', 0)

  const txns = data ?? []

  const curStart  = monthStart(0)
  const curEnd    = monthEnd(0)
  const blMonths  = [monthStart(-1), monthStart(-2), monthStart(-3)] as const
  const blEnds    = [monthEnd(-1),   monthEnd(-2),   monthEnd(-3)]   as const

  // Current-month category sums
  const currentCatMap = new Map<string, number>()
  for (const t of txns) {
    if ((t.date as string) >= curStart && (t.date as string) <= curEnd) {
      const c = (t.category as string) || 'Other'
      currentCatMap.set(c, (currentCatMap.get(c) ?? 0) + (t.amount as number))
    }
  }

  // Baseline: per-category amount per prior month, then average
  // monthSums[i] = { category → amount } for baseline month i
  const monthSums: Map<string, number>[] = [0, 1, 2].map((i) => {
    const s = blMonths[i]
    const e = blEnds[i]
    const m = new Map<string, number>()
    for (const t of txns) {
      if ((t.date as string) >= s && (t.date as string) <= e) {
        const c = (t.category as string) || 'Other'
        m.set(c, (m.get(c) ?? 0) + (t.amount as number))
      }
    }
    return m
  })

  // Per-category average across the months where there was spending
  const avgMap = new Map<string, number>()
  const allCats = new Set<string>([
    ...monthSums[0].keys(), ...monthSums[1].keys(), ...monthSums[2].keys(),
  ])
  for (const cat of allCats) {
    const nonZeroAmounts = [0, 1, 2]
      .map((i) => monthSums[i].get(cat) ?? 0)
      .filter((a) => a > 0)
    if (nonZeroAmounts.length > 0) {
      avgMap.set(cat, nonZeroAmounts.reduce((s, a) => s + a, 0) / nonZeroAmounts.length)
    }
  }

  const anomalies: Anomaly[] = []
  for (const [cat, currentAmount] of currentCatMap) {
    const avg = avgMap.get(cat)
    if (!avg || avg <= 0) continue  // no baseline to compare against

    // Project the partial month to a full-month estimate
    const projectedAmount = currentAmount * prorationFactor
    const spikePercent = r2(((projectedAmount - avg) / avg) * 100)

    if (spikePercent > 20) {
      anomalies.push({
        category: cat,
        currentAmount: r2(currentAmount),
        avgAmount: r2(avg),
        spikePercent,
      })
    }
  }

  return anomalies.sort((a, b) => b.spikePercent - a.spikePercent)
}

// ─── 4. Savings rate + annual projection ─────────────────────────────────────

/**
 * Computes this month's savings rate and an annual projection based on
 * the 6-month rolling average (excluding the current incomplete month).
 */
export async function getSavingsData(userId: string): Promise<SavingsData> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('transactions')
    .select('amount, date')
    .eq('user_id', userId)
    .gte('date', monthStart(-6))
    .lte('date', monthEnd(0))
    .eq('pending', false)

  const txns = data ?? []

  const curStart = monthStart(0)
  const curEnd   = monthEnd(0)

  const thisMonthTxns = txns.filter(
    (t) => (t.date as string) >= curStart && (t.date as string) <= curEnd,
  )
  const thisMonthIncome = r2(
    thisMonthTxns.filter((t) => (t.amount as number) < 0)
      .reduce((s, t) => s + Math.abs(t.amount as number), 0),
  )
  const thisMonthSpending = r2(
    thisMonthTxns.filter((t) => (t.amount as number) > 0)
      .reduce((s, t) => s + (t.amount as number), 0),
  )
  const thisMonthSavings = r2(thisMonthIncome - thisMonthSpending)
  const savingsRate =
    thisMonthIncome > 0 ? r2((thisMonthSavings / thisMonthIncome) * 100) : 0

  // Rolling average from the 6 prior complete months (exclude current month)
  const olderTxns = txns.filter((t) => (t.date as string) < curStart)
  const mSavMap = new Map<string, { income: number; spending: number }>()
  for (const t of olderTxns) {
    const mk = (t.date as string).slice(0, 7)
    if (!mSavMap.has(mk)) mSavMap.set(mk, { income: 0, spending: 0 })
    const m = mSavMap.get(mk)!
    if ((t.amount as number) < 0) m.income   += Math.abs(t.amount as number)
    else                          m.spending += t.amount as number
  }

  const monthlySavingsArr = [...mSavMap.values()].map((m) => m.income - m.spending)
  const sixMonthAvgMonthlySavings =
    monthlySavingsArr.length > 0
      ? r2(monthlySavingsArr.reduce((s, a) => s + a, 0) / monthlySavingsArr.length)
      : thisMonthSavings

  return {
    thisMonthIncome,
    thisMonthSpending,
    thisMonthSavings,
    savingsRate,
    sixMonthAvgMonthlySavings,
    annualProjection: r2(sixMonthAvgMonthlySavings * 12),
  }
}

// ─── Dashboard builder (InsightCard[]) ───────────────────────────────────────

/**
 * Runs all four insight functions in parallel and formats the results as
 * InsightCard[] ready to pass to the AiWidget component.
 */
export async function buildDashboardInsights(userId: string): Promise<InsightCard[]> {
  const [topCats, subscriptions, anomalies, savings] = await Promise.all([
    getTopCategories(userId, 1),
    getSubscriptions(userId),
    getAnomalies(userId),
    getSavingsData(userId),
  ])

  const insights: InsightCard[] = []

  // ── 1. Top spending category ──
  const topCat = topCats[0]
  insights.push(
    topCat
      ? {
          title: `Top: ${topCat.category}`,
          description: `${fmt$(topCat.amount)} — ${topCat.percentage}% of this month's spending`,
          type: topCat.percentage > 40 ? 'warning' : 'info',
        }
      : {
          title: 'No spending recorded',
          description: 'Connect a bank account and sync transactions to unlock insights.',
          type: 'info',
        },
  )

  // ── 2. Spending anomaly ──
  const topAnomaly = anomalies[0]
  insights.push(
    topAnomaly
      ? {
          title: `${topAnomaly.category} spike detected`,
          description:
            `Up ${topAnomaly.spikePercent.toFixed(0)}% vs your 3-month avg ` +
            `(${fmt$(topAnomaly.avgAmount)} → ${fmt$(topAnomaly.currentAmount)} so far this month)` +
            (anomalies.length > 1
              ? `. ${anomalies.length - 1} other categor${anomalies.length === 2 ? 'y' : 'ies'} also elevated.`
              : '.'),
          type: 'warning',
        }
      : {
          title: 'No spending spikes',
          description: 'All categories are within 20% of their 3-month averages.',
          type: 'success',
        },
  )

  // ── 3. Subscriptions ──
  const monthlySubTotal = r2(subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0))
  const annualSubTotal  = r2(monthlySubTotal * 12)
  insights.push(
    subscriptions.length > 0
      ? {
          title: `${subscriptions.length} recurring subscription${subscriptions.length === 1 ? '' : 's'}`,
          description:
            `${fmt$(monthlySubTotal)}/mo (${fmt$(annualSubTotal)}/yr). ` +
            `Top: ${subscriptions.slice(0, 2).map((s) => s.merchant).join(', ')}.`,
          type: 'info',
        }
      : {
          title: 'No subscriptions detected',
          description: 'No merchants with consistent monthly charges in the last 3 months.',
          type: 'info',
        },
  )

  // ── 4. Savings rate + projection ──
  insights.push(
    savings.thisMonthIncome > 0
      ? {
          title:
            savings.savingsRate >= 20
              ? `${savings.savingsRate.toFixed(1)}% savings rate — great!`
              : savings.savingsRate > 0
              ? `${savings.savingsRate.toFixed(1)}% savings rate`
              : 'Spending exceeds income this month',
          description:
            `Saved ${fmt$(Math.max(0, savings.thisMonthSavings))} of ${fmt$(savings.thisMonthIncome)} earned. ` +
            `Annual projection: ${fmt$(Math.max(0, savings.annualProjection))}.`,
          type:
            savings.savingsRate >= 20 ? 'success'
            : savings.savingsRate > 0 ? 'info'
            : 'warning',
        }
      : {
          title: 'Savings rate',
          description: 'No income transactions this month yet — sync or connect an account.',
          type: 'info',
        },
  )

  return insights
}

// ─── Analytics builder (TrendInsight[]) ──────────────────────────────────────

/**
 * Runs the anomaly, subscription, and savings functions in parallel and
 * formats the results as TrendInsight[] for the TrendStrip component.
 */
export async function buildAnalyticsTrendInsights(userId: string): Promise<TrendInsight[]> {
  const [subscriptions, anomalies, savings] = await Promise.all([
    getSubscriptions(userId),
    getAnomalies(userId),
    getSavingsData(userId),
  ])

  const monthlySubTotal = r2(subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0))

  const insights: TrendInsight[] = [
    // ── Anomaly detection ──
    (() => {
      const top = anomalies[0]
      return top
        ? {
            kind: 'anomaly' as const,
            title: `${top.category} up ${top.spikePercent.toFixed(0)}% this month`,
            description:
              `${top.category} is on pace for ${fmt$(top.currentAmount)} this month — ` +
              `${top.spikePercent.toFixed(0)}% above your 3-month avg of ${fmt$(top.avgAmount)}.` +
              (anomalies.length > 1
                ? ` ${anomalies.length - 1} other categor${anomalies.length === 2 ? 'y' : 'ies'} also trending higher.`
                : ''),
            value: `+${top.spikePercent.toFixed(0)}% vs avg`,
            positive: false,
          }
        : {
            kind: 'anomaly' as const,
            title: 'No category anomalies this month',
            description:
              'All spending categories are within 20% of their 3-month averages. ' +
              'Your spending looks consistent with recent history.',
            value: '✓ On track',
            positive: true,
          }
    })(),

    // ── Subscriptions ──
    {
      kind: 'subscriptions' as const,
      title:
        subscriptions.length > 0
          ? `${subscriptions.length} subscription${subscriptions.length === 1 ? '' : 's'} — ${fmt$(monthlySubTotal)}/mo`
          : 'No recurring subscriptions found',
      description:
        subscriptions.length > 0
          ? `${fmt$(monthlySubTotal)}/mo (${fmt$(monthlySubTotal * 12)}/yr) in recurring charges detected. ` +
            `Top charges: ${subscriptions.slice(0, 3).map((s) => `${s.merchant} ${fmt$(s.monthlyAmount)}`).join(', ')}.`
          : 'No merchants with consistent monthly charges were detected in the last 3 months.',
      value: subscriptions.length > 0 ? `${fmt$(monthlySubTotal)}/mo` : '₹0/mo',
      positive: true,  // subscriptions card is always gold/neutral — informational
    },

    // ── Savings rate + annual projection ──
    {
      kind: 'savings' as const,
      title:
        savings.savingsRate >= 20
          ? `${savings.savingsRate.toFixed(1)}% savings rate — on target`
          : savings.savingsRate > 0
          ? `${savings.savingsRate.toFixed(1)}% savings rate`
          : savings.thisMonthIncome > 0
          ? 'Spending exceeds income this month'
          : 'No income data this month',
      description:
        savings.thisMonthIncome > 0
          ? `Saved ${fmt$(Math.max(0, savings.thisMonthSavings))} of ${fmt$(savings.thisMonthIncome)} earned. ` +
            `At your 6-month average pace, you'll save ${fmt$(Math.max(0, savings.annualProjection))} this year.`
          : 'Connect or sync income accounts to track your savings rate and annual projection.',
      value:
        savings.annualProjection > 0
          ? `${fmt$(savings.annualProjection)}/yr est.`
          : `${savings.savingsRate.toFixed(1)}%`,
      positive: savings.savingsRate >= 10,
    },
  ]

  return insights
}
