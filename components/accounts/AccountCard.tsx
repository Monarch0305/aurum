'use client'

import { useEffect, useRef, useState } from 'react'
import { PiggyBank, CreditCard, TrendingUp } from 'lucide-react'

// ─── shared types ─────────────────────────────────────────────────────────────

export interface EnrichedAccount {
  id: string
  name: string
  type: 'savings' | 'credit' | 'investment'
  balance: number
  currency: string
  lastSynced: string | null
  last4: string
  institutionName: string
  // credit only
  creditLimit?: number
  // investment only
  apy?: number
  maturityDate?: string
  interestEarned?: number
}

export interface AccountCardProps extends EnrichedAccount {
  accentSide: 'top' | 'left' | 'right'
  animDelay?: number
}

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_META = {
  savings: {
    label: 'Savings',
    Icon: PiggyBank,
    badgeColor: '#81c784',
    badgeBg: 'rgba(129,199,132,0.1)',
    badgeBorder: 'rgba(129,199,132,0.25)',
    iconGradient: 'linear-gradient(145deg, rgba(20,40,20,1), rgba(10,22,10,1))',
    iconGlow: 'inset 0 1px 0 rgba(129,199,132,0.18)',
  },
  credit: {
    label: 'Credit',
    Icon: CreditCard,
    badgeColor: '#64b5f6',
    badgeBg: 'rgba(100,181,246,0.1)',
    badgeBorder: 'rgba(100,181,246,0.25)',
    iconGradient: 'linear-gradient(145deg, rgba(14,28,50,1), rgba(8,16,30,1))',
    iconGlow: 'inset 0 1px 0 rgba(100,181,246,0.18)',
  },
  investment: {
    label: 'Investment',
    Icon: TrendingUp,
    badgeColor: '#D4AF37',
    badgeBg: 'rgba(212,175,55,0.12)',
    badgeBorder: 'rgba(212,175,55,0.3)',
    iconGradient: 'linear-gradient(145deg, rgba(40,32,10,1), rgba(22,17,4,1))',
    iconGlow: 'inset 0 1px 0 rgba(212,175,55,0.2)',
  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function useCubicCounter(target: number, delay = 0) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const tid = setTimeout(() => {
      if (target === 0) { setVal(0); return }
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min((now - start) / 900, 1)
        setVal(Math.abs(target) * (1 - Math.pow(1 - t, 3)))
        if (t < 1) raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(tid); cancelAnimationFrame(raf.current) }
  }, [target, delay])
  return val
}

function syncStatus(lastSynced: string | null) {
  if (!lastSynced) return { label: 'Never synced', color: 'rgba(240,236,226,0.28)', live: false }
  const ms = Date.now() - new Date(lastSynced).getTime()
  const h = ms / 3_600_000
  const d = ms / 86_400_000
  if (h < 1)  return { label: 'Just now',           color: '#81c784',              live: true  }
  if (h < 24) return { label: `${Math.floor(h)}h ago`, color: '#81c784',            live: true  }
  if (d < 7)  return { label: `${Math.floor(d)}d ago`, color: '#ffb74d',            live: false }
  return       { label: `${Math.floor(d)}d ago`,    color: 'rgba(240,236,226,0.3)', live: false }
}

