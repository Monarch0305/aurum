export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Account {
  id: string
  user_id: string
  plaid_account_id: string
  name: string
  type: 'savings' | 'credit' | 'investment'
  balance: number
  currency: string
  last_synced: string
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string
  user_id: string
  plaid_transaction_id: string
  date: string
  amount: number
  merchant: string
  category: string
  subcategory: string
  pending: boolean
  created_at: string
}

export interface PlaidItem {
  id: string
  user_id: string
  access_token: string
  item_id: string
  institution_name: string
  created_at: string
}

export type SpendingPeriod = 'week' | 'month' | 'year'

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color?: string
}

export interface AIQueryResult {
  category?: string
  month?: string
  operation?: 'sum' | 'average' | 'count' | 'list'
  timeRange?: { start: string; end: string }
  merchant?: string
}

export interface InsightCard {
  title: string
  description: string
  type: 'info' | 'warning' | 'success'
  value?: string | number
}

export interface TrendInsight {
  /** Card category — drives icon and label in TrendStrip */
  kind: 'spend' | 'savings' | 'projection' | 'anomaly' | 'subscriptions'
  title: string
  description: string
  /** Pre-formatted value string shown in the pill */
  value: string
  /** true = good (green), false = bad (red); 'subscriptions' kind ignores this and stays gold */
  positive: boolean
}
