'use client'

import { useEffect, useRef, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Minus, PiggyBank, CreditCard, Zap, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  zap: Zap,
}

interface KpiCardProps {
  title: string
  value: number
  prefix?: string
  decimals?: number
  icon: string
  /** Percentage change vs comparison period */
  trend?: number
  trendLabel?: string
  /** When false, a positive trend is coloured red (spending card) */
  trendPositiveIsGood?: boolean
  accentSide?: 'top' | 'left' | 'right'
}

function useCubicCounter(target: number, duration = 900) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setDisplay(0)
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(target * eased)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return display
}

export default function KpiCard({
  title,
  value,
  prefix = '₹',
  decimals = 2,
  icon: iconName,
  trend,
  trendLabel = 'vs last month',
  trendPositiveIsGood = true,
  accentSide = 'top',
}: KpiCardProps) {
  const Icon = ICONS[iconName] ?? Wallet
  const display = useCubicCounter(value)

  const formatted =
    prefix +
    display.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })

  const hasTrend = trend !== undefined && trend !== 0
  const isGood = hasTrend
    ? trendPositiveIsGood
      ? trend! > 0
      : trend! < 0
    : null
  const trendColor =
    isGood === null
      ? 'rgba(240,236,226,0.35)'
      : isGood
      ? '#81c784'
      : '#e57373'

  const TrendIcon =
    !hasTrend ? Minus : trend! > 0 ? TrendingUp : TrendingDown

  const accentBorder =
    accentSide === 'top'
      ? { borderTop: '1.5px solid rgba(212,175,55,0.25)' }
      : accentSide === 'left'
      ? { borderLeft: '1.5px solid rgba(212,175,55,0.25)' }
      : { borderRight: '1.5px solid rgba(212,175,55,0.25)' }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        ...accentBorder,
        borderRadius: 16,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow =
          '0 8px 32px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(212,175,55,0.22)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          top: -50,
          right: -40,
          background:
            'radial-gradient(circle, rgba(212,175,55,0.055), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Label + icon row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(240,236,226,0.45)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>

        {/* 3D icon slab */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            flexShrink: 0,
            background:
              'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow:
              '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={17} color="#D4AF37" />
        </div>
      </div>

      {/* Animated value */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: '#f0ece2',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 12,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatted}
      </div>

      {/* Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <TrendIcon size={12} color={trendColor} />
        <span style={{ fontSize: 12, color: trendColor }}>
          {!hasTrend
            ? 'No change'
            : `${trend! > 0 ? '+' : ''}${Math.abs(trend!).toFixed(1)}%`}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.28)' }}>
          {trendLabel}
        </span>
      </div>
    </div>
  )
}
