import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('date, merchant, category, subcategory, amount, pending')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = transactions ?? []
  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`

  const lines = [
    'Date,Merchant,Category,Subcategory,Amount,Pending',
    ...rows.map((t) =>
      [
        t.date,
        escape(t.merchant),
        escape(t.category),
        escape(t.subcategory),
        t.amount,
        t.pending ? 'Yes' : 'No',
      ].join(',')
    ),
  ]

  const csv = lines.join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aurum-transactions-${date}.csv"`,
    },
  })
}
