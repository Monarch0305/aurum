import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090d',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold ambient glows */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          top: '5%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          bottom: '8%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 260,
          height: 260,
          top: '52%',
          left: '60%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.04), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </main>
  )
}
