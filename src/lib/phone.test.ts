import { normalizePhone, toPhoneDigits, formatPhoneDisplay } from './phone'

test('normalizePhone accepts 10 digits with any formatting', () => {
  expect(normalizePhone('(208) 555-0199')).toBe('2085550199')
  expect(normalizePhone('+1 208 555 0199')).toBe('2085550199')
})
test('normalizePhone rejects wrong lengths', () => {
  expect(normalizePhone('555-0199')).toBeNull()
  expect(normalizePhone('')).toBeNull()
})
test('toPhoneDigits caps at 10 and drops leading 1', () => {
  expect(toPhoneDigits('12085550199999')).toBe('2085550199')
})
test('formatPhoneDisplay is progressive', () => {
  expect(formatPhoneDisplay('208')).toBe('(208')
  expect(formatPhoneDisplay('2085')).toBe('(208) 5')
  expect(formatPhoneDisplay('2085550199')).toBe('(208) 555-0199')
})
