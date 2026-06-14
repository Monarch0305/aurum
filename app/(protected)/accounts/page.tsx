import { createClient } from '@/lib/supabase/server'
import type { Account } from '@/types'
import AccountsClient from '@/components/accounts/AccountsClient'
import type { AccountCardProps } from '@/components/accounts/AccountCard'

export const metadata = { title: 'Accounts — Aurum' }

// ─── enrichment helpers (deterministic, never random) ─────────────────────────

/** Stable numeric seed from any string — used for all fake derivations */
function seed(s: string): number {
  return s.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0x7fffffff, 0)
}

/** Last-4 display mask — deterministic 4-digit code from account id */
function getLast4(account: Account): string {
  // Use the tail of plaid_account_id if it has digits, else derive from seed
  const tail = account.plaid_account_id.slice(-4)
  return /^\d+$/.test(tail) ? tail : String(seed(account.id) % 10000).padStart(4, '0')
}

const APY_TABLE = [3.25, 3.75, 4.00, 4.50, 5.00, 5.25, 5.50, 6.00, 6.50, 7.00]

function enrichAccount(
  account: Account,
  institutionName: string
): Omit<AccountCardProps, 'accentSide' | 'animDelay'> {
  const base = {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    lastSynced: account.last_synced ?? null,
    last4: getLast4(account),
    institutionName,
  }

  if (account.type === 'credit') {
    // Derive a plausible credit limit — assume balance is ~28-35% utilization
    const rawLimit = account.balance > 0
      ? Math.ceil((account.balance / 0.30) / 500) * 500
      : 5000 + (seed(account.id) % 10) * 1000
    return { ...base, creditLimit: rawLimit }
  }

  if (account.type === 'investment') {
    const apy = APY_TABLE[seed(account.id) % APY_TABLE.length]
    // Maturity = 2 years from account creation
    const created = new Date(account.created_at)
    const maturity = new Date(created)
    maturity.setFullYear(maturity.getFullYear() + 2)
    const maturityDate = maturity.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
    // Interest earned = balance - principal (working back from compound interest)
    const elapsedYears =
      (Date.now() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    const principal = account.balance / Math.pow(1 + apy / 100, elapsedYears)
    const interestEarned = Math.max(0, account.balance - principal)

    return { ...base, apy, maturityDate, interestEarned }
  }

  return base
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch accounts + plaid_items in parallel
  const [accountsRes, itemsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true }),

    supabase
      .from('plaid_items')
      .select('item_id, institution_name')
      .eq('user_id', user!.id),
  ])

  const accounts = (accountsRes.data ?? []) as Account[]
  // Build a quick institution name lookup (best-effort — no direct FK in schema)
  const institutions = (itemsRes.data ?? [])
  const defaultInstitution =
    institutions.length > 0 ? institutions[0].institution_name : 'My Bank'

  // Enrich each account with derived display fields
  const enriched = accounts.map((account) =>
    enrichAccount(account, defaultInstitution)
  )

  const totalBalance = accounts
    .filter((a) => a.type !== 'credit')
    .reduce((s, a) => s + (a.balance ?? 0), 0)

  return (
    <AccountsClient
      accounts={enriched}
      totalBalance={totalBalance}
      accountCount={accounts.length}
    />
  )
}
