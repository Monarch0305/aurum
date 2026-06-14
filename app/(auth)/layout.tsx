import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

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
      {/* Ambient gold glows */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          top: '8%',
          left: '12%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.07), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          bottom: '12%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.05), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          top: '55%',
          left: '55%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.04), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </main>
  )
}
