'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCategoryData } from '@/lib/categoryUtils'
import type { Transaction } from '@/types'

// ─── constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ─── types ────────────────────────────────────────────────────────────────────

interface Filters {
  search: string
  dateFrom: string
  dateTo: string
  category: string
}

interface TransactionTableProps {
  /** Distinct categories already known from the DB */
  categories: string[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateShort(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Smart page number sequence with at most 7 items */
function pageSequence(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const s: (number | '…')[] = [0]
  if (current > 2) s.push('…')
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) s.push(i)
  if (current < total - 3) s.push('…')
  s.push(total - 1)
  return s
}

// ─── sub-components ───────────────────────────────────────────────────────────

const COL = '48px 1fr 164px 94px 110px'

function TableHeader() {
  const th: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(240,236,226,0.38)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COL,
        gap: '0 12px',
        padding: '0 20px 12px',
        borderBottom: '0.5px solid rgba(212,175,55,0.07)',
        alignItems: 'center',
      }}
    >
      <div />
      <span style={th}>Merchant</span>
      <span style={th}>Category</span>
      <span style={th}>Date</span>
      <span style={{ ...th, textAlign: 'right' }}>Amount</span>
    </div>
  )
}

function SkeletonRow({ i }: { i: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: COL,
        gap: '0 12px',
        padding: '12px 20px',
        alignItems: 'center',
        borderBottom: '0.5px solid rgba(212,175,55,0.05)',
        opacity: 1 - i * 0.04,
      }}
    >
      {/* icon */}
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
      {/* merchant */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div className="skeleton" style={{ height: 12, width: `${55 + ((i * 17) % 35)}%` }} />
        <div className="skeleton" style={{ height: 9, width: '35%' }} />
      </div>
      {/* category */}
      <div className="skeleton" style={{ height: 20, width: 90, borderRadius: 20 }} />
      {/* date */}
      <div className="skeleton" style={{ height: 12, width: 64 }} />
      {/* amount */}
      <div className="skeleton" style={{ height: 12, width: 70, marginLeft: 'auto' }} />
    </div>
  )
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div
      style={{
        padding: '64px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))',
          boxShadow:
            '3px 3px 7px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,175,55,0.1)',
          border: '0.5px solid rgba(212,175,55,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <ArrowUpDown size={20} color="rgba(212,175,55,0.4)" />
      </div>
      <p style={{ fontSize: 14, color: 'rgba(240,236,226,0.55)', margin: 0, fontWeight: 500 }}>
        {hasFilters ? 'No transactions found' : 'No transactions yet'}
      </p>
      <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.28)', margin: 0, textAlign: 'center' }}>
        {hasFilters
          ? 'Try adjusting your search or filters'
          : 'Connect a bank account and sync transactions to see your activity here'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          style={{
            marginTop: 8,
            padding: '7px 16px',
            borderRadius: 8,
            background: 'rgba(212,175,55,0.1)',
            border: '0.5px solid rgba(212,175,55,0.2)',
            color: '#D4AF37',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function TransactionTable({ categories }: TransactionTableProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    category: 'all',
  })
  const [searchInput, setSearchInput] = useState('')   // raw (undelayed) input
  const [page, setPage] = useState(0)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ spent: 0, received: 0 })
  const [loading, setLoading] = useState(true)
  const [firstLoad, setFirstLoad] = useState(true)

  // Debounce search → commit to filters
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: val }))
      setPage(0)
    }, 350)
  }

  const hasFilters =
    !!filters.search || !!filters.dateFrom || !!filters.dateTo || filters.category !== 'all'

  const clearFilters = () => {
    setSearchInput('')
    setFilters({ search: '', dateFrom: '', dateTo: '', category: 'all' })
    setPage(0)
  }

  // Fetch
  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // ── paginated rows ──
    let q = supabase.from('transactions').select('*', { count: 'exact' })
    if (filters.search.trim()) q = q.ilike('merchant', `%${filters.search.trim()}%`)
    if (filters.dateFrom) q = q.gte('date', filters.dateFrom)
    if (filters.dateTo) q = q.lte('date', filters.dateTo)
    if (filters.category !== 'all') q = q.eq('category', filters.category)

    const { data, count } = await q
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // ── aggregate stats across all matching rows ──
    let sq = supabase.from('transactions').select('amount').eq('pending', false)
    if (filters.search.trim()) sq = sq.ilike('merchant', `%${filters.search.trim()}%`)
    if (filters.dateFrom) sq = sq.gte('date', filters.dateFrom)
    if (filters.dateTo) sq = sq.lte('date', filters.dateTo)
    if (filters.category !== 'all') sq = sq.eq('category', filters.category)

    const { data: amts } = await sq

    const spent = (amts ?? []).filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0)
    const received = (amts ?? []).filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)

    setTransactions((data ?? []) as Transaction[])
    setTotal(count ?? 0)
    setStats({ spent, received })
    setLoading(false)
    setFirstLoad(false)
  }, [filters, page])

  useEffect(() => { fetch() }, [fetch])

  // Reset page when non-page filters change
  const prevFilters = useRef(filters)
  useEffect(() => {
    if (prevFilters.current !== filters) {
      setPage(0)
      prevFilters.current = filters
    }
  }, [filters])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, total)

  // ─── shared input style ───
  const inputBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(212,175,55,0.13)',
    borderRadius: 9,
    padding: '9px 12px',
    color: '#f0ece2',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'var(--font-geist-sans)',
  }

  function focusGold(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'
  }
  function blurGold(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.13)'
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(212,175,55,0.1)',
          borderTop: '1.5px solid rgba(212,175,55,0.22)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search
            size={13}
            color="rgba(212,175,55,0.5)"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search merchants…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={focusGold}
            onBlur={blurGold}
            style={{ ...inputBase, paddingLeft: 32, width: '100%' }}
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              style={{
                position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'rgba(240,236,226,0.35)', display: 'flex',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Date From */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(0) }}
            onFocus={focusGold}
            onBlur={blurGold}
            style={{ ...inputBase, width: 148, colorScheme: 'dark' }}
            title="From date"
          />
          {!filters.dateFrom && (
            <span
              style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'rgba(240,236,226,0.3)', pointerEvents: 'none',
              }}
            >
              From
            </span>
          )}
        </div>

        {/* Date To */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(0) }}
            onFocus={focusGold}
            onBlur={blurGold}
            style={{ ...inputBase, width: 148, colorScheme: 'dark' }}
            title="To date"
          />
          {!filters.dateTo && (
            <span
              style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'rgba(240,236,226,0.3)', pointerEvents: 'none',
              }}
            >
              To
            </span>
          )}
        </div>

        {/* Category select */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={filters.category}
            onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(0) }}
            onFocus={focusGold}
            onBlur={blurGold}
            style={{
              ...inputBase,
              width: 168,
              paddingRight: 28,
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: '#09090d' }}>
                {c}
              </option>
            ))}
          </select>
          <SlidersHorizontal
            size={12}
            color="rgba(212,175,55,0.5)"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', borderRadius: 8,
              background: 'transparent',
              border: '0.5px solid rgba(229,115,115,0.2)',
              color: 'rgba(229,115,115,0.7)',
              fontSize: 12, cursor: 'pointer',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = 'rgba(229,115,115,0.07)'; el.style.color = '#e57373' }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = 'rgba(229,115,115,0.7)' }}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Stats strip ── */}
      {!firstLoad && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 14,
            padding: '0 2px',
          }}
        >
          <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.45)' }}>
            <span style={{ color: '#f0ece2', fontWeight: 500 }}>
              {total.toLocaleString()}
            </span>{' '}
            transaction{total !== 1 ? 's' : ''}
          </span>
          <span style={{ width: '0.5px', height: 12, background: 'rgba(212,175,55,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.45)' }}>
            <span style={{ color: '#e57373', fontWeight: 500 }}>
              ₹{fmtMoney(stats.spent)}
            </span>{' '}
            spent
          </span>
          <span style={{ width: '0.5px', height: 12, background: 'rgba(212,175,55,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.45)' }}>
            <span style={{ color: '#81c784', fontWeight: 500 }}>
              ₹{fmtMoney(stats.received)}
            </span>{' '}
            received
          </span>
        </div>
      )}

      {/* ── Table card ── */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(212,175,55,0.1)',
          borderTop: '1.5px solid rgba(212,175,55,0.22)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <TableHeader />

        {/* Body */}
        {loading ? (
          <div>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonRow key={i} i={i} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <div>
            {transactions.map((txn, i) => {
              const { icon: Icon, color, bg } = getCategoryData(txn.category)
              const isExpense = txn.amount > 0
              const abs = Math.abs(txn.amount)
              const amountStr = `${isExpense ? '−' : '+'}₹${fmtMoney(abs)}`
              const isLast = i === transactions.length - 1

              return (
                <div
                  key={txn.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: COL,
                    gap: '0 12px',
                    padding: '11px 20px',
                    alignItems: 'center',
                    borderBottom: isLast ? 'none' : '0.5px solid rgba(212,175,55,0.05)',
                    transition: 'background 0.12s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(212,175,55,0.028)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = 'transparent')
                  }
                >
                  {/* 3D icon slab */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: bg,
                      boxShadow:
                        '3px 3px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(40,35,25,0.1), inset 0 1px 0 rgba(212,175,55,0.12)',
                      border: '0.5px solid rgba(212,175,55,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={color} />
                  </div>

                  {/* Merchant */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#f0ece2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={txn.merchant || undefined}
                    >
                      {txn.merchant || 'Unknown'}
                    </div>
                    {txn.subcategory && txn.subcategory !== txn.category && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(240,236,226,0.33)',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {txn.subcategory}
                      </div>
                    )}
                  </div>

                  {/* Category badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 400,
                        color: color,
                        background: `${color}18`,
                        border: `0.5px solid ${color}38`,
                        borderRadius: 20,
                        padding: '3px 9px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 140,
                      }}
                    >
                      {txn.category || 'Other'}
                    </span>
                    {txn.pending && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          color: 'rgba(212,175,55,0.7)',
                          background: 'rgba(212,175,55,0.08)',
                          border: '0.5px solid rgba(212,175,55,0.22)',
                          borderRadius: 4,
                          padding: '2px 5px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          flexShrink: 0,
                        }}
                      >
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(240,236,226,0.45)',
                      whiteSpace: 'nowrap',
                    }}
                    title={formatDate(txn.date)}
                  >
                    {formatDateShort(txn.date)}
                  </span>

                  {/* Amount */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isExpense ? '#e57373' : '#81c784',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {amountStr}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: '0.5px solid rgba(212,175,55,0.07)',
            }}
          >
            {/* Range label */}
            <span style={{ fontSize: 12, color: 'rgba(240,236,226,0.38)' }}>
              {rangeStart}–{rangeEnd} of {total.toLocaleString()}
            </span>

            {/* Page controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Prev */}
              <PageBtn
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                label={<ChevronLeft size={14} />}
              />

              {pageSequence(page, totalPages).map((p, idx) =>
                p === '…' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      color: 'rgba(240,236,226,0.3)',
                    }}
                  >
                    …
                  </span>
                ) : (
                  <PageBtn
                    key={p}
                    onClick={() => setPage(p as number)}
                    active={p === page}
                    label={String((p as number) + 1)}
                  />
                )
              )}

              {/* Next */}
              <PageBtn
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                label={<ChevronRight size={14} />}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PageBtn ──────────────────────────────────────────────────────────────────

function PageBtn({
  onClick,
  label,
  active = false,
  disabled = false,
}: {
  onClick: () => void
  label: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 7,
        border: active ? '0.5px solid rgba(212,175,55,0.35)' : '0.5px solid transparent',
        background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
        color: active
          ? '#D4AF37'
          : disabled
          ? 'rgba(240,236,226,0.2)'
          : 'rgba(240,236,226,0.5)',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled)
          (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.07)'
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {label}
    </button>
  )
}
