export function parsePriceCents(input: string): number {
  const m = input.trim().match(/^\$?(\d+)(?:\.(\d{1,2}))?$/)
  if (!m) throw new Error(`Unparseable price: ${input}`)
  const cents = m[2] ? (m[2] + '0').slice(0, 2) : '00'
  return Number(m[1]) * 100 + Number(cents)
}

export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100)
  const rem = cents % 100
  return rem === 0 ? `$${dollars}` : `$${dollars}.${String(rem).padStart(2, '0')}`
}
