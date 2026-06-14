'use client'

import { useEffect, useState } from 'react'
import { PieChart } from 'lucide-react'
import { CATEGORY_PALETTE, getCategoryData } from '@/lib/categoryUtils'

export interface CategoryEntry {
  category: string
  amount: number
  percentage: number
}

interface CategoryBreakdownProps {
  categories: CategoryEntry[]
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setAnimated(true), 120)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(212,175,55,0.1)',
        borderLeft: '1.5px solid rgba(212,175,55,0.22)',
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow: '3px 3px 6px rgba(0,0,0,0.45), -1px -1px 4px rgba(60,55,45,0.1), inset 0 1px 0 rgba(212,175,55,0.15)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <PieChart size={13} color="#D4AF37" />
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
            Categories
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
            This month&apos;s breakdown
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 0',
            gap: 6,
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.3)', margin: 0 }}>
            No data yet
          </p>
          <p style={{ fontSize: 11, color: 'rgba(240,236,226,0.2)', margin: 0 }}>
            Sync transactions to see categories
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {categories.map((cat, i) => {
            const { icon: Icon } = getCategoryData(cat.category)
            const color = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]

            return (
              <div key={cat.category}>
                {/* Label row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    marginBottom: 7,
                  }}
                >
                  {/* Mini 3D icon slab */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      flexShrink: 0,
                      background:
                        'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))',
                      boxShadow:
                        '2px 2px 4px rgba(0,0,0,0.4), -1px -1px 3px rgba(40,35,25,0.08), inset 0 1px 0 rgba(212,175,55,0.1)',
                      border: '0.5px solid rgba(212,175,55,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={11} color={color} />
                  </div>

                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'rgba(240,236,226,0.65)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.category}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#f0ece2',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ₹{cat.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: color,
                        background: `${color}18`,
                        border: `0.5px solid ${color}40`,
                        borderRadius: 10,
                        padding: '1px 5px',
                        fontWeight: 500,
                      }}
                    >
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 3,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      background: `linear-gradient(90deg, ${color}, ${color}66)`,
                      width: animated ? `${cat.percentage}%` : '0%',
                      transition: `width 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 90}ms`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
