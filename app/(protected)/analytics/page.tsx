import { BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buildAnalyticsTrendInsights } from '@/lib/insights'
import AnalyticsKpiCard from '@/components/analytics/AnalyticsKpiCard'
import IncomeExpensesChart, { type MonthBucket } from '@/components/analytics/IncomeExpensesChart'
import GroupedBarChart from '@/components/analytics/GroupedBarChart'
import DonutChart, { type CategorySlice } from '@/components/analytics/DonutChart'
import TrendStrip from '@/components/analytics/TrendStrip'

export const metadata = { title: 'Analytics — Aurum' }

// ─── helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}


// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()

  // Fetch 12 months of confirmed transactions (charts) + insight functions in parallel
  const twelveMonthsAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1)
  const [rawResult, trendInsights] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', user!.id)
      .eq('pending', false)
      .gte('date', fmtDate(twelveMonthsAgo))
      .order('date', { ascending: false }),
    buildAnalyticsTrendInsights(user!.id),
  ])

  const txns = rawResult.data ?? []

  // ── Build monthly buckets (last 6 months, index 0 = oldest) ────────────────

  function buildBucket(monthOffset: number): MonthBucket & { start: string; end: string } {
    const d = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const start = `${y}-${pad(m)}-01`
    const end = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const slice = txns.filter((t) => t.date >= start && t.date <= end)
    const income = round2(slice.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0))
    const expenses = round2(slice.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0))
    return { label, income, expenses, net: round2(income - expenses), start, end }
  }

  // Index 0 = 5 months ago … index 5 = current month
  const months: (MonthBucket & { start: string; end: string })[] = Array.from(
    { length: 6 },
    (_, i) => buildBucket(5 - i)
  )

  // ── KPI aggregates ─────────────────────────────────────────────────────────

  const avgMonthlySpend = round2(mean(months.map((m) => m.expenses)))
  const avgMonthlyIncome = round2(mean(months.map((m) => m.income)))
  const netCashflow = round2(avgMonthlyIncome - avgMonthlySpend)
  const savingsRate =
    avgMonthlyIncome > 0
      ? round2((netCashflow / avgMonthlyIncome) * 100)
      : 0

  // Period comparison: recent 3 vs prior 3
  const recent3 = months.slice(3)
  const prior3 = months.slice(0, 3)

  const avgRecentSpend = mean(recent3.map((m) => m.expenses))
  const avgPriorSpend = mean(prior3.map((m) => m.expenses))
  const spendTrend =
    avgPriorSpend > 0
      ? round2(((avgRecentSpend - avgPriorSpend) / avgPriorSpend) * 100)
      : 0

  const avgRecentIncome = mean(recent3.map((m) => m.income))
  const avgPriorIncome = mean(prior3.map((m) => m.income))
  const incomeTrend =
    avgPriorIncome > 0
      ? round2(((avgRecentIncome - avgPriorIncome) / avgPriorIncome) * 100)
      : 0

  const avgRecentNet = mean(recent3.map((m) => m.net))
  const avgPriorNet = mean(prior3.map((m) => m.net))
  const netTrend =
    Math.abs(avgPriorNet) > 0
      ? round2(((avgRecentNet - avgPriorNet) / Math.abs(avgPriorNet)) * 100)
      : 0

  const recentSavingsRate =
    avgRecentIncome > 0
      ? round2(((avgRecentIncome - avgRecentSpend) / avgRecentIncome) * 100)
      : 0
  const priorSavingsRate =
    avgPriorIncome > 0
      ? round2(((avgPriorIncome - avgPriorSpend) / avgPriorIncome) * 100)
      : 0
  const savingsRateDelta = round2(recentSavingsRate - priorSavingsRate) // percentage-point change

  // ── Category donut — last 3 months ────────────────────────────────────────

  const recent3Start = months[3].start
  const recent3End = months[5].end

  const catMap = new Map<string, number>()
  txns
    .filter((t) => t.amount > 0 && t.date >= recent3Start && t.date <= recent3End)
    .forEach((t) => {
      const c = t.category || 'Other'
      catMap.set(c, (catMap.get(c) ?? 0) + t.amount)
    })

  const donutTotal = round2([...catMap.values()].reduce((a, b) => a + b, 0))
  const categories: CategorySlice[] = [...catMap.entries()]
    .map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percentage: donutTotal > 0 ? Math.round((amount / donutTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1180, position: 'relative' }}>
      {/* Page-level ambient glows */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 500,
          height: 500,
          top: '5%',
          left: '35%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.028), transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 350,
          height: 350,
          bottom: '15%',
          right: '8%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.022), transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BarChart2 size={17} color="#D4AF37" />
        </div>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: '#f0ece2',
              margin: '0 0 3px',
              letterSpacing: '-0.01em',
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.38)', margin: 0 }}>
            6-month financial overview
          </p>
        </div>
      </div>

      {/* ── KPI row — 4 cards, each with distinct colored accent ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <AnalyticsKpiCard
          title="Avg Monthly Spend"
          value={avgMonthlySpend}
          icon="credit-card"
          accentColor="#e57373"
          trend={spendTrend || undefined}
          trendPositiveIsGood={false}
          subLabel="6-month avg"
        />
        <AnalyticsKpiCard
          title="Avg Monthly Income"
          value={avgMonthlyIncome}
          icon="trending-up"
          accentColor="#81c784"
          trend={incomeTrend || undefined}
          trendPositiveIsGood={true}
          subLabel="6-month avg"
        />
        <AnalyticsKpiCard
          title="Net Cashflow"
          value={netCashflow}
          icon="zap"
          accentColor="#64b5f6"
          trend={netTrend || undefined}
          trendPositiveIsGood={true}
          subLabel="avg income − spend"
        />
        <AnalyticsKpiCard
          title="Savings Rate"
          value={savingsRate}
          prefix=""
          suffix="%"
          decimals={1}
          icon="piggy-bank"
          accentColor="#D4AF37"
          trend={savingsRateDelta !== 0 ? savingsRateDelta : undefined}
          trendLabel="pts vs prior quarter"
          trendPositiveIsGood={true}
          subLabel="6-month avg"
        />
      </div>

      {/* ── Charts row 1: line (3) | grouped bar (2) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 14,
          marginBottom: 14,
          alignItems: 'stretch',
        }}
      >
        <IncomeExpensesChart data={months} />
        <GroupedBarChart data={months} />
      </div>

      {/* ── Charts row 2: donut (2) | trend strip (3) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 3fr',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        <DonutChart data={categories} totalSpending={donutTotal} />
        <TrendStrip insights={trendInsights} />
      </div>
    </div>
  )
}
