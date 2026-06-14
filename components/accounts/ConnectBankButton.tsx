'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  usePlaidLink,
  type PlaidLinkOnSuccess,
  type PlaidLinkOnExit,
} from 'react-plaid-link'
import { Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ConnectBankButtonProps {
  /** Called after the access token is successfully stored in DB */
  onComplete?: () => void
}

type Status = 'idle' | 'fetching-token' | 'ready' | 'opening' | 'exchanging' | 'success' | 'error'

export default function ConnectBankButton({ onComplete }: ConnectBankButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('fetching-token')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch a fresh link token on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
        if (!res.ok) throw new Error('non-2xx response')
        const data = await res.json()
        if (!cancelled) {
          setLinkToken(data.link_token)
          // status will advance to 'ready' once usePlaidLink signals it
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg('Could not initialise bank connection. Refresh and try again.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      setStatus('exchanging')
      try {
        const res = await fetch('/api/plaid/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name ?? 'Unknown Bank',
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        setStatus('success')
        onComplete?.()
      } catch (err) {
        console.error('[ConnectBankButton] exchange error', err)
        setStatus('error')
        setErrorMsg('Failed to connect the account. Please try again.')
      }
    },
    [onComplete]
  )

  const onExit = useCallback<PlaidLinkOnExit>((err) => {
    if (err) {
      setStatus('error')
      setErrorMsg(err.display_message ?? 'Bank connection was cancelled.')
    } else {
      // User closed Link without an error — just go back to ready
      setStatus('ready')
    }
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  })

  // Advance to 'ready' once Plaid Link has loaded the token
  useEffect(() => {
    if (ready && status === 'fetching-token') {
      setStatus('ready')
    }
  }, [ready, status])

  const handleClick = () => {
    if (!ready || status === 'exchanging') return
    setStatus('opening')
    open()
    // Plaid Link takes over the UI; status resets via onSuccess / onExit
  }

  const isLoading =
    status === 'fetching-token' || status === 'opening' || status === 'exchanging'
  const isDisabled = isLoading || status === 'success' || status === 'error'

  // ── Label text ────────────────────────────────────────────────────────────
  let label = 'Connect a bank account'
  if (status === 'fetching-token') label = 'Initialising…'
  if (status === 'opening') label = 'Opening Plaid…'
  if (status === 'exchanging') label = 'Connecting…'
  if (status === 'success') label = 'Account connected!'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 20px 11px 14px',
          borderRadius: 12,
          background:
            status === 'success'
              ? 'linear-gradient(135deg, rgba(129,199,132,0.15), rgba(129,199,132,0.08))'
              : isDisabled
              ? 'rgba(212,175,55,0.12)'
              : 'linear-gradient(135deg, #F5D576 0%, #D4AF37 60%, #B8962E 100%)',
          border:
            status === 'success'
              ? '0.5px solid rgba(129,199,132,0.3)'
              : isDisabled
              ? '0.5px solid rgba(212,175,55,0.15)'
              : 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s, transform 0.15s',
          opacity: isLoading ? 0.75 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled)
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        {/* 3D icon slab */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background:
              status === 'success'
                ? 'linear-gradient(145deg, rgba(30,50,30,1), rgba(18,32,18,1))'
                : isDisabled
                ? 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))'
                : 'linear-gradient(145deg, rgba(30,25,10,1), rgba(18,14,4,1))',
            boxShadow:
              '2px 2px 5px rgba(0,0,0,0.5), -1px -1px 3px rgba(60,55,45,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
            border: '0.5px solid rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <Loader2
              size={15}
              className="animate-spin"
              color={isDisabled && !isLoading ? 'rgba(212,175,55,0.4)' : '#09090d'}
            />
          ) : status === 'success' ? (
            <CheckCircle2 size={15} color="#81c784" />
          ) : (
            <Building2
              size={15}
              color={isDisabled ? 'rgba(212,175,55,0.4)' : '#09090d'}
            />
          )}
        </div>

        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color:
              status === 'success'
                ? '#81c784'
                : isDisabled
                ? 'rgba(240,236,226,0.45)'
                : '#09090d',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </button>

      {/* Error message */}
      {status === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            background: 'rgba(229,115,115,0.07)',
            border: '0.5px solid rgba(229,115,115,0.2)',
            borderRadius: 8,
            padding: '9px 12px',
          }}
        >
          <AlertCircle
            size={14}
            color="#e57373"
            style={{ marginTop: 1, flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, color: '#e57373', lineHeight: 1.5 }}>
            {errorMsg}
          </span>
          <button
            onClick={() => {
              setStatus('fetching-token')
              setErrorMsg('')
              setLinkToken(null)
              // Re-fetch a fresh link token
              fetch('/api/plaid/create-link-token', { method: 'POST' })
                .then((r) => r.json())
                .then((d) => setLinkToken(d.link_token))
                .catch(() => {
                  setStatus('error')
                  setErrorMsg('Still failing. Check your network and try again.')
                })
            }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              color: 'rgba(229,115,115,0.7)',
              padding: 0,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
