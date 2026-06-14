import { ArrowLeftRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import TransactionTable from '@/components/transactions/TransactionTable'

export const metadata = { title: 'Transactions — Aurum' }

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch distinct categories for the filter dropdown and a rough total count
  const [catRes, countRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('category')
      .eq('user_id', user!.id)
      .not('category', 'is', null)
      .order('category'),

    supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  const categories: string[] = [
    ...new Set(
      (catRes.data ?? []).map((r) => r.category as string).filter(Boolean)
    ),
  ].sort()

  const total = countRes.count ?? 0

  return (
    <div style={{ maxWidth: 1100, position: 'relative' }}>
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          width: 500,
          height: 500,
          top: '15%',
          left: '40%',
          background:
            'radial-gradient(circle, rgba(212,175,55,0.025), transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 3D icon slab */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background:
                'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
              boxShadow:
                '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)',
              border: '0.5px solid rgba(212,175,55,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ArrowLeftRight size={17} color="#D4AF37" />
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
              Transactions
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(240,236,226,0.38)',
                margin: 0,
              }}
            >
              Your complete transaction history
            </p>
          </div>
        </div>

        {/* Total badge */}
        {total > 0 && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(212,175,55,0.75)',
              background: 'rgba(212,175,55,0.07)',
              border: '0.5px solid rgba(212,175,55,0.15)',
              borderRadius: 20,
              padding: '5px 14px',
              letterSpacing: '0.02em',
            }}
          >
            {total.toLocaleString()} total
          </div>
        )}
      </div>

      {/* ── Table (client) ── */}
      <TransactionTable categories={categories} />
    </div>
  )
}
