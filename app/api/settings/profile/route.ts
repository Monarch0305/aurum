import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { display_name, preferences, notifications, date_of_birth, city, country } = body

  const admin = createAdminClient()
  const update: Record<string, unknown> = { user_id: user.id }

  if (display_name !== undefined) {
    if (display_name !== null) {
      const { data: existing } = await admin
        .from('profiles')
        .select('user_id')
        .eq('display_name', display_name)
        .neq('user_id', user.id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
      }
    }
    update.display_name = display_name
  }

  if (preferences !== undefined) update.preferences = preferences
  if (notifications !== undefined) update.notifications = notifications
  if (date_of_birth !== undefined) update.date_of_birth = date_of_birth
  if (city !== undefined) update.city = city
  if (country !== undefined) update.country = country

  const { error } = await admin
    .from('profiles')
    .upsert(update, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
