import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/settings/SettingsClient'

export const metadata = { title: 'Settings — Aurum' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, itemsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('plaid_items')
      .select('id, item_id, institution_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  return (
    <SettingsClient
      initialProfile={profileRes.data ?? null}
      plaidItems={itemsRes.data ?? []}
      userEmail={user.email!}
    />
  )
}
