'use client'

import { useEffect, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { fmtCurrencyCompact } from '@/lib/fmt'

type Period = 'week' | 'month' | 'year'

export interface ChartEntry {
  label: string
  amount: number
}

interface SpendingChartProps {
  week: ChartEntry[]
  month: ChartEntry[]
  year: ChartEntry[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(9,9,13,0.97)',
        border: '0.5px solid rgba(212,175,55,0.3)',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: 'rgba(240,236,226,0.5)',
          margin: '0 0 3px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#D4AF37',
          margin: 0,
        }}
      >
        ₹{(payload[0].value as number).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  )
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Last 7 days',
  month: 'This month',
  year: 'Last 12 months',
}

export default function SpendingChart({ week, month, year }: SpendingChartProps) {
  const [period, setPeriod] = useState<Period>('month')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const data = period === 'week' ? week : period === 'month' ? month : year
  const isEmpty = data.every((d) => d.amount === 0)
  const maxVal = Math.max(...data.map((d) => d.amount), 1)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        borderTop: '1.5px solid rgba(212,175,55,0.22)',
        borderRadius: 16,
        padding: '20px 22px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 3D icon slab */}
          <div
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
              boxShadow: '3px 3px 6px rgba(0,0,0,0.45), -1px -1px 4px rgba(60,55,45,0.1), inset 0 1px 0 rgba(212,175,55,0.15)',
              border: '0.5px solid rgba(212,175,55,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BarChart2 size={13} color="#D4AF37" />
          </div>
          <div>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#f0ece2',
                margin: '0 0 3px',
              }}
            >
              Spending Overview
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(240,236,226,0.4)',
                margin: 0,
              }}
            >
              {PERIOD_LABELS[period]}
            </p>
          </div>
        </div>

        {/* Period toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(212,175,55,0.08)',
            borderRadius: 9,
            padding: 3,
            gap: 2,
          }}
        >
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 13px',
                borderRadius: 6,
                border: 'none',
                background:
                  period === p ? 'rgba(212,175,55,0.18)' : 'transparent',
                color:
                  period === p
                    ? '#D4AF37'
                    : 'rgba(240,236,226,0.4)',
                fontSize: 12,
                fontWeight: period === p ? 500 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {!mounted ? (
        <div
          style={{
            height: 220,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
            padding: '0 4px 28px',
          }}
        >
          {data.map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                flex: 1,
                height: `${20 + ((i * 17 + 11) % 55)}%`,
                borderRadius: '3px 3px 0 0',
              }}
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div
          style={{
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: 'rgba(240,236,226,0.3)',
              margin: 0,
            }}
          >
            No spending data for this period
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(240,236,226,0.2)',
              margin: 0,
            }}
          >
            Connect a bank account to see your spending
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            barCategoryGap="32%"
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5D576" stopOpacity={1} />
                <stop offset="100%" stopColor="#9A7B2A" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="barGoldDim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#9A7B2A" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(212,175,55,0.07)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              tick={{
                fontSize: 11,
                fill: 'rgba(240,236,226,0.38)',
                fontFamily: 'var(--font-geist-sans)',
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: 'rgba(240,236,226,0.28)',
                fontFamily: 'var(--font-geist-sans)',
              }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => fmtCurrencyCompact(v as number)}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'rgba(212,175,55,0.06)', radius: 4 }}
            />
            <Bar
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.amount === maxVal
                      ? 'url(#barGold)'
                      : 'url(#barGoldDim)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
