'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Send,
  Plus,
  Utensils,
  PieChart,
  RefreshCw,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

// ─── types ────────────────────────────────────────────────────────────────────

interface BarEntry  { label: string; amount: number }
interface LegendRow { name: string; amount: number; color: string }

interface DataCard {
  title: string
  total: number
  period: string
  changePercent?: number
  chartData: BarEntry[]
  breakdown: LegendRow[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  card?: DataCard
  followUps?: string[]
}

interface CopilotPageProps {
  transactionCount: number
}

// ─── prompt starters ──────────────────────────────────────────────────────────

interface Starter { icon: LucideIcon; title: string; subtitle: string; iconBg: string }

const STARTERS: Starter[] = [
  { icon: Utensils,   title: 'How much did I spend on food last month?',     subtitle: 'Category spending',   iconBg: 'linear-gradient(145deg, rgba(50,20,20,1), rgba(28,10,10,1))' },
  { icon: PieChart,   title: 'What are my top 3 spending categories?',       subtitle: 'Spending breakdown',  iconBg: 'linear-gradient(145deg, rgba(36,16,46,1), rgba(20,8,28,1))' },
  { icon: RefreshCw,  title: 'Find all my recurring subscriptions',          subtitle: 'Subscription audit',  iconBg: 'linear-gradient(145deg, rgba(14,28,50,1), rgba(8,16,32,1))' },
  { icon: PiggyBank,  title: "What's my savings rate this month?",           subtitle: 'Savings analysis',    iconBg: 'linear-gradient(145deg, rgba(14,34,16,1), rgba(8,20,10,1))' },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: BarEntry[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 52, marginBottom: 2 }}>
      {data.map(({ label, amount }) => (
        <div
          key={label}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 3,
          }}
        >
          <div
            style={{
              width: '100%',
              height: Math.max((amount / max) * 40, 2),
              background: 'linear-gradient(180deg, #F5D576 0%, #9A7B2A 100%)',
              borderRadius: '2px 2px 0 0',
            }}
          />
          <span style={{ fontSize: 9, color: 'rgba(240,236,226,0.3)', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

function StructuredCard({ card }: { card: DataCard }) {
  const isPositive = (card.changePercent ?? 0) > 0
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div
      style={{
        background: 'rgba(212,175,55,0.03)',
        border: '0.5px solid rgba(212,175,55,0.18)',
        borderLeft: '2px solid rgba(212,175,55,0.4)',
        borderRadius: 12,
        padding: '14px 16px',
        marginTop: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(240,236,226,0.45)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: '#f0ece2',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ₹{card.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(240,236,226,0.35)', marginBottom: 4 }}>
            {card.period}
          </div>
          {card.changePercent !== undefined && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                fontWeight: 500,
                color: isPositive ? '#e57373' : '#81c784',
                background: isPositive ? 'rgba(229,115,115,0.1)' : 'rgba(129,199,132,0.1)',
                border: `0.5px solid ${isPositive ? 'rgba(229,115,115,0.25)' : 'rgba(129,199,132,0.25)'}`,
                borderRadius: 20,
                padding: '2px 7px',
              }}
            >
              <ChangeIcon size={10} />
              {isPositive ? '+' : ''}{card.changePercent}%
            </div>
          )}
        </div>
      </div>

      {/* Mini bar chart */}
      <MiniBarChart data={card.chartData} />

      {/* Separator */}
      <div
        style={{
          height: '0.5px',
          background: 'rgba(212,175,55,0.1)',
          margin: '10px 0',
        }}
      />

      {/* Breakdown legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {card.breakdown.map(({ name, amount, color }) => {
          const pct = Math.round((amount / card.total) * 100)
          return (
            <div key={name}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                  }}
                />
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
                  {name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#f0ece2',
                    fontVariantNumeric: 'tabular-nums',
                    marginRight: 6,
                  }}
                >
                  ₹{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: color,
                    background: `${color}18`,
                    border: `0.5px solid ${color}40`,
                    borderRadius: 10,
                    padding: '1px 5px',
                    flexShrink: 0,
                  }}
                >
                  {pct}%
                </span>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  height: 2,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  marginLeft: 15,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    borderRadius: 1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FollowUpChips({
  chips,
  onSelect,
}: {
  chips: string[]
  onSelect: (c: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          style={{
            padding: '5px 11px',
            borderRadius: 20,
            border: '0.5px solid rgba(212,175,55,0.2)',
            background: 'rgba(212,175,55,0.05)',
            color: 'rgba(212,175,55,0.75)',
            fontSize: 11,
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.background = 'rgba(212,175,55,0.12)'
            el.style.color = '#D4AF37'
            el.style.borderColor = 'rgba(212,175,55,0.4)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.background = 'rgba(212,175,55,0.05)'
            el.style.color = 'rgba(212,175,55,0.75)'
            el.style.borderColor = 'rgba(212,175,55,0.2)'
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

function PromptStartersGrid({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        padding: '48px 0 0',
        flex: 1,
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            margin: '0 auto 14px',
            background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow:
              '5px 5px 10px rgba(0,0,0,0.55), -2px -2px 6px rgba(60,55,45,0.12), inset 0 1px 0 rgba(212,175,55,0.18)',
            border: '0.5px solid rgba(212,175,55,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={22} color="#D4AF37" />
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#f0ece2',
            margin: '0 0 6px',
            letterSpacing: '-0.01em',
          }}
        >
          Finance Copilot
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
          Ask me anything about your finances
        </p>
      </div>

      {/* 2×2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          width: '100%',
          maxWidth: 560,
        }}
      >
        {STARTERS.map(({ icon: Icon, title, subtitle, iconBg }) => (
          <button
            key={title}
            onClick={() => onSelect(title)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(212,175,55,0.1)',
              borderRadius: 12,
              padding: '14px 15px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
              el.style.borderColor = 'rgba(212,175,55,0.28)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
              el.style.borderColor = 'rgba(212,175,55,0.1)'
            }}
          >
            {/* icon3d slab */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: iconBg,
                boxShadow:
                  '3px 3px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(40,35,25,0.1), inset 0 1px 0 rgba(212,175,55,0.14)',
                border: '0.5px solid rgba(212,175,55,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={14} color="#D4AF37" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#f0ece2',
                  lineHeight: 1.4,
                  marginBottom: 2,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,236,226,0.38)' }}>
                {subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── shared bold text parser ──────────────────────────────────────────────────

function ParsedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} style={{ fontWeight: 500, color: '#f0ece2' }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CopilotPage({ transactionCount }: CopilotPageProps) {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialQ)
  const [loading, setLoading] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send when arriving via ?q= (e.g. from AiWidget or external link)
  const hasSentInitialRef = useRef(false)
  useEffect(() => {
    if (!initialQ || hasSentInitialRef.current) return
    hasSentInitialRef.current = true
    // Ensure we start from a clean state before the auto-send
    setMessages([])
    // setTimeout lets the cleared state commit before handleSend reads it
    const t = setTimeout(() => handleSend(initialQ), 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const newChat = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  const handleSend = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.ok
          ? (data.reply ?? 'No response received.')
          : (data.error ?? 'Something went wrong — please try again.'),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        card:      res.ok ? data.card      : undefined,
        followUps: res.ok ? data.followUps : undefined,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: 'Network error — please check your connection and try again.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        margin: '-32px -36px',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        background: '#09090d',
      }}
    >
      {/* ── Chat history sidebar ── */}
      <div
        style={{
          width: 228,
          minWidth: 228,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(6,6,10,0.95)',
          borderRight: '0.5px solid rgba(212,175,55,0.09)',
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '20px 14px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '0.5px solid rgba(212,175,55,0.07)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(240,236,226,0.38)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            History
          </span>
          <button
            onClick={newChat}
            title="New chat"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'rgba(212,175,55,0.08)',
              border: '0.5px solid rgba(212,175,55,0.18)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.18)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)')
            }
          >
            <Plus size={12} color="#D4AF37" />
          </button>
        </div>

        {/* Thread list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MessageSquare size={20} color="rgba(212,175,55,0.25)" />
            <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.22)', margin: 0, lineHeight: 1.5 }}>
              No conversations yet.
              <br />
              Start asking below.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Chat header ── */}
        <div
          style={{
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(9,9,13,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '0.5px solid rgba(212,175,55,0.08)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Left: icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
                boxShadow:
                  '3px 3px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(60,55,45,0.12), inset 0 1px 0 rgba(212,175,55,0.18)',
                border: '0.5px solid rgba(212,175,55,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={13} color="#D4AF37" />
            </div>
            <div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#f0ece2',
                  letterSpacing: '-0.01em',
                }}
              >
                Finance Copilot
              </span>
            </div>
          </div>

          {/* Right: badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Txn count */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(212,175,55,0.65)',
                background: 'rgba(212,175,55,0.07)',
                border: '0.5px solid rgba(212,175,55,0.14)',
                borderRadius: 20,
                padding: '3px 10px',
              }}
            >
              {transactionCount.toLocaleString()} transactions indexed
            </span>

            {/* Live dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                className="pulse-dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#81c784',
                }}
              />
              <span style={{ fontSize: 11, color: 'rgba(129,199,132,0.75)' }}>Live</span>
            </div>
          </div>
        </div>

        {/* ── Ambient glow ── */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            top: '15%',
            left: '30%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.025), transparent 65%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Messages area ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {messages.length === 0 ? (
            <PromptStartersGrid
              onSelect={(q) => handleSend(q)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  /* ── User bubble ── */
                  <div
                    key={msg.id}
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                  >
                    <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div
                        style={{
                          background: 'rgba(212,175,55,0.12)',
                          border: '0.5px solid rgba(212,175,55,0.22)',
                          borderRadius: '14px 14px 4px 14px',
                          padding: '10px 14px',
                          fontSize: 13,
                          color: '#f0ece2',
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.28)' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── AI bubble ── */
                  <div
                    key={msg.id}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: '88%' }}
                  >
                    {/* Sparkle slab */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        flexShrink: 0,
                        marginTop: 1,
                        background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
                        boxShadow:
                          '3px 3px 6px rgba(0,0,0,0.5), -1px -1px 4px rgba(60,55,45,0.12), inset 0 1px 0 rgba(212,175,55,0.18)',
                        border: '0.5px solid rgba(212,175,55,0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={13} color="#D4AF37" />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Text bubble */}
                      <div
                        style={{
                          background: 'rgba(212,175,55,0.05)',
                          border: '0.5px solid rgba(212,175,55,0.15)',
                          borderRadius: '14px 14px 14px 4px',
                          padding: '12px 15px',
                          fontSize: 13,
                          color: 'rgba(240,236,226,0.75)',
                          lineHeight: 1.6,
                        }}
                      >
                        <ParsedText text={msg.content} />

                        {/* Structured data card */}
                        {msg.card && <StructuredCard card={msg.card} />}
                      </div>

                      {/* Follow-up chips */}
                      {msg.followUps && (
                        <FollowUpChips
                          chips={msg.followUps}
                          onSelect={(chip) => handleSend(chip)}
                        />
                      )}

                      <span style={{ fontSize: 10, color: 'rgba(240,236,226,0.28)', display: 'block', marginTop: 5 }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                )
              )}

              {/* Loading indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
                      boxShadow: '3px 3px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.18)',
                      border: '0.5px solid rgba(212,175,55,0.14)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={13} color="#D4AF37" />
                  </div>
                  <div
                    style={{
                      background: 'rgba(212,175,55,0.05)',
                      border: '0.5px solid rgba(212,175,55,0.15)',
                      borderRadius: '14px 14px 14px 4px',
                      padding: '13px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'rgba(212,175,55,0.55)',
                          animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div
          style={{
            padding: '14px 20px 18px',
            background: 'rgba(9,9,13,0.96)',
            backdropFilter: 'blur(12px)',
            borderTop: '0.5px solid rgba(212,175,55,0.09)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(212,175,55,0.16)',
              borderRadius: 14,
              padding: '10px 12px 10px 14px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.16)'
            }}
          >
            {/* icon3d slab — sparkle */}
            <div
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,175,55,0.15)',
                border: '0.5px solid rgba(212,175,55,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MessageSquare size={13} color="rgba(212,175,55,0.6)" />
            </div>

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask about your finances… e.g. How much did I spend on food?"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f0ece2',
                fontSize: 13,
                padding: 0,
                fontFamily: 'var(--font-geist-sans)',
              }}
              disabled={loading}
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #F5D576 0%, #D4AF37 60%, #B8962E 100%)'
                  : 'rgba(212,175,55,0.1)',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s, transform 0.15s',
                boxShadow: input.trim() && !loading
                  ? '2px 2px 5px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !loading)
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
              }}
            >
              <Send size={13} color={input.trim() && !loading ? '#09090d' : 'rgba(212,175,55,0.35)'} />
            </button>
          </div>

          <p
            style={{
              fontSize: 10,
              color: 'rgba(240,236,226,0.2)',
              margin: '7px 0 0',
              textAlign: 'center',
            }}
          >
            AI computes intent — your code runs the exact SQL. Numbers are always precise.
          </p>
        </div>
      </div>
    </div>
  )
}
