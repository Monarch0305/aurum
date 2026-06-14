import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Delete all user data in dependency order
  await admin.from('transactions').delete().eq('user_id', user.id)
  await admin.from('accounts').delete().eq('user_id', user.id)
  await admin.from('plaid_items').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('user_id', user.id)

  // Delete the auth user (requires service role)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[delete-account] auth.admin.deleteUser:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
