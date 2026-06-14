'use client'

import { useState } from 'react'
import {
  Sparkles,
  Bot,
  Send,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import type { InsightCard } from '@/types'

interface AiWidgetProps {
  insights: InsightCard[]
  transactionCount: number
}

function typeStyles(type: InsightCard['type']) {
  if (type === 'warning')
    return {
      bg: 'rgba(229,115,115,0.06)',
      border: 'rgba(229,115,115,0.2)',
      accent: 'rgba(229,115,115,0.35)',
      iconColor: '#e57373',
    }
  if (type === 'success')
    return {
      bg: 'rgba(129,199,132,0.06)',
      border: 'rgba(129,199,132,0.2)',
      accent: 'rgba(129,199,132,0.35)',
      iconColor: '#81c784',
    }
  return {
    bg: 'rgba(212,175,55,0.04)',
    border: 'rgba(212,175,55,0.15)',
    accent: 'rgba(212,175,55,0.3)',
    iconColor: '#D4AF37',
  }
}

function InsightIcon({ type }: { type: InsightCard['type'] }) {
  const s = typeStyles(type)
  if (type === 'warning') return <AlertTriangle size={11} color={s.iconColor} />
  if (type === 'success') return <CheckCircle2 size={11} color={s.iconColor} />
  return <Info size={11} color={s.iconColor} />
}

// Strip **bold** markers for the compact widget reply
function plainText(text: string) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1')
}

export default function AiWidget({ insights, transactionCount }: AiWidgetProps) {
  const [prompt, setPrompt]   = useState('')
  const [asking, setAsking]   = useState(false)
  const [reply,  setReply]    = useState<string | null>(null)
  const [lastQ,  setLastQ]    = useState('')

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = prompt.trim()
    if (!q || asking) return

    setAsking(true)
    setReply(null)
    setLastQ(q)

    try {
      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setReply(
        res.ok
          ? plainText(data.reply ?? 'No response.')
          : (data.error ?? 'Something went wrong.')
      )
    } catch {
      setReply('Network error — please try again.')
    } finally {
      setAsking(false)
    }
  }

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          bottom: -60,
          right: -60,
          background: 'radial-gradient(circle, rgba(212,175,55,0.05), transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 3D slab */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
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
          <span style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2' }}>
            AI Insights
          </span>
        </div>

        {/* Txn count badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(212,175,55,0.7)',
            background: 'rgba(212,175,55,0.07)',
            border: '0.5px solid rgba(212,175,55,0.15)',
            borderRadius: 20,
            padding: '2px 8px',
            letterSpacing: '0.02em',
          }}
        >
          {transactionCount.toLocaleString()} txns
        </span>
      </div>

      {/* Insight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {insights.map((card, i) => {
          const s = typeStyles(card.type)
          return (
            <div
              key={i}
              style={{
                background: s.bg,
                border: `0.5px solid ${s.border}`,
                borderLeft: `2px solid ${s.accent}`,
                borderRadius: 9,
                padding: '9px 11px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}
              >
                <InsightIcon type={card.type} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#f0ece2', lineHeight: 1.3 }}>
                  {card.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(240,236,226,0.48)',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {card.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '0.5px',
          background: 'rgba(212,175,55,0.07)',
          margin: '14px 0 12px',
        }}
      />

      {/* Mini chat input */}
      <form onSubmit={handleAsk}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            borderRadius: 10,
            padding: '8px 10px',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)')
          }
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node))
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.12)'
          }}
        >
          <Bot size={12} color="rgba(212,175,55,0.5)" style={{ flexShrink: 0 }} />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about your finances…"
            disabled={asking}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f0ece2',
              fontSize: 12,
              padding: 0,
              opacity: asking ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || asking}
            style={{
              background: prompt.trim() && !asking ? 'rgba(212,175,55,0.18)' : 'transparent',
              border: 'none',
              borderRadius: 5,
              cursor: prompt.trim() && !asking ? 'pointer' : 'default',
              color: prompt.trim() && !asking ? '#D4AF37' : 'rgba(240,236,226,0.18)',
              padding: '3px 4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {asking
              ? <Loader2 size={11} className="animate-spin" />
              : <Send size={11} />
            }
          </button>
        </div>
      </form>

      {/* Inline reply */}
      {(asking || reply) && (
        <div
          style={{
            marginTop: 10,
            padding: '9px 11px',
            background: 'rgba(212,175,55,0.04)',
            border: '0.5px solid rgba(212,175,55,0.14)',
            borderLeft: '1.5px solid rgba(212,175,55,0.3)',
            borderRadius: 8,
          }}
        >
          {asking ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'rgba(212,175,55,0.5)',
                    animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 11,
                color: 'rgba(240,236,226,0.65)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {reply}
            </p>
          )}
        </div>
      )}

      {/* Full copilot link */}
      <Link
        href={lastQ ? `/copilot?q=${encodeURIComponent(lastQ)}` : '/copilot'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          marginTop: 10,
          fontSize: 11,
          color: 'rgba(212,175,55,0.5)',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = 'rgba(212,175,55,0.8)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = 'rgba(212,175,55,0.5)')
        }
      >
        {reply ? 'See full analysis in Copilot' : 'Open full AI Copilot'}
        <ArrowRight size={10} />
      </Link>
    </div>
  )
}
