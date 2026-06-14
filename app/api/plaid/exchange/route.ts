import { NextRequest, NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid/client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ExchangeBody {
  public_token: string
  institution_name: string
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const body: ExchangeBody = await request.json()
    const { public_token, institution_name } = body

    if (!public_token || typeof public_token !== 'string') {
      return NextResponse.json({ error: 'Missing public_token' }, { status: 400 })
    }

    // Exchange public_token → access_token + item_id
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })
    const { access_token, item_id } = exchangeResponse.data

    // Diagnostic: confirm what's being stored (access token should start with "access-sandbox-")
    console.log('[exchange] storing item_id:', item_id)
    console.log('[exchange] access_token prefix:', access_token?.slice(0, 20))

    // Persist to plaid_items via the admin client so the INSERT always
    // succeeds regardless of RLS misconfiguration on the service layer.
    // On conflict (user re-links the same institution) update the token.
    const admin = createAdminClient()
    const { error: dbError } = await admin.from('plaid_items').upsert(
      {
        user_id: user.id,
        access_token,
        item_id,
        institution_name: institution_name || 'Unknown Bank',
      },
      { onConflict: 'item_id' }
    )

    if (dbError) {
      console.error('[exchange] DB upsert failed:', dbError)
      return NextResponse.json(
        { error: 'Failed to save connection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, item_id })
  } catch (err) {
    console.error('[exchange]', err)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
