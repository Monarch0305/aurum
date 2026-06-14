import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { item_id } = body
  if (!item_id || typeof item_id !== 'string') {
    return NextResponse.json({ error: 'Missing item_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Confirm the item belongs to this user
  const { data: item, error: findErr } = await admin
    .from('plaid_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', item_id)
    .single()

  if (findErr || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Delete transactions → accounts → plaid_item in order.
  // The accounts table has no item_id FK, so we cascade by user_id.
  // In a multi-institution setup you would call Plaid accountsGet first to
  // find which plaid_account_ids belong to this item before scoping deletes.
  const { error: txErr } = await admin
    .from('transactions')
    .delete()
    .eq('user_id', user.id)

  if (txErr) {
    console.error('[disconnect] transactions delete:', txErr)
    return NextResponse.json({ error: 'Failed to remove transactions' }, { status: 500 })
  }

  const { error: acctErr } = await admin
    .from('accounts')
    .delete()
    .eq('user_id', user.id)

  if (acctErr) {
    console.error('[disconnect] accounts delete:', acctErr)
    return NextResponse.json({ error: 'Failed to remove accounts' }, { status: 500 })
  }

  const { error: itemErr } = await admin
    .from('plaid_items')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', item_id)

  if (itemErr) {
    console.error('[disconnect] plaid_items delete:', itemErr)
    return NextResponse.json({ error: 'Failed to remove bank connection' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
