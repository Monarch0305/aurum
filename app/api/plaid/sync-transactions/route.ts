import { NextResponse } from 'next/server'
import { type AccountType } from 'plaid'
import { plaidClient } from '@/lib/plaid/client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function mapAccountType(plaidType: AccountType): 'savings' | 'credit' | 'investment' {
  if (plaidType === 'credit') return 'credit'
  if (plaidType === 'investment') return 'investment'
  return 'savings'
}

export async function POST() {
  try {
    // Auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // All Plaid items for this user
    const { data: items, error: itemsError } = await admin
      .from('plaid_items')
      .select('access_token, item_id, institution_name')
      .eq('user_id', user.id)

    if (itemsError) {
      console.error('[sync-transactions] items fetch:', itemsError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
    if (!items?.length) {
      return NextResponse.json({ error: 'No connected accounts' }, { status: 400 })
    }

    let totalSynced = 0

    const realItems = items.filter(
      (i) => !i.item_id.startsWith('seed-') && !i.access_token.includes('seed')
    )

    if (!realItems.length) {
      return NextResponse.json({ success: true, totalSynced: 0, note: 'No real Plaid items to sync' })
    }

    for (const item of realItems) {
      // Diagnostic: check what token is actually in the DB
      console.log('[sync] access_token prefix:', (item.access_token as string)?.slice(0, 20))

      try {
        // ── 1. Fetch all transactions via transactionsSync (cursor-based) ─────────
        // Starting without a cursor returns the full transaction history.
        // transactionsSync is the recommended API and works immediately in sandbox.
        type SyncTxn = Awaited<
          ReturnType<typeof plaidClient.transactionsSync>
        >['data']['added'][number]

        type SyncAccount = Awaited<
          ReturnType<typeof plaidClient.transactionsSync>
        >['data']['accounts'][number]

        const plaidTxns: SyncTxn[] = []
        let plaidAccounts: SyncAccount[] = []
        let cursor: string | undefined = undefined
        let hasMore = true

        while (hasMore) {
          const res = await plaidClient.transactionsSync({
            access_token: item.access_token,
            ...(cursor ? { cursor } : {}),
            count: 500,
          })

          // Accounts are returned on every page — only capture them once
          if (!cursor) plaidAccounts = res.data.accounts

          // added = new transactions; modified = updated transactions (treat same way)
          plaidTxns.push(...res.data.added, ...res.data.modified)

          cursor  = res.data.next_cursor
          hasMore = res.data.has_more
        }

        // ── 2. Upsert accounts (balance + last_synced) ──────────────────────────
        if (plaidAccounts.length > 0) {
          const { error: acctErr } = await admin.from('accounts').upsert(
            plaidAccounts.map((acc) => ({
              user_id: user.id,
              plaid_account_id: acc.account_id,
              name: acc.name,
              type: mapAccountType(acc.type),
              balance: acc.balances.current ?? 0,
              currency: acc.balances.iso_currency_code ?? 'INR',
              last_synced: new Date().toISOString(),
            })),
            { onConflict: 'plaid_account_id' }
          )
          if (acctErr) console.error('[sync-transactions] accounts upsert:', acctErr)
        }

        // ── 3. Build plaid_account_id → our UUID map ────────────────────────────
        const { data: dbAccounts } = await admin
          .from('accounts')
          .select('id, plaid_account_id')
          .eq('user_id', user.id)

        const accountMap = new Map(
          (dbAccounts ?? []).map((a) => [a.plaid_account_id as string, a.id as string])
        )

        // ── 4. Upsert transactions ───────────────────────────────────────────────
        const rows = plaidTxns.flatMap((tx) => {
          const accountId = accountMap.get(tx.account_id)
          if (!accountId) return []
          return [
            {
              account_id: accountId,
              user_id: user.id,
              plaid_transaction_id: tx.transaction_id,
              date: tx.date,
              amount: tx.amount,
              merchant: tx.merchant_name ?? tx.name,
              category: tx.personal_finance_category?.primary ?? tx.category?.[0] ?? 'Other',
              subcategory: tx.personal_finance_category?.detailed ?? tx.category?.[1] ?? '',
              pending: tx.pending,
            },
          ]
        })

        if (rows.length > 0) {
          const BATCH = 1000
          for (let i = 0; i < rows.length; i += BATCH) {
            const { error: txErr } = await admin.from('transactions').upsert(
              rows.slice(i, i + BATCH),
              { onConflict: 'plaid_transaction_id' }
            )
            if (txErr) console.error('[sync-transactions] tx upsert:', txErr)
          }
        }

        totalSynced += rows.length
      } catch (itemErr: unknown) {
        // Log the full error so we can see what Plaid is actually saying
        if (itemErr && typeof itemErr === 'object' && 'response' in itemErr) {
          const plaidErr = itemErr as { response?: { data?: unknown } }
          console.error('[sync-transactions] Plaid error body:', JSON.stringify(plaidErr.response?.data, null, 2))
        }
        console.error('[sync-transactions] item error:', itemErr)
      }
    }

    return NextResponse.json({ success: true, totalSynced })
  } catch (err) {
    console.error('[sync-transactions]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
