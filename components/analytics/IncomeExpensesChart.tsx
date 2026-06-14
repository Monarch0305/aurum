'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { fmtCurrencyCompact } from '@/lib/fmt'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface MonthBucket {
  label: string
  income: number
  expenses: number
  net: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DualTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(9,9,13,0.97)',
        border: '0.5px solid rgba(212,175,55,0.28)',
        borderRadius: 9,
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
        minWidth: 160,
      }}
    >
      <p style={{ fontSize: 11, color: 'rgba(240,236,226,0.45)', margin: '0 0 8px' }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div
          key={p.dataKey}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.stroke, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.6)', flex: 1 }}>
            {p.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: p.stroke }}>
            ₹{(p.value as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart() {
  return (
    <div
      style={{
        height: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.3)', margin: 0 }}>
        No data for this period
      </p>
      <p style={{ fontSize: 11, color: 'rgba(240,236,226,0.2)', margin: 0 }}>
        Connect a bank and sync transactions
      </p>
    </div>
  )
}

interface IncomeExpensesChartProps {
  data: MonthBucket[]
}

export default function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isEmpty = data.every((d) => d.income === 0 && d.expenses === 0)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        borderTop: '1.5px solid rgba(212,175,55,0.22)',
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
          background: 'radial-gradient(circle, rgba(212,175,55,0.04), transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow: '3px 3px 6px rgba(0,0,0,0.45), -1px -1px 4px rgba(60,55,45,0.1), inset 0 1px 0 rgba(212,175,55,0.15)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <TrendingUp size={13} color="#D4AF37" />
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2', margin: '0 0 3px' }}>
            Income vs Expenses
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
            Last 6 months
          </p>
        </div>
      </div>

      {!mounted ? (
        <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 8px 28px' }}>
          {[60, 80, 45, 90, 70, 55].map((h, i) => (
            <div key={i} className="skeleton" style={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 6, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#81c784" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#81c784" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="rgba(212,175,55,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'rgba(240,236,226,0.38)', fontFamily: 'var(--font-geist-sans)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'rgba(240,236,226,0.28)', fontFamily: 'var(--font-geist-sans)' }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => fmtCurrencyCompact(v as number)}
            />
            <Tooltip content={<DualTooltip />} cursor={{ stroke: 'rgba(212,175,55,0.15)', strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#81c784"
              strokeWidth={2}
              fill="url(#incomeGrad)"
              dot={{ r: 3, fill: '#81c784', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#81c784', stroke: 'rgba(9,9,13,0.8)', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#expensesGrad)"
              dot={{ r: 3, fill: '#D4AF37', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#D4AF37', stroke: 'rgba(9,9,13,0.8)', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Custom legend */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginTop: 14,
          justifyContent: 'center',
        }}
      >
        {[
          { color: '#81c784', label: 'Income' },
          { color: '#D4AF37', label: 'Expenses' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 22,
                height: 2,
                background: color,
                borderRadius: 1,
              }}
            />
            <span style={{ fontSize: 11, color: 'rgba(240,236,226,0.45)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
