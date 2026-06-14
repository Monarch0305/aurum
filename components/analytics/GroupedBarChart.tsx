'use client'

import { useEffect, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { fmtCurrencyCompact } from '@/lib/fmt'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthBucket } from './IncomeExpensesChart'

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
        minWidth: 150,
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
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.fill,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.6)', flex: 1 }}>
            {p.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2' }}>
            ₹{(p.value as number).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      ))}
    </div>
  )
}

interface GroupedBarChartProps {
  data: MonthBucket[]
}

export default function GroupedBarChart({ data }: GroupedBarChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isEmpty = data.every((d) => d.income === 0 && d.expenses === 0)

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
          width: 250,
          height: 250,
          top: -80,
          left: -60,
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
          <BarChart2 size={13} color="#D4AF37" />
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2', margin: '0 0 3px' }}>
            Month-over-Month
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
            Income &amp; expenses by month
          </p>
        </div>
      </div>

      {!mounted ? (
        <div style={{ height: 240, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 6px 28px' }}>
          {[40, 70, 55, 85, 50, 75].map((h, i) => (
            <div key={i} className="skeleton" style={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      ) : isEmpty ? (
        <div
          style={{
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.3)', margin: 0 }}>
            No data yet
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            barCategoryGap="28%"
            barGap={3}
            margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5d6a7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#388e3c" stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="expensesBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5D576" stopOpacity={1} />
                <stop offset="100%" stopColor="#9A7B2A" stopOpacity={0.85} />
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
            <Tooltip
              content={<DualTooltip />}
              cursor={{ fill: 'rgba(212,175,55,0.05)', radius: 3 }}
            />

            <Bar
              dataKey="income"
              name="Income"
              fill="url(#incomeBar)"
              radius={[3, 3, 0, 0]}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="url(#expensesBar)"
              radius={[3, 3, 0, 0]}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 14, justifyContent: 'center' }}>
        {[
          { color: '#81c784', label: 'Income' },
          { color: '#D4AF37', label: 'Expenses' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{ width: 10, height: 10, borderRadius: 3, background: color }}
            />
            <span style={{ fontSize: 11, color: 'rgba(240,236,226,0.45)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