function fmtMoney(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AccountCard({
  name,
  type,
  balance,
  currency,
  lastSynced,
  last4,
  creditLimit,
  apy,
  maturityDate,
  interestEarned,
  accentSide,
  animDelay = 0,
}: AccountCardProps) {
  const [visible, setVisible] = useState(false)
  const [barAnimated, setBarAnimated] = useState(false)
  const displayBalance = useCubicCounter(Math.abs(balance), animDelay + 60)
  const sync = syncStatus(lastSynced)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), animDelay)
    const t2 = setTimeout(() => setBarAnimated(true), animDelay + 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [animDelay])

  const meta = TYPE_META[type]
  const { Icon } = meta

  // Credit-specific
  const utilPct =
    type === 'credit' && creditLimit && creditLimit > 0 && balance > 0
      ? Math.min((balance / creditLimit) * 100, 100)
      : 0
  const utilColor =
    utilPct < 30 ? '#81c784' : utilPct < 70 ? '#ffb74d' : '#e57373'
  const availableCredit = creditLimit ? Math.max(0, creditLimit - balance) : 0

  // Balance display
  const isDebt = type === 'credit' && balance > 0
  const balanceColor = isDebt ? '#e57373' : '#f0ece2'
  const balancePrefix = isDebt ? '−₹' : '₹'

  // Accent border
  const accentBorderStyle =
    accentSide === 'top'
      ? { borderTop: '1.5px solid rgba(212,175,55,0.28)' }
      : accentSide === 'left'
      ? { borderLeft: '1.5px solid rgba(212,175,55,0.28)' }
      : { borderRight: '1.5px solid rgba(212,175,55,0.28)' }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        ...accentBorderStyle,
        borderRadius: 16,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.45s ease ${animDelay}ms, transform 0.45s ease ${animDelay}ms, box-shadow 0.2s ease`,
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 10px 36px rgba(0,0,0,0.38), 0 0 0 0.5px rgba(212,175,55,0.2)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = visible ? 'translateY(0)' : 'translateY(10px)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Ambient glow — accent-color tinted */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          top: -60,
          right: -50,
          background:
            type === 'savings'
              ? 'radial-gradient(circle, rgba(129,199,132,0.06), transparent 70%)'
              : type === 'credit'
              ? 'radial-gradient(circle, rgba(100,181,246,0.06), transparent 70%)'
              : 'radial-gradient(circle, rgba(212,175,55,0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Top row: icon + name/meta ── */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
        {/* icon3d-lg — 44px */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: meta.iconGradient,
            boxShadow: `4px 4px 9px rgba(0,0,0,0.55), -2px -2px 6px rgba(60,55,45,0.12), ${meta.iconGlow}`,
            border: '0.5px solid rgba(212,175,55,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color="#D4AF37" />
        </div>

        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#f0ece2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 5,
            }}
          >
            {name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {/* Type badge */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: meta.badgeColor,
                background: meta.badgeBg,
                border: `0.5px solid ${meta.badgeBorder}`,
                borderRadius: 20,
                padding: '2px 7px',
                letterSpacing: '0.03em',
              }}
            >
              {meta.label}
            </span>

            {/* Currency */}
            <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.3)' }}>{currency}</span>

            {/* Separator */}
            <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.18)' }}>·</span>

            {/* Last 4 */}
            <span style={{ fontSize: 11, color: 'rgba(240,236,226,0.45)', letterSpacing: '0.06em' }}>
              ···· {last4}
            </span>
          </div>

          {/* Sync status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              className={sync.live ? 'pulse-dot' : undefined}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: sync.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: 'rgba(240,236,226,0.38)' }}>
              {sync.live ? 'Live · ' : ''}{sync.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Balance ── */}
      <div style={{ marginBottom: type !== 'savings' ? 18 : 0 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: balanceColor,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 4,
          }}
        >
          {balancePrefix}{fmtMoney(displayBalance)}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(240,236,226,0.35)' }}>
          {type === 'credit'
            ? isDebt
              ? `₹${fmtMoney(availableCredit)} available`
              : 'No balance'
            : type === 'investment'
            ? 'Current value'
            : 'Available balance'}
        </div>
      </div>

      {/* ── Credit: utilization bar ── */}
      {type === 'credit' && (
        <div>
          <div
            style={{
              height: '0.5px',
              background: 'rgba(212,175,55,0.07)',
              margin: '0 0 14px',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 7,
            }}
          >
            <span style={{ fontSize: 11, color: 'rgba(240,236,226,0.45)' }}>
              Credit utilization
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: utilColor }}>
              {utilPct.toFixed(0)}%{' '}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 400,
                  color: 'rgba(240,236,226,0.35)',
                }}
              >
                {utilPct < 30 ? '· Good' : utilPct < 70 ? '· Fair' : '· High'}
              </span>
            </span>
          </div>
          {/* Track */}
          <div
            style={{
              height: 5,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(90deg, ${utilColor}cc, ${utilColor})`,
                width: barAnimated ? `${utilPct}%` : '0%',
                transition: 'width 0.85s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </div>
          {creditLimit && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 5,
              }}
            >
              <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.28)' }}>
                ₹0
              </span>
              <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.28)' }}>
                Limit ₹{fmtMoney(creditLimit, 0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Investment: 3-column detail strip ── */}
      {type === 'investment' && (
        <div>
          <div
            style={{
              height: '0.5px',
              background: 'rgba(212,175,55,0.07)',
              margin: '0 0 14px',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
            }}
          >
            {[
              {
                label: 'Maturity',
                value: maturityDate ?? '—',
                color: '#f0ece2',
              },
              {
                label: 'APY',
                value: apy ? `${apy.toFixed(2)}%` : '—',
                color: '#81c784',
              },
              {
                label: 'Interest earned',
                value: interestEarned ? `₹${fmtMoney(interestEarned, 0)}` : '—',
                color: '#81c784',
              },
            ].map(({ label, value, color }, i) => (
              <div
                key={label}
                style={{
                  paddingRight: i < 2 ? 12 : 0,
                  borderRight: i < 2 ? '0.5px solid rgba(212,175,55,0.08)' : 'none',
                  paddingLeft: i > 0 ? 12 : 0,
                }}
              >
                <div style={{ fontSize: 10, color: 'rgba(240,236,226,0.38)', marginBottom: 3 }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
