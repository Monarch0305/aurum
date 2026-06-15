import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export const metadata = { title: 'Welcome — Aurum' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  // Already onboarded — skip straight to the app
  if (profile?.display_name) redirect('/dashboard')

  return <OnboardingClient />
}
