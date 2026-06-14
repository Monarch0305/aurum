'use client'

import {
  TrendingUp,
  Target,
  Calendar,
  AlertTriangle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import type { TrendInsight } from '@/types'

export type { TrendInsight }

interface TrendStripProps {
  insights: TrendInsight[]
}

const KIND_META: Record<TrendInsight['kind'], { icon: LucideIcon; label: string }> = {
  spend:         { icon: TrendingUp,    label: 'Spending trend'   },
  savings:       { icon: Target,        label: 'Savings health'   },
  projection:    { icon: Calendar,      label: 'Projection'       },
  anomaly:       { icon: AlertTriangle, label: 'Anomaly alert'    },
  subscriptions: { icon: RefreshCw,     label: 'Subscriptions'    },
}

function InsightCard({ insight }: { insight: TrendInsight }) {
  const { icon: Icon, label } = KIND_META[insight.kind]

  // 'subscriptions' is always gold/neutral; 'projection' is gold/neutral.
  // All others follow positive → green, negative → red.
  const isGold = insight.kind === 'subscriptions' || insight.kind === 'projection'
  const tone =
    isGold              ? 'gold'
    : insight.positive  ? 'green'
    : 'red'

  const borderAccent =
    tone === 'gold'  ? 'rgba(212,175,55,0.3)'
    : tone === 'green' ? 'rgba(129,199,132,0.35)'
    : 'rgba(229,115,115,0.35)'

  const bgAccent =
    tone === 'gold'  ? 'rgba(212,175,55,0.03)'
    : tone === 'green' ? 'rgba(129,199,132,0.04)'
    : 'rgba(229,115,115,0.04)'

  const iconColor =
    tone === 'gold'  ? '#D4AF37'
    : tone === 'green' ? '#81c784'
    : '#e57373'

  const pillColor =
    tone === 'gold'
      ? { color: '#D4AF37', bg: 'rgba(212,175,55,0.1)',    border: 'rgba(212,175,55,0.25)'    }
    : tone === 'green'
      ? { color: '#81c784', bg: 'rgba(129,199,132,0.1)',   border: 'rgba(129,199,132,0.25)'   }
    : { color: '#e57373',   bg: 'rgba(229,115,115,0.1)',   border: 'rgba(229,115,115,0.25)'   }

  return (
    <div
      style={{
        background: bgAccent,
        border: `0.5px solid ${borderAccent}`,
        borderLeft: `2px solid ${borderAccent}`,
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-1px)'
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* 3D icon slab */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          flexShrink: 0,
          background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
          boxShadow:
            '3px 3px 7px rgba(0,0,0,0.5), -1px -1px 5px rgba(60,55,45,0.12), inset 0 1px 0 rgba(212,175,55,0.15)',
          border: '0.5px solid rgba(212,175,55,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={iconColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(240,236,226,0.35)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#f0ece2',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {insight.title}
        </div>
        <p
          style={{
            fontSize: 12,
            color: 'rgba(240,236,226,0.5)',
            margin: '0 0 10px',
            lineHeight: 1.5,
          }}
        >
          {insight.description}
        </p>

        {/* Value pill */}
        <span
          style={{
            display: 'inline-block',
            fontSize: 12,
            fontWeight: 500,
            color: pillColor.color,
            background: pillColor.bg,
            border: `0.5px solid ${pillColor.border}`,
            borderRadius: 20,
            padding: '3px 10px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {insight.value}
        </span>
      </div>
    </div>
  )
}

export default function TrendStrip({ insights }: TrendStripProps) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        borderLeft: '1.5px solid rgba(212,175,55,0.22)',
        borderRadius: 16,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          bottom: -100,
          right: -80,
          background: 'radial-gradient(circle, rgba(212,175,55,0.045), transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2', margin: '0 0 3px' }}>
          AI Trend Analysis
        </h3>
        <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
          Deterministic insights from your last 6 months
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  )
}
