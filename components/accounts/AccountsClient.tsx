'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  usePlaidLink,
  type PlaidLinkOnSuccess,
  type PlaidLinkOnExit,
} from 'react-plaid-link'
import { Wallet, Plus, Building2, Loader2, RefreshCw } from 'lucide-react'
import AccountCard, { type AccountCardProps } from './AccountCard'

// ─── types ────────────────────────────────────────────────────────────────────

interface AccountsClientProps {
  accounts: Omit<AccountCardProps, 'accentSide' | 'animDelay'>[]
  totalBalance: number
  accountCount: number
}

// ─── connect button (header) ──────────────────────────────────────────────────

interface ConnectState {
  status: 'init' | 'ready' | 'opening' | 'exchanging' | 'success' | 'error'
  errorMsg: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const ACCENT_CYCLE: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right']

// ─── main component ───────────────────────────────────────────────────────────

export default function AccountsClient({
  accounts,
  totalBalance,
  accountCount,
}: AccountsClientProps) {
  const router = useRouter()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [state, setState] = useState<ConnectState>({ status: 'init', errorMsg: '' })
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [syncMsg, setSyncMsg] = useState('')

  // Fetch link token eagerly so the button is ready fast
  useEffect(() => {
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        setLinkToken(d.link_token)
      })
      .catch(() => {
        setState({ status: 'error', errorMsg: 'Could not initialise Plaid.' })
      })
  }, [])

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      setState({ status: 'exchanging', errorMsg: '' })
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
        setState({ status: 'success', errorMsg: '' })
        router.refresh()
      } catch {
        setState({ status: 'error', errorMsg: 'Connection failed — please try again.' })
      }
    },
    [router]
  )

  const onExit = useCallback<PlaidLinkOnExit>((err) => {
    if (err) {
      setState({ status: 'error', errorMsg: err.display_message ?? 'Connection cancelled.' })
    } else {
      setState((s) => ({ ...s, status: linkToken ? 'ready' : 'init' }))
    }
  }, [linkToken])

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess, onExit })

  // Advance to ready once Plaid has initialised
  useEffect(() => {
    if (ready && state.status === 'init') {
      setState((s) => ({ ...s, status: 'ready' }))
    }
  }, [ready, state.status])

  const handleSync = async () => {
    setSyncStatus('syncing')
    setSyncMsg('')
    try {
      const res = await fetch('/api/plaid/sync-transactions', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      setSyncStatus('success')
      setSyncMsg(`${data.totalSynced} transaction${data.totalSynced !== 1 ? 's' : ''} synced`)
      router.refresh()
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      setSyncStatus('error')
      setSyncMsg(msg)
      setTimeout(() => setSyncStatus('idle'), 4000)
    }
  }

  const handleConnect = () => {
    if (!ready) return
    setState((s) => ({ ...s, status: 'opening' }))
    open()
  }

  const isConnectBusy =
    state.status === 'init' || state.status === 'opening' || state.status === 'exchanging'

  const btnLabel =
    state.status === 'init'       ? 'Initialising…'  :
    state.status === 'opening'    ? 'Opening Plaid…'  :
    state.status === 'exchanging' ? 'Connecting…'     :
    state.status === 'success'    ? 'Connected!'      :
                                    'Connect account'

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Page-level ambient glows */}
      <div
        aria-hidden
        style={{
          position: 'fixed', width: 450, height: 450,
          top: '8%', left: '38%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.028), transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)',
              border: '0.5px solid rgba(212,175,55,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Wallet size={17} color="#D4AF37" />
          </div>
          <div>
            <h1
              style={{
                fontSize: 22, fontWeight: 500, color: '#f0ece2',
                margin: '0 0 3px', letterSpacing: '-0.01em',
              }}
            >
              Accounts
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.38)', margin: 0 }}>
              {accountCount} account{accountCount !== 1 ? 's' : ''} connected
            </p>
          </div>
        </div>

        {/* Right: total + sync + connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Total balance badge */}
          {accountCount > 0 && (
            <div
              style={{
                fontSize: 13, fontWeight: 500,
                color: 'rgba(212,175,55,0.8)',
                background: 'rgba(212,175,55,0.07)',
                border: '0.5px solid rgba(212,175,55,0.15)',
                borderRadius: 10, padding: '6px 14px',
              }}
            >
              ₹{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
            </div>
          )}

          {/* Sync button — only when accounts are connected */}
          {accountCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              title={syncMsg || 'Sync transactions from your bank'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 14px 9px 10px',
                borderRadius: 10,
                background:
                  syncStatus === 'success'
                    ? 'rgba(129,199,132,0.1)'
                    : syncStatus === 'error'
                    ? 'rgba(229,115,115,0.08)'
                    : 'rgba(212,175,55,0.07)',
                border:
                  syncStatus === 'success'
                    ? '0.5px solid rgba(129,199,132,0.25)'
                    : syncStatus === 'error'
                    ? '0.5px solid rgba(229,115,115,0.2)'
                    : '0.5px solid rgba(212,175,55,0.18)',
                cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                opacity: syncStatus === 'syncing' ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                if (syncStatus !== 'syncing')
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {syncStatus === 'syncing' ? (
                <Loader2 size={13} className="animate-spin" color="rgba(212,175,55,0.7)" />
              ) : (
                <RefreshCw
                  size={13}
                  color={
                    syncStatus === 'success'
                      ? '#81c784'
                      : syncStatus === 'error'
                      ? '#e57373'
                      : 'rgba(212,175,55,0.7)'
                  }
                />
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  color:
                    syncStatus === 'success'
                      ? '#81c784'
                      : syncStatus === 'error'
                      ? '#e57373'
                      : 'rgba(212,175,55,0.75)',
                }}
              >
                {syncStatus === 'syncing'
                  ? 'Syncing…'
                  : syncStatus === 'success'
                  ? syncMsg || 'Synced!'
                  : syncStatus === 'error'
                  ? 'Sync failed'
                  : 'Sync'}
              </span>
            </button>
          )}

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={isConnectBusy || state.status === 'error'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px 9px 13px', borderRadius: 10,
              background:
                state.status === 'success'
                  ? 'linear-gradient(135deg, rgba(129,199,132,0.18), rgba(129,199,132,0.1))'
                  : isConnectBusy
                  ? 'rgba(212,175,55,0.15)'
                  : 'linear-gradient(135deg, #F5D576 0%, #D4AF37 60%, #B8962E 100%)',
              border:
                state.status === 'success'
                  ? '0.5px solid rgba(129,199,132,0.35)'
                  : isConnectBusy
                  ? '0.5px solid rgba(212,175,55,0.18)'
                  : 'none',
              cursor: isConnectBusy ? 'not-allowed' : 'pointer',
              opacity: isConnectBusy ? 0.75 : 1,
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isConnectBusy)
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            {/* 3D slab */}
            <div
              style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: isConnectBusy
                  ? 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))'
                  : 'linear-gradient(145deg, rgba(30,25,10,1), rgba(18,14,4,1))',
                boxShadow: '2px 2px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
                border: '0.5px solid rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isConnectBusy ? (
                <Loader2 size={13} className="animate-spin" color="rgba(212,175,55,0.6)" />
              ) : (
                <Building2 size={13} color={state.status === 'success' ? '#81c784' : '#09090d'} />
              )}
            </div>
            <span
              style={{
                fontSize: 13, fontWeight: 500,
                color:
                  state.status === 'success' ? '#81c784' :
                  isConnectBusy ? 'rgba(240,236,226,0.5)' : '#09090d',
                whiteSpace: 'nowrap',
              }}
            >
              {btnLabel}
            </span>
          </button>
        </div>
      </div>

      {/* Error strip */}
      {state.status === 'error' && state.errorMsg && (
        <div
          style={{
            background: 'rgba(229,115,115,0.07)',
            border: '0.5px solid rgba(229,115,115,0.2)',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: '#e57373',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ flex: 1 }}>{state.errorMsg}</span>
          <button
            onClick={() => {
              setState({ status: 'init', errorMsg: '' })
              setLinkToken(null)
              fetch('/api/plaid/create-link-token', { method: 'POST' })
                .then((r) => r.json())
                .then((d) => setLinkToken(d.link_token))
                .catch(() => {})
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(229,115,115,0.7)', fontSize: 11, padding: 0 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {accounts.length === 0 ? (
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, padding: '64px 0', textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
              boxShadow: '4px 4px 9px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.14)',
              border: '0.5px solid rgba(212,175,55,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <Wallet size={22} color="rgba(212,175,55,0.5)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#f0ece2', margin: 0 }}>
            No accounts connected yet
          </p>
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.38)', margin: 0, maxWidth: 360 }}>
            Connect your first bank account or credit card to start tracking your finances.
          </p>
          <button
            onClick={handleConnect}
            disabled={!ready}
            style={{
              marginTop: 8, padding: '10px 22px', borderRadius: 10,
              background: ready
                ? 'linear-gradient(135deg, #F5D576 0%, #D4AF37 60%, #B8962E 100%)'
                : 'rgba(212,175,55,0.15)',
              border: 'none', cursor: ready ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 500, color: ready ? '#09090d' : 'rgba(240,236,226,0.4)',
              transition: 'opacity 0.2s',
            }}
          >
            Connect your first account
          </button>
        </div>
      ) : (
        /* ── Accounts grid ── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {accounts.map((account, i) => (
            <AccountCard
              key={account.id}
              {...account}
              accentSide={ACCENT_CYCLE[i % ACCENT_CYCLE.length]}
              animDelay={i * 80}
            />
          ))}

          {/* Dashed "Link another" card */}
          <button
            onClick={handleConnect}
            disabled={!ready}
            style={{
              background: 'transparent',
              border: '1.5px dashed rgba(212,175,55,0.2)',
              borderRadius: 16,
              padding: '22px 24px',
              cursor: ready ? 'pointer' : 'default',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              minHeight: 180,
              transition: 'border-color 0.2s, background 0.2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (!ready) return
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(212,175,55,0.45)'
              el.style.background = 'rgba(212,175,55,0.025)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(212,175,55,0.2)'
              el.style.background = 'transparent'
            }}
          >
            {/* Icon ring */}
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                border: '1px dashed rgba(212,175,55,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(212,175,55,0.05)',
              }}
            >
              <Plus size={20} color="rgba(212,175,55,0.55)" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 13, fontWeight: 500,
                  color: 'rgba(212,175,55,0.65)',
                  margin: '0 0 4px',
                }}
              >
                Link another bank or card
              </p>
              <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.28)', margin: 0 }}>
                Connect via Plaid in sandbox mode
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
