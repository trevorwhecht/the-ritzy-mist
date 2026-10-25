/**
 * Normalize a US phone number to a bare 10-digit string.
 * Accepts any formatting; strips a leading 1 country code.
 * Returns null when the input is not a valid 10-digit US number.
 *
 * Phone is contact info plus a guest-matching heuristic: NOT unique on User;
 * email is the identifier.
 */
export function normalizePhone(input: string): string | null {
  const digits = (input || '').replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return null
}

/**
 * Reduce any typed or pasted input to at most 10 US digits.
 * Drops a leading 1 so pasting "+1 (619) 886-0235" works.
 */
export function toPhoneDigits(input: string): string {
  let digits = (input || '').replace(/\D/g, '')
  if (digits.length > 10 && digits.startsWith('1')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/**
 * Progressive display format for a phone field:
 * 555 -> "(555", 5551 -> "(555) 1", 5551234567 -> "(555) 123-4567".
 * Input may be raw or already formatted; only the digits are used.
 */
export function formatPhoneDisplay(input: string): string {
  const d = toPhoneDigits(input)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
