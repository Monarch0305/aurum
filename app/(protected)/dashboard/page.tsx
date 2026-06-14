import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/types'
import { buildDashboardInsights } from '@/lib/insights'
import KpiCard from '@/components/dashboard/KpiCard'
import SpendingChart from '@/components/dashboard/SpendingChart'
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown'
import TransactionList from '@/components/dashboard/TransactionList'
import AiWidget from '@/components/dashboard/AiWidget'

// ─── date helpers ────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// ─── page ────────────────────────────────────────────────────────────────────

export const metadata = { title: 'Dashboard — Aurum' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()
  const som = new Date(today.getFullYear(), today.getMonth(), 1)
  const solm = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const eolm = new Date(today.getFullYear(), today.getMonth(), 0)
  const oya = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

  const somStr = fmtDate(som)
  const solmStr = fmtDate(solm)
  const eolmStr = fmtDate(eolm)

  // Parallel fetch — all queries hit Supabase at once
  const [accountsRes, yearTxnsRes, recentTxnsRes, aiInsights] = await Promise.all([
    supabase
      .from('accounts')
      .select('balance, currency, name')
      .eq('user_id', user!.id),

    supabase
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', user!.id)
      .gte('date', fmtDate(oya))
      .eq('pending', false)
      .order('date', { ascending: false }),

    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(8),

    buildDashboardInsights(user!.id),
  ])

  const accounts = accountsRes.data ?? []
  const yearTxns = yearTxnsRes.data ?? []
  const recentTxns = (recentTxnsRes.data ?? []) as Transaction[]

  // ── KPI numbers ──────────────────────────────────────────────────────────

  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)

  const thisMonthTxns = yearTxns.filter((t) => t.date >= somStr)
  const lastMonthTxns = yearTxns.filter(
    (t) => t.date >= solmStr && t.date <= eolmStr
  )

  const totalSpending = thisMonthTxns
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  const totalIncome = thisMonthTxns
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const lastMonthSpending = lastMonthTxns
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  const lastMonthIncome = lastMonthTxns
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const spendingChange =
    lastMonthSpending > 0
      ? ((totalSpending - lastMonthSpending) / lastMonthSpending) * 100
      : 0

  const incomeChange =
    lastMonthIncome > 0
      ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100
      : 0

  // ── Category breakdown ───────────────────────────────────────────────────

  const catMap = new Map<string, number>()
  thisMonthTxns
    .filter((t) => t.amount > 0)
    .forEach((t) => {
      const c = t.category || 'Other'
      catMap.set(c, (catMap.get(c) ?? 0) + t.amount)
    })

  const categories = [...catMap.entries()]
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage:
        totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  // ── Chart data ───────────────────────────────────────────────────────────

  // Week: last 7 days, one bar per day
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const ds = fmtDate(d)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    const amount =
      Math.round(
        yearTxns
          .filter((t) => t.date === ds && t.amount > 0)
          .reduce((s, t) => s + t.amount, 0) * 100
      ) / 100
    return { label, amount }
  })

  // Month: 4 weekly buckets of current month
  const yr = today.getFullYear()
  const mo = today.getMonth() + 1
  const dim = new Date(yr, mo, 0).getDate()
  const monthData = [
    { label: 'Wk 1', s: `${yr}-${pad(mo)}-01`, e: `${yr}-${pad(mo)}-07` },
    { label: 'Wk 2', s: `${yr}-${pad(mo)}-08`, e: `${yr}-${pad(mo)}-14` },
    { label: 'Wk 3', s: `${yr}-${pad(mo)}-15`, e: `${yr}-${pad(mo)}-21` },
    {
      label: 'Wk 4',
      s: `${yr}-${pad(mo)}-22`,
      e: `${yr}-${pad(mo)}-${pad(dim)}`,
    },
  ].map(({ label, s, e }) => ({
    label,
    amount:
      Math.round(
        yearTxns
          .filter((t) => t.date >= s && t.date <= e && t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0) * 100
      ) / 100,
  }))

  // Year: last 12 months, one bar per month
  const yearData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const ms = `${y}-${pad(m)}-01`
    const me = `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const amount =
      Math.round(
        yearTxns
          .filter((t) => t.date >= ms && t.date <= me && t.amount > 0)
          .reduce((s, t) => s + t.amount, 0) * 100
      ) / 100
    return { label, amount }
  })

  const transactionCount = yearTxns.length

  // ── Greeting ─────────────────────────────────────────────────────────────

  const hour = today.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const username = user!.email?.split('@')[0] ?? 'there'
  const dateDisplay = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1180, position: 'relative' }}>
      {/* Background ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 500,
          height: 500,
          top: '10%',
          left: '35%',
          background:
            'radial-gradient(circle, rgba(212,175,55,0.03), transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: '#f0ece2',
            margin: '0 0 5px',
            letterSpacing: '-0.01em',
          }}
        >
          {greeting},{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #F5D576, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {username}
          </span>
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(240,236,226,0.38)',
            margin: 0,
          }}
        >
          {dateDisplay}
        </p>
      </div>

      {/* ── KPI row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiCard
          title="Total Balance"
          value={totalBalance}
          icon="wallet"
          accentSide="top"
        />
        <KpiCard
          title="Monthly Income"
          value={totalIncome}
          icon="trending-up"
          trend={incomeChange || undefined}
          trendPositiveIsGood={true}
          accentSide="top"
        />
        <KpiCard
          title="Monthly Spending"
          value={totalSpending}
          icon="trending-down"
          trend={spendingChange || undefined}
          trendPositiveIsGood={false}
          accentSide="top"
        />
      </div>

      {/* ── Chart + Categories ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          marginBottom: 16,
          alignItems: 'stretch',
        }}
      >
        <SpendingChart week={weekData} month={monthData} year={yearData} />
        <CategoryBreakdown categories={categories} />
      </div>

      {/* ── Transactions + AI ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <TransactionList transactions={recentTxns} />
        <AiWidget insights={aiInsights} transactionCount={transactionCount} />
      </div>
    </div>
  )
}
