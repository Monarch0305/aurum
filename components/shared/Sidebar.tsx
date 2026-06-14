'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Wallet,
  Bot,
  Settings,
  LogOut,
  Coins,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Analytics',    href: '/analytics',    icon: BarChart2 },
  { label: 'Accounts',     href: '/accounts',     icon: Wallet },
  { label: 'AI Copilot',   href: '/copilot',      icon: Bot },
  { label: 'Settings',     href: '/settings',     icon: Settings },
]

interface SidebarProps {
  userEmail: string
  displayName?: string | null
}

export default function Sidebar({ userEmail, displayName }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const displayLabel = displayName || userEmail
  const userInitial = displayLabel[0].toUpperCase()

  const [isMobile,    setIsMobile]   = useState(false)
  const [mobileOpen,  setMobileOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Clear pending highlight once the URL actually settles on the new route
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* SVG gradient defs — referenced by active icon strokes */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="aurum-icon-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F5D576" />
            <stop offset="50%"  stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#9A7B2A" />
          </linearGradient>
        </defs>
      </svg>

      {/* Mobile hamburger button — fixed top-left, only on small screens */}
      {isMobile && (
        <button
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 100,
            width: 36,
            height: 36,
            borderRadius: 9,
            background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
            boxShadow:
              '3px 3px 7px rgba(0,0,0,0.5), -1px -1px 5px rgba(60,55,45,0.12), inset 0 1px 0 rgba(212,175,55,0.15)',
            border: '0.5px solid rgba(212,175,55,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {mobileOpen
            ? <X    size={16} color="#D4AF37" />
            : <Menu size={16} color="#D4AF37" />
          }
        </button>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 55,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          width: 240,
          minWidth: 240,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'rgba(6,6,10,0.98)',
          borderRight: '0.5px solid rgba(212,175,55,0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px 14px',
          zIndex: 60,
          transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Logo — icon3d coin slab + Aurum wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingBottom: 20,
            borderBottom: '0.5px solid rgba(212,175,55,0.07)',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              flexShrink: 0,
              background: 'linear-gradient(145deg, rgba(40,38,35,1), rgba(22,21,19,1))',
              boxShadow:
                '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(60,55,45,0.15), inset 0 1px 0 rgba(212,175,55,0.15)',
              border: '0.5px solid rgba(212,175,55,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Coins
              size={16}
              style={{ stroke: 'url(#aurum-icon-grad) #D4AF37' }}
            />
          </div>
          <span
            style={{
              fontSize: 17,
              fontWeight: 500,
              background: 'linear-gradient(180deg, #F5D576, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.01em',
            }}
          >
            Aurum
          </span>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            paddingTop: 4,
            overflowY: 'auto',
          }}
        >
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              pathname.startsWith(href + '/') ||
              pendingHref === href
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                onClick={() => {
                  if (href !== pathname) setPendingHref(href)
                  if (isMobile) setMobileOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 9px',
                  borderRadius: 9,
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(212,175,55,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {/* 3D icon slab */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    flexShrink: 0,
                    background: isActive
                      ? 'linear-gradient(145deg, rgba(50,45,32,1), rgba(30,27,18,1))'
                      : 'linear-gradient(145deg, rgba(28,26,22,1), rgba(16,15,12,1))',
                    boxShadow: isActive
                      ? '2px 2px 5px rgba(0,0,0,0.5), -1px -1px 3px rgba(60,55,40,0.12), inset 0 1px 0 rgba(212,175,55,0.2)'
                      : '2px 2px 4px rgba(0,0,0,0.4), -1px -1px 3px rgba(40,35,25,0.08), inset 0 1px 0 rgba(212,175,55,0.07)',
                    border: '0.5px solid rgba(212,175,55,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={13}
                    style={
                      isActive
                        ? { stroke: 'url(#aurum-icon-grad) #D4AF37' }
                        : { color: 'rgba(240,236,226,0.38)' }
                    }
                  />
                </div>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#D4AF37' : 'rgba(240,236,226,0.5)',
                    transition: 'color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div
          style={{
            borderTop: '0.5px solid rgba(212,175,55,0.07)',
            paddingTop: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              marginBottom: 10,
              padding: '0 2px',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                flexShrink: 0,
                background:
                  'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))',
                border: '0.5px solid rgba(212,175,55,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                color: '#D4AF37',
              }}
            >
              {userInitial}
            </div>
            <span
              style={{
                fontSize: 12,
                color: 'rgba(240,236,226,0.45)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
              title={displayLabel}
            >
              {displayLabel}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 9px',
              borderRadius: 8,
              background: 'transparent',
              border: '0.5px solid rgba(212,175,55,0.08)',
              cursor: 'pointer',
              color: 'rgba(240,236,226,0.4)',
              fontSize: 13,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background   = 'rgba(229,115,115,0.07)'
              el.style.borderColor  = 'rgba(229,115,115,0.18)'
              el.style.color        = '#e57373'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background   = 'transparent'
              el.style.borderColor  = 'rgba(212,175,55,0.08)'
              el.style.color        = 'rgba(240,236,226,0.4)'
            }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
