'use client'

import { useState } from 'react'
import {
  Lock,
  Building2,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { PlaidItem } from '@/types'
import { GoldSelect } from '@/components/ui/gold-select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  preferences: {
    currency: 'INR' | 'USD' | 'EUR'
    date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY'
    month_start_day: number
  } | null
  notifications: {
    anomaly_alerts: boolean
    weekly_summary: boolean
    subscription_reminders: boolean
  } | null
  created_at: string
}

interface PlaidItemRow {
  id: string
  item_id: string
  institution_name: string
  created_at: string
}

interface SettingsClientProps {
  initialProfile: Profile | null
  plaidItems: PlaidItemRow[]
  userEmail: string
}

type MsgState = { type: 'success' | 'error'; text: string } | null

// ─── Style constants ───────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(212,175,55,0.1)',
  borderTop: '1.5px solid rgba(212,175,55,0.22)',
  borderRadius: 16,
  padding: '24px 28px',
  marginBottom: 16,
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#D4AF37',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 20,
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: 'rgba(240,236,226,0.4)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(212,175,55,0.15)',
  borderRadius: 8,
  color: '#f0ece2',
  fontSize: 13,
  padding: '10px 14px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
}


const BTN_GOLD: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 18px',
  borderRadius: 8,
  border: '0.5px solid rgba(212,175,55,0.3)',
  background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))',
  color: '#D4AF37',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  letterSpacing: '0.02em',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
}

const BTN_MUTED: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: 8,
  border: '0.5px solid rgba(212,175,55,0.1)',
  background: 'transparent',
  color: 'rgba(240,236,226,0.5)',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
}

// ─── Helper components ────────────────────────────────────────────────────────

function StatusMsg({ msg }: { msg: MsgState }) {
  if (!msg) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: msg.type === 'success' ? '#81c784' : '#e57373',
        marginTop: 10,
      }}
    >
      {msg.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {msg.text}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        cursor: 'pointer',
        background: checked
          ? 'linear-gradient(135deg, rgba(212,175,55,0.55), rgba(212,175,55,0.28))'
          : 'rgba(255,255,255,0.06)',
        boxShadow: checked
          ? 'inset 0 1px 0 rgba(212,175,55,0.3), 0 0 8px rgba(212,175,55,0.12)'
          : 'inset 0 1px 0 rgba(0,0,0,0.2)',
        position: 'relative',
        transition: 'all 0.22s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: checked ? '#D4AF37' : 'rgba(240,236,226,0.28)',
          transition: 'left 0.22s, background 0.22s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  )
}

