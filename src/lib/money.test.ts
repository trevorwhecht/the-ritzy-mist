import { parsePriceCents, formatCents } from './money'

test('parsePriceCents reads dollar strings from pricingData', () => {
  expect(parsePriceCents('$55')).toBe(5500)
  expect(parsePriceCents('$7.50')).toBe(750)
  expect(parsePriceCents('  $100 ')).toBe(10000)
})
test('parsePriceCents throws on junk', () => {
  expect(() => parsePriceCents('free')).toThrow('Unparseable price')
})
test('formatCents', () => {
  expect(formatCents(5500)).toBe('$55')
  expect(formatCents(750)).toBe('$7.50')
})
