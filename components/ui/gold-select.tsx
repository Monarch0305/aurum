'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface GoldSelectOption {
  value: string
  label: string
}

interface GoldSelectProps {
  value: string
  onChange: (value: string) => void
  options: GoldSelectOption[]
  placeholder?: string
}

export function GoldSelect({ value, onChange, options, placeholder }: GoldSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Keyboard: Escape closes, arrows move selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((v) => !v)
      return
    }
    if (!open) return
    const idx = options.findIndex((o) => o.value === value)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = options[(idx + 1) % options.length]
      onChange(next.value)
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = options[(idx - 1 + options.length) % options.length]
      onChange(prev.value)
    }
  }

  // Scroll the selected option into view when list opens
  useEffect(() => {
    if (!open || !listRef.current) return
    const active = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
    active?.scrollIntoView({ block: 'nearest' })
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 8,
          background: open
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.04)',
          border: open
            ? '0.5px solid rgba(212,175,55,0.4)'
            : '0.5px solid rgba(212,175,55,0.15)',
          color: selected ? '#f0ece2' : 'rgba(240,236,226,0.25)',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s, background 0.15s',
          outline: 'none',
          boxShadow: open ? '0 0 0 3px rgba(212,175,55,0.06)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(212,175,55,0.3)'
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.06)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              'rgba(212,175,55,0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,255,255,0.04)'
          }
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {selected?.label ?? placeholder ?? 'Select…'}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: 'rgba(212,175,55,0.6)',
            flexShrink: 0,
            transition: 'transform 0.18s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 200,
            maxHeight: 240,
            overflowY: 'auto',
            background: 'rgba(10,9,8,0.99)',
            border: '0.5px solid rgba(212,175,55,0.2)',
            borderRadius: 10,
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.06)',
            padding: '4px 0',
            margin: 0,
            listStyle: 'none',
            // Custom scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(212,175,55,0.2) transparent',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '9px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: isSelected ? '#D4AF37' : '#f0ece2',
                  background: isSelected
                    ? 'rgba(212,175,55,0.1)'
                    : 'transparent',
                  transition: 'background 0.1s, color 0.1s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLLIElement
                  if (!isSelected) {
                    el.style.background = 'rgba(212,175,55,0.07)'
                    el.style.color = 'rgba(240,236,226,0.9)'
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLLIElement
                  el.style.background = isSelected ? 'rgba(212,175,55,0.1)' : 'transparent'
                  el.style.color = isSelected ? '#D4AF37' : '#f0ece2'
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </span>
                {isSelected && (
                  <Check
                    size={12}
                    style={{ color: '#D4AF37', flexShrink: 0 }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