function Modal({
  children,
  onClose,
  title,
  danger = false,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
  danger?: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          margin: '0 16px',
          background: 'rgba(12,11,9,0.99)',
          border: `0.5px solid ${danger ? 'rgba(229,115,115,0.2)' : 'rgba(212,175,55,0.18)'}`,
          borderTop: `1.5px solid ${danger ? 'rgba(229,115,115,0.5)' : 'rgba(212,175,55,0.4)'}`,
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: danger ? '#e57373' : '#D4AF37',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(240,236,226,0.35)',
              padding: 2,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsClient({
  initialProfile,
  plaidItems,
  userEmail,
}: SettingsClientProps) {
  // Profile
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<MsgState>(null)

  // Password modal
  const [showPwModal, setShowPwModal] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<MsgState>(null)

  // Preferences
  const prefs = initialProfile?.preferences
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>(prefs?.currency ?? 'INR')
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>(
    prefs?.date_format ?? 'DD/MM/YYYY'
  )
  const [monthStartDay, setMonthStartDay] = useState(prefs?.month_start_day ?? 1)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsMsg, setPrefsMsg] = useState<MsgState>(null)

  // Notifications
  const notifs = initialProfile?.notifications
  const [anomalyAlerts, setAnomalyAlerts] = useState(notifs?.anomaly_alerts ?? true)
  const [weeklySummary, setWeeklySummary] = useState(notifs?.weekly_summary ?? true)
  const [subReminders, setSubReminders] = useState(notifs?.subscription_reminders ?? true)
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [notifsMsg, setNotifsMsg] = useState<MsgState>(null)

  // Connected accounts
  const [items, setItems] = useState(plaidItems)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [disconnectMsg, setDisconnectMsg] = useState<MsgState>(null)

  // Data
  const [exportingCsv, setExportingCsv] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<MsgState>(null)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setProfileMsg({ type: 'success', text: 'Profile saved.' })
    } catch (e) {
      setProfileMsg({ type: 'error', text: (e as Error).message })
    } finally {
      setSavingProfile(false)
    }
  }

  const openPwModal = () => {
    setShowPwModal(true)
    setPwMsg(null)
    setNewPw('')
    setConfirmPw('')
    setShowNewPw(false)
    setShowConfirmPw(false)
  }

  const savePassword = async () => {
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setSavingPw(true)
    setPwMsg(null)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPw }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update password')
      setPwMsg({ type: 'success', text: 'Password updated successfully.' })
      setNewPw('')
      setConfirmPw('')
    } catch (e) {
      setPwMsg({ type: 'error', text: (e as Error).message })
    } finally {
      setSavingPw(false)
    }
  }

  const savePreferences = async () => {
    setSavingPrefs(true)
    setPrefsMsg(null)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            currency,
            date_format: dateFormat,
            month_start_day: monthStartDay,
          },
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setPrefsMsg({ type: 'success', text: 'Preferences saved.' })
    } catch (e) {
      setPrefsMsg({ type: 'error', text: (e as Error).message })
    } finally {
      setSavingPrefs(false)
    }
  }

  const saveNotifications = async () => {
    setSavingNotifs(true)
    setNotifsMsg(null)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications: {
            anomaly_alerts: anomalyAlerts,
            weekly_summary: weeklySummary,
            subscription_reminders: subReminders,
          },
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setNotifsMsg({ type: 'success', text: 'Notification settings saved.' })
    } catch (e) {
      setNotifsMsg({ type: 'error', text: (e as Error).message })
    } finally {
      setSavingNotifs(false)
    }
  }

  const disconnectBank = async (itemId: string) => {
    setDisconnecting(itemId)
    setDisconnectMsg(null)
    try {
      const res = await fetch('/api/settings/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to disconnect')
      setItems((prev) => prev.filter((i) => i.item_id !== itemId))
    } catch (e) {
      setDisconnectMsg({ type: 'error', text: (e as Error).message })
    } finally {
      setDisconnecting(null)
    }
  }

  const exportCsv = () => {
    setExportingCsv(true)
    const a = document.createElement('a')
    a.href = '/api/settings/export-csv'
    a.download = `aurum-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setExportingCsv(false), 1200)
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeletingAccount(true)
    setDeleteMsg(null)
    try {
      const res = await fetch('/api/settings/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to delete account')
      window.location.href = '/login'
    } catch (e) {
      setDeleteMsg({ type: 'error', text: (e as Error).message })
      setDeletingAccount(false)
    }
  }

  const userInitial = (displayName || userEmail)[0]?.toUpperCase() ?? '?'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '15%',
          right: '20%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.05), transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Page header */}
      <div style={{ marginBottom: 28, position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            background: 'linear-gradient(180deg, #F5D576, #D4AF37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 4px',
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
          Manage your profile, preferences, and account.
        </p>
      </div>

      {/* ── Profile ─────────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: 'relative', zIndex: 1 }}>
        <p style={SECTION_TITLE}>Profile</p>

        {/* Avatar + display name */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.07))',
              border: '0.5px solid rgba(212,175,55,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 500,
              color: '#D4AF37',
            }}
          >
            {userInitial}
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              style={INPUT}
              className="aurum-input"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div style={{ marginBottom: 20 }}>
          <label style={LABEL}>Email Address</label>
          <div
            style={{
              ...INPUT,
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(212,175,55,0.08)',
              color: 'rgba(240,236,226,0.38)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'default',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: 'rgba(212,175,55,0.45)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              read only
            </span>
            <span
              style={{
                width: 1,
                height: 12,
                background: 'rgba(212,175,55,0.12)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {userEmail}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            style={{ ...BTN_GOLD, opacity: savingProfile ? 0.6 : 1, cursor: savingProfile ? 'default' : 'pointer' }}
          >
            {savingProfile ? (
              <Loader2 size={12} className="animate-spin" />
            ) : null}
            Save Profile
          </button>
          <button onClick={openPwModal} style={BTN_MUTED}>
            <Lock size={12} />
            Change Password
          </button>
        </div>

        <StatusMsg msg={profileMsg} />
      </div>

      {/* ── Preferences ─────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: 'relative', zIndex: 1 }}>
        <p style={SECTION_TITLE}>Preferences</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px 20px',
            marginBottom: 18,
          }}
        >
          {/* Currency */}
          <div>
            <label style={LABEL}>Currency</label>
            <GoldSelect
              value={currency}
              onChange={(v) => setCurrency(v as 'INR' | 'USD' | 'EUR')}
              options={[
                { value: 'INR', label: '₹ INR — Indian Rupee' },
                { value: 'USD', label: '$ USD — US Dollar' },
                { value: 'EUR', label: '€ EUR — Euro' },
              ]}
            />
          </div>

          {/* Month start day */}
          <div>
            <label style={LABEL}>Financial Month Start</label>
            <GoldSelect
              value={String(monthStartDay)}
              onChange={(v) => setMonthStartDay(Number(v))}
              options={Array.from({ length: 28 }, (_, i) => {
                const d = i + 1
                return {
                  value: String(d),
                  label:
                    d === 1
                      ? 'Day 1 (1st — default)'
                      : d === 15
                        ? 'Day 15 (mid-month)'
                        : `Day ${d}`,
                }
              })}
            />
          </div>
        </div>

        {/* Date format */}
        <div style={{ marginBottom: 20 }}>
          <label style={LABEL}>Date Format</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['DD/MM/YYYY', 'MM/DD/YYYY'] as const).map((fmt) => {
              const active = dateFormat === fmt
              return (
                <button
                  key={fmt}
                  onClick={() => setDateFormat(fmt)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: active
                      ? '0.5px solid rgba(212,175,55,0.4)'
                      : '0.5px solid rgba(212,175,55,0.1)',
                    background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)',
                    color: active ? '#D4AF37' : 'rgba(240,236,226,0.45)',
                    fontSize: 12,
                    fontWeight: active ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {fmt}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={savePreferences}
          disabled={savingPrefs}
          style={{ ...BTN_GOLD, opacity: savingPrefs ? 0.6 : 1, cursor: savingPrefs ? 'default' : 'pointer' }}
        >
          {savingPrefs ? <Loader2 size={12} className="animate-spin" /> : null}
          Save Preferences
        </button>
        <StatusMsg msg={prefsMsg} />
      </div>

      {/* ── Notifications ────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: 'relative', zIndex: 1 }}>
        <p style={SECTION_TITLE}>Notifications</p>
        <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.35)', marginBottom: 20, marginTop: -12 }}>
          Notification delivery is not yet active — these settings are saved for when it ships.
        </p>

        {[
          {
            key: 'anomaly_alerts',
            label: 'Anomaly Alerts',
            desc: 'Get notified when a spending category spikes more than 20% above your baseline.',
            value: anomalyAlerts,
            set: setAnomalyAlerts,
          },
          {
            key: 'weekly_summary',
            label: 'Weekly Summary',
            desc: 'Receive a weekly digest of your spending, income, and savings rate.',
            value: weeklySummary,
            set: setWeeklySummary,
          },
          {
            key: 'subscription_reminders',
            label: 'Subscription Reminders',
            desc: 'Get reminded about recurring charges 2 days before they hit your account.',
            value: subReminders,
            set: setSubReminders,
          },
        ].map(({ key, label, desc, value, set }, idx, arr) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 20,
              paddingBottom: idx < arr.length - 1 ? 16 : 0,
              marginBottom: idx < arr.length - 1 ? 16 : 20,
              borderBottom: idx < arr.length - 1 ? '0.5px solid rgba(212,175,55,0.07)' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#f0ece2', fontWeight: 500, margin: '0 0 3px' }}>
                {label}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0, lineHeight: 1.55 }}>
                {desc}
              </p>
            </div>
            <Toggle checked={value} onChange={set} />
          </div>
        ))}

        <button
          onClick={saveNotifications}
          disabled={savingNotifs}
          style={{ ...BTN_GOLD, opacity: savingNotifs ? 0.6 : 1, cursor: savingNotifs ? 'default' : 'pointer' }}
        >
          {savingNotifs ? <Loader2 size={12} className="animate-spin" /> : null}
          Save Notifications
        </button>
        <StatusMsg msg={notifsMsg} />
      </div>

      {/* ── Connected Accounts ───────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: 'relative', zIndex: 1 }}>
        <p style={SECTION_TITLE}>Connected Accounts</p>

        {items.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: 'rgba(240,236,226,0.3)',
              textAlign: 'center',
              padding: '28px 0 12px',
              margin: 0,
            }}
          >
            No bank accounts connected yet.
          </p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom:
                  idx < items.length - 1 ? '0.5px solid rgba(212,175,55,0.06)' : 'none',
              }}
            >
              {/* Icon slab */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
                  boxShadow:
                    '3px 3px 7px rgba(0,0,0,0.5), -1px -1px 4px rgba(60,55,45,0.12), inset 0 1px 0 rgba(212,175,55,0.12)',
                  border: '0.5px solid rgba(212,175,55,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={16} style={{ color: '#D4AF37' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#f0ece2',
                    margin: '0 0 2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.institution_name}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(240,236,226,0.35)', margin: 0 }}>
                  Connected{' '}
                  {new Date(item.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Disconnect */}
              <button
                onClick={() => disconnectBank(item.item_id)}
                disabled={!!disconnecting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: '0.5px solid rgba(229,115,115,0.22)',
                  background: 'transparent',
                  color: disconnecting === item.item_id ? 'rgba(229,115,115,0.4)' : '#e57373',
                  fontSize: 12,
                  cursor: disconnecting ? 'default' : 'pointer',
                  flexShrink: 0,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  opacity: disconnecting && disconnecting !== item.item_id ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!disconnecting)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(229,115,115,0.08)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {disconnecting === item.item_id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
                Disconnect
              </button>
            </div>
          ))
        )}

        <StatusMsg msg={disconnectMsg} />
      </div>

      {/* ── Data ────────────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: 'relative', zIndex: 1 }}>
        <p style={SECTION_TITLE}>Data</p>

        {/* Export CSV row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            paddingBottom: 16,
            marginBottom: 16,
            borderBottom: '0.5px solid rgba(212,175,55,0.07)',
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#f0ece2', margin: '0 0 3px' }}>
              Export Transactions
            </p>
            <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
              Download all your transactions as a CSV file.
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={exportingCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '0.5px solid rgba(212,175,55,0.2)',
              background: 'rgba(212,175,55,0.06)',
              color: 'rgba(240,236,226,0.65)',
              fontSize: 12,
              cursor: exportingCsv ? 'default' : 'pointer',
              flexShrink: 0,
              opacity: exportingCsv ? 0.6 : 1,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!exportingCsv) {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = 'rgba(212,175,55,0.35)'
                el.style.background = 'rgba(212,175,55,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'rgba(212,175,55,0.2)'
              el.style.background = 'rgba(212,175,55,0.06)'
            }}
          >
            {exportingCsv ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Export CSV
          </button>
        </div>

        {/* Delete account row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#e57373', margin: '0 0 3px' }}>
              Delete Account
            </p>
            <p style={{ fontSize: 12, color: 'rgba(240,236,226,0.4)', margin: 0 }}>
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => {
              setShowDeleteModal(true)
              setDeleteConfirm('')
              setDeleteMsg(null)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '0.5px solid rgba(229,115,115,0.25)',
              background: 'transparent',
              color: '#e57373',
              fontSize: 12,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(229,115,115,0.08)'
              el.style.borderColor = 'rgba(229,115,115,0.4)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'transparent'
              el.style.borderColor = 'rgba(229,115,115,0.25)'
            }}
          >
            <Trash2 size={12} />
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Password Modal ──────────────────────────────────────────────────── */}
      {showPwModal && (
        <Modal onClose={() => setShowPwModal(false)} title="Change Password">
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                style={{ ...INPUT, paddingRight: 38 }}
                className="aurum-input"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(240,236,226,0.35)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showNewPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={LABEL}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') savePassword() }}
                placeholder="Repeat new password"
                style={{ ...INPUT, paddingRight: 38 }}
                className="aurum-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(240,236,226,0.35)',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showConfirmPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <StatusMsg msg={pwMsg} />

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              onClick={savePassword}
              disabled={savingPw || !newPw || !confirmPw}
              style={{
                ...BTN_GOLD,
                opacity: savingPw || !newPw || !confirmPw ? 0.5 : 1,
                cursor: savingPw || !newPw || !confirmPw ? 'default' : 'pointer',
              }}
            >
              {savingPw ? <Loader2 size={12} className="animate-spin" /> : null}
              Update Password
            </button>
            <button onClick={() => setShowPwModal(false)} style={BTN_MUTED}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Account Modal ────────────────────────────────────────────── */}
      {showDeleteModal && (
        <Modal
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          danger
        >
          <p
            style={{
              fontSize: 13,
              color: 'rgba(240,236,226,0.55)',
              margin: '0 0 18px',
              lineHeight: 1.6,
            }}
          >
            This will permanently delete your Aurum account, all transactions, connected bank
            accounts, and your profile.{' '}
            <strong style={{ color: '#e57373' }}>This action cannot be undone.</strong>
          </p>

          <div style={{ marginBottom: 4 }}>
            <label style={LABEL}>Type DELETE to confirm</label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') deleteAccount() }}
              placeholder="DELETE"
              style={{
                ...INPUT,
                borderColor:
                  deleteConfirm === 'DELETE'
                    ? 'rgba(229,115,115,0.45)'
                    : 'rgba(212,175,55,0.15)',
              }}
              className="aurum-input"
              autoFocus
            />
          </div>

          <StatusMsg msg={deleteMsg} />

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              onClick={deleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deletingAccount}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 8,
                border: '0.5px solid rgba(229,115,115,0.4)',
                background: 'rgba(229,115,115,0.12)',
                color: '#e57373',
                fontSize: 12,
                fontWeight: 500,
                cursor: deleteConfirm !== 'DELETE' || deletingAccount ? 'default' : 'pointer',
                opacity: deleteConfirm !== 'DELETE' || deletingAccount ? 0.5 : 1,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {deletingAccount ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              Delete My Account
            </button>
            <button onClick={() => setShowDeleteModal(false)} style={BTN_MUTED}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
