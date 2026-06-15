import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'
import PageTransition from '@/components/shared/PageTransition'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profileData?.display_name) {
    redirect('/onboarding')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090d' }}>
      <Sidebar userEmail={user.email!} displayName={profileData?.display_name ?? null} />
      <main
        className="main-protected"
        style={{
          flex: 1,
          minHeight: '100vh',
          padding: '32px 36px',
        }}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}
