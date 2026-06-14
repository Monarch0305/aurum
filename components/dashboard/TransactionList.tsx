'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Transaction } from '@/types'
import { getCategoryData } from '@/lib/categoryUtils'

interface TransactionListProps {
  transactions: Transaction[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(id)
  }, [])

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
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#f0ece2',
              margin: '0 0 3px',
            }}
          >
            Recent Transactions
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
            Latest account activity
          </p>
        </div>
        <Link
          href="/transactions"
          style={{
            fontSize: 12,
            color: 'rgba(212,175,55,0.7)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = '#D4AF37')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color =
              'rgba(212,175,55,0.7)')
          }
        >
          View all →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div
          style={{
            padding: '36px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.3)', margin: 0 }}>
            No transactions yet
          </p>
          <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.2)', margin: 0 }}>
            Connect a bank account to see your activity
          </p>
        </div>
      ) : (
        <div>
          {transactions.map((txn, i) => {
            const { icon: Icon, color, bg } = getCategoryData(txn.category)
            const isExpense = txn.amount > 0
            const abs = Math.abs(txn.amount)
            const amountStr = `${isExpense ? '−' : '+'}₹${abs.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
            const isLast = i === transactions.length - 1

            return (
              <div
                key={txn.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: isLast
                    ? 'none'
                    : '0.5px solid rgba(212,175,55,0.05)',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(6px)',
                  transition: `opacity 0.35s ease ${i * 45}ms, transform 0.35s ease ${i * 45}ms`,
                }}
              >
                {/* 3D icon slab */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: bg,
                    boxShadow:
                      '3px 3px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(40,35,25,0.1), inset 0 1px 0 rgba(212,175,55,0.12)',
                    border: '0.5px solid rgba(212,175,55,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={15} color={color} />
                </div>

                {/* Merchant + category */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#f0ece2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {txn.merchant || 'Unknown'}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(240,236,226,0.38)',
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{txn.category || 'Other'}</span>
                    {txn.pending && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          color: 'rgba(212,175,55,0.65)',
                          background: 'rgba(212,175,55,0.08)',
                          border: '0.5px solid rgba(212,175,55,0.2)',
                          borderRadius: 4,
                          padding: '1px 4px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount + date */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isExpense ? '#e57373' : '#81c784',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {amountStr}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(240,236,226,0.33)',
                      marginTop: 2,
                    }}
                  >
                    {formatDate(txn.date)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
