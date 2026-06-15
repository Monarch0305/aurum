'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { GoldSelect, type GoldSelectOption } from '@/components/ui/gold-select'

// ── Country / city data ───────────────────────────────────────────────────────

const CITY_MAP: Record<string, string[]> = {
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata',
       'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Nagpur', 'Surat', 'Kochi'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
       'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Seattle', 'Denver', 'Boston'],
  GB: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Edinburgh',
       'Leeds', 'Sheffield', 'Bristol', 'Cardiff', 'Belfast', 'Nottingham'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton',
       'Winnipeg', 'Quebec City', 'Halifax', 'Victoria'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast',
       'Canberra', 'Hobart', 'Darwin'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
  SG: ['Singapore'],
  DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart',
       'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'],
  FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes',
       'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  JP: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka',
       'Kyoto', 'Kobe', 'Sendai', 'Hiroshima'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
       'Curitiba', 'Manaus', 'Recife', 'Porto Alegre'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla',
       'Tijuana', 'León', 'Juárez', 'Mérida'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
       'Bloemfontein', 'East London', 'Polokwane'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven',
       'Tilburg', 'Groningen', 'Breda'],
  SE: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping',
       'Västerås', 'Örebro', 'Helsingborg'],
  CH: ['Zürich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne'],
  KR: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon'],
  CN: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou',
       'Wuhan', 'Xi\'an', 'Nanjing', 'Chongqing'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Zaragoza'],
}

const COUNTRIES: GoldSelectOption[] = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SG', label: 'Singapore' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
]

// ── Styles ────────────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  color: 'rgba(212,175,55,0.6)',
  marginBottom: 7,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(212,175,55,0.16)',
  borderRadius: 10,
  padding: '11px 14px',
  color: '#f0ece2',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingClient() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('IN')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cityOptions: GoldSelectOption[] = (CITY_MAP[country] ?? []).map((c) => ({
    value: c,
    label: c,
  }))

  const handleCountryChange = (val: string) => {
    setCountry(val)
    setCity('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }
    if (!city) {
      setError('Please select a city.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName.trim(),
        date_of_birth: dob || null,
        city,
        country,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error ?? 'Something went wrong.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  // Stagger helpers
  const field = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const, delay },
  })

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 500,
        padding: '0 16px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(212,175,55,0.1)',
          borderTop: '1.5px solid rgba(212,175,55,0.3)',
          borderRadius: 16,
          padding: '40px 40px 36px',
          backdropFilter: 'blur(4px)',
          boxShadow:
            '0 24px 64px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(212,175,55,0.05) inset',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
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
            <Coins size={20} color="#D4AF37" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 500,
              margin: 0,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(180deg, #F5D576 0%, #D4AF37 60%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome to Aurum
          </h1>
        </div>

        <p
          style={{
            fontSize: 13,
            color: 'rgba(240,236,226,0.45)',
            margin: '0 0 24px 56px',
          }}
        >
          Let&apos;s set up your profile
        </p>

        <div
          style={{
            height: '0.5px',
            background:
              'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)',
            marginBottom: 24,
          }}
        />

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Display name */}
          <motion.div {...field(0.1)}>
            <label style={LABEL}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="e.g. Viraj"
              className="aurum-input"
              style={INPUT}
            />
          </motion.div>

          {/* Date of birth */}
          <motion.div {...field(0.18)}>
            <label style={LABEL}>Date of birth <span style={{ color: 'rgba(240,236,226,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="aurum-input"
              style={{ ...INPUT, colorScheme: 'dark' }}
            />
          </motion.div>

          {/* Country */}
          <motion.div {...field(0.26)}>
            <label style={LABEL}>Country</label>
            <GoldSelect
              value={country}
              onChange={handleCountryChange}
              options={COUNTRIES}
              placeholder="Select country"
            />
          </motion.div>

          {/* City */}
          <motion.div {...field(0.34)}>
            <label style={LABEL}>City</label>
            <GoldSelect
              value={city}
              onChange={setCity}
              options={cityOptions}
              placeholder={cityOptions.length ? 'Select city' : 'Select a country first'}
            />
          </motion.div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
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
              {error}
            </div>
          )}

          {/* Submit */}
          <motion.div {...field(0.42)}>
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
              {loading ? 'Setting up…' : 'Complete Setup'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
