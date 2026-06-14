/**
 * Central currency / number formatters — ₹ (Indian Rupee) throughout the app.
 * Import from here; never hard-code '$' in a component.
 */

/** ₹12,840.55 */
export function fmtCurrency(amount: number, decimals = 2): string {
  return (
    '₹' +
    Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

/** ₹1k / ₹2.4k / ₹1M — compact form for chart Y-axes */
export function fmtCurrencyCompact(v: number): string {
  if (v === 0) return '₹0'
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}k`
  return `₹${v}`
}

/**
 * Transaction display amount (Plaid sign convention: positive = expense, negative = income).
 * Returns { str: "−₹42.50", isExpense: true }
 */
export function fmtTxnAmount(plaidAmount: number, decimals = 2) {
  const abs = Math.abs(plaidAmount)
  const isExpense = plaidAmount > 0
  const str =
    (isExpense ? '−' : '+') +
    '₹' +
    abs.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  return { str, isExpense }
}
