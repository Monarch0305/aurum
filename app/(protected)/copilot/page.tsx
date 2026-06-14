import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import CopilotPage from '@/components/copilot/CopilotPage'

export const metadata = { title: 'AI Copilot — Aurum' }

// CopilotPage uses useSearchParams → must be wrapped in Suspense
async function CopilotLoader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch transaction count for the header badge
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  return <CopilotPage transactionCount={count ?? 0} />
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CopilotLoader />
    </Suspense>
  )
}
