'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Coins, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('email already')) {
        setError('DUPLICATE_EMAIL')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
    } else {
      router.push('/onboarding')
      router.refresh()
    }
  }

  // ── Email confirmation screen ──────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px', position: 'relative' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: '140%',
            paddingBottom: '140%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(129,199,132,0.08) 0%, transparent 62%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(212,175,55,0.12)',
            borderTop: '1.5px solid rgba(129,199,132,0.4)',
            borderRadius: 20,
            padding: '48px 36px',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          }}
        >
          {/* Success icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(145deg, rgba(20,40,20,1), rgba(10,22,10,1))',
              boxShadow:
                '4px 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(129,199,132,0.2)',
              border: '0.5px solid rgba(129,199,132,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={26} color="#81c784" />
          </div>

          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: '#f0ece2',
              margin: '0 0 10px',
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(240,236,226,0.48)',
              lineHeight: 1.65,
              margin: '0 0 28px',
            }}
          >
            We sent a confirmation link to{' '}
            <span style={{ color: '#D4AF37', fontWeight: 500 }}>{email}</span>.
            <br />
            Click it to activate your Aurum account.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 500,
              color: '#D4AF37',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.textDecoration = 'none')
            }
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Main signup form ───────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 420, padding: '0 16px', position: 'relative' }}>

      {/* Focused card glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: '140%',
          paddingBottom: '140%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 62%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(212,175,55,0.12)',
          borderTop: '1.5px solid rgba(212,175,55,0.3)',
          borderRadius: 20,
          padding: '36px 36px 32px',
          backdropFilter: 'blur(4px)',
          boxShadow:
            '0 24px 64px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(212,175,55,0.06) inset',
        }}
      >
        {/* ── Logo section ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          {/* icon3d coin slab */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(145deg, rgba(44,42,36,1), rgba(22,20,16,1))',
              boxShadow:
                '5px 5px 10px rgba(0,0,0,0.55), -2px -2px 7px rgba(60,55,40,0.14), inset 0 1px 0 rgba(212,175,55,0.18), inset 0 -1px 0 rgba(0,0,0,0.2)',
              border: '0.5px solid rgba(212,175,55,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Coins size={24} color="#D4AF37" />
          </div>

          {/* "Aurum" wordmark */}
          <span
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(180deg, #F5D576 0%, #D4AF37 55%, #9A7B2A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
            }}
          >
            Aurum
          </span>

          {/* Divider */}
          <div
            style={{
              width: '100%',
              height: '0.5px',
              background:
                'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)',
              marginBottom: 20,
            }}
          />

          <h1
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: '#f0ece2',
              margin: '0 0 5px',
              letterSpacing: '-0.01em',
            }}
          >
            Create your account
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(240,236,226,0.42)', margin: 0 }}>
            Start managing your finances with AI
          </p>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSignup}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(240,236,226,0.48)',
                marginBottom: 7,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="aurum-input"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(212,175,55,0.16)',
                borderRadius: 10,
                padding: '11px 14px',
                color: '#f0ece2',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(240,236,226,0.48)',
                marginBottom: 7,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="aurum-input"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(212,175,55,0.16)',
                  borderRadius: 10,
                  padding: '11px 42px 11px 14px',
                  color: '#f0ece2',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(240,236,226,0.32)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = 'rgba(240,236,226,0.65)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = 'rgba(240,236,226,0.32)')
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirm"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(240,236,226,0.48)',
                marginBottom: 7,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="aurum-input"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(212,175,55,0.16)',
                borderRadius: 10,
                padding: '11px 14px',
                color: '#f0ece2',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: 'rgba(229,115,115,0.08)',
                border: '0.5px solid rgba(229,115,115,0.28)',
                borderLeft: '2px solid rgba(229,115,115,0.5)',
                borderRadius: 9,
                padding: '10px 13px',
                fontSize: 13,
                color: '#e57373',
                lineHeight: 1.4,
              }}
            >
              {error === 'DUPLICATE_EMAIL' ? (
                <span>
                  An account with this email already exists.{' '}
                  <Link href="/login" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
                    Sign in instead
                  </Link>
                </span>
              ) : (
                error
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? 'rgba(212,175,55,0.22)'
                : 'linear-gradient(135deg, #F5D576 0%, #D4AF37 55%, #B8962E 100%)',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontSize: 14,
              fontWeight: 500,
              color: loading ? 'rgba(240,236,226,0.45)' : '#09090d',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              transition: 'transform 0.15s, opacity 0.2s',
              boxShadow: loading
                ? 'none'
                : '0 4px 14px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* Switch to login */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(240,236,226,0.38)',
            marginTop: 22,
            marginBottom: 0,
          }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              color: '#D4AF37',
              textDecoration: 'none',
              fontWeight: 500,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.textDecoration = 'none')
            }
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
