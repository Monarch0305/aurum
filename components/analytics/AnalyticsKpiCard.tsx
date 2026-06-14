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

interface AnalyticsKpiCardProps {
  title: string
  value: number
  /** Dollar prefix; set to '' for percentages */
  prefix?: string
  /** Appended after the number, e.g. '%' */
  suffix?: string
  decimals?: number
  icon: string
  /** CSS color string for the top-border accent, e.g. '#81c784' */
  accentColor: string
  /** Percentage change vs comparison period (positive = up, negative = down) */
  trend?: number
  trendLabel?: string
  /** false = positive trend is bad (spending card) */
  trendPositiveIsGood?: boolean
  subLabel?: string
}

function useCubicCounter(target: number, duration = 900) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (target === 0) { setDisplay(0); return }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setDisplay(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return display
}

export default function AnalyticsKpiCard({
  title,
  value,
  prefix = '₹',
  suffix = '',
  decimals = 2,
  icon: iconName,
  accentColor,
  trend,
  trendLabel = 'vs prior 3 months',
  trendPositiveIsGood = true,
  subLabel,
}: AnalyticsKpiCardProps) {
  const Icon = ICONS[iconName] ?? Wallet
  const display = useCubicCounter(Math.abs(value))
  const isNegative = value < 0

  const formatted =
    (isNegative ? '−' : '') +
    prefix +
    display.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix

  const hasTrend = trend !== undefined && trend !== 0
  const isGood = hasTrend
    ? trendPositiveIsGood ? trend! > 0 : trend! < 0
    : null
  const trendColor =
    isGood === null ? 'rgba(240,236,226,0.35)' : isGood ? '#81c784' : '#e57373'

  const TrendIcon = !hasTrend ? Minus : trend! > 0 ? TrendingUp : TrendingDown

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        borderTop: `1.5px solid ${accentColor}`,
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
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(212,175,55,0.18)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Accent glow — matches border color */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          top: -70,
          right: -50,
          background: `radial-gradient(circle, ${accentColor}18, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Label + icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(240,236,226,0.45)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            {title}
          </span>
          {subLabel && (
            <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.28)', marginTop: 1, display: 'block' }}>
              {subLabel}
            </span>
          )}
        </div>

        {/* 3D icon slab */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            flexShrink: 0,
            background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={17} color={accentColor} />
        </div>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: isNegative ? '#e57373' : '#f0ece2',
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
          {!hasTrend ? 'No change' : `${trend! > 0 ? '+' : ''}${Math.abs(trend!).toFixed(1)}%`}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.28)' }}>{trendLabel}</span>
      </div>
    </div>
  )
}
