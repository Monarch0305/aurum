'use client'

import { useEffect, useState } from 'react'
import { PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { CATEGORY_PALETTE, getCategoryData } from '@/lib/categoryUtils'

export interface CategorySlice {
  category: string
  amount: number
  percentage: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SliceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as CategorySlice
  return (
    <div
      style={{
        background: 'rgba(9,9,13,0.97)',
        border: '0.5px solid rgba(212,175,55,0.28)',
        borderRadius: 8,
        padding: '9px 13px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 500, color: '#f0ece2', margin: '0 0 3px' }}>
        {d.category}
      </p>
      <p style={{ fontSize: 13, color: '#D4AF37', margin: 0, fontWeight: 500 }}>
        ₹{d.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(240,236,226,0.4)', marginLeft: 6 }}>
          {d.percentage}%
        </span>
      </p>
    </div>
  )
}

interface DonutChartProps {
  data: CategorySlice[]
  totalSpending: number
}

const CHART_SIZE = 200
const CENTER = CHART_SIZE / 2

export default function DonutChart({ data, totalSpending }: DonutChartProps) {
  const [mounted, setMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => setMounted(true), [])

  const isEmpty = data.length === 0 || totalSpending === 0

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
          width: 280,
          height: 280,
          top: -80,
          left: -60,
          background: 'radial-gradient(circle, rgba(212,175,55,0.05), transparent 65%)',
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
          <PieChartIcon size={13} color="#D4AF37" />
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2', margin: '0 0 3px' }}>
            Spending by Category
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
            Last 3 months
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div
          style={{
            height: CHART_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.3)', margin: 0 }}>
            No spending data
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Donut */}
          <div style={{ position: 'relative', width: CHART_SIZE, height: CHART_SIZE, flexShrink: 0 }}>
            {mounted && (
              <PieChart width={CHART_SIZE} height={CHART_SIZE}>
                <Pie
                  data={data}
                  cx={CENTER}
                  cy={CENTER}
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={700}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.45}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<SliceTooltip />} />
              </PieChart>
            )}

            {/* Center text overlay */}
            <div
              style={{
                position: 'absolute',
                top: CENTER,
                left: CENTER,
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontSize: activeIndex !== null ? 14 : 18,
                  fontWeight: 500,
                  color: '#f0ece2',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'font-size 0.15s',
                  lineHeight: 1.2,
                }}
              >
                {activeIndex !== null
                  ? `${data[activeIndex]?.percentage ?? 0}%`
                  : `₹${totalSpending.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(240,236,226,0.4)', marginTop: 2 }}>
                {activeIndex !== null ? data[activeIndex]?.category ?? '' : 'total'}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 4 }}>
            {data.map((slice, i) => {
              const { icon: Icon } = getCategoryData(slice.category)
              const color = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]
              const isActive = activeIndex === i

              return (
                <div
                  key={slice.category}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: activeIndex === null || isActive ? 1 : 0.45,
                    transition: 'opacity 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {/* Mini icon */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      flexShrink: 0,
                      background: 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))',
                      border: '0.5px solid rgba(212,175,55,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={10} color={color} />
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      color: 'rgba(240,236,226,0.65)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {slice.category}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color,
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {slice.percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
