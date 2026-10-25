import { buildIcs } from './buildIcs'

const ics = buildIcs({
  uid: 'abc',
  start: new Date('2026-09-15T15:00:00Z'),
  end: new Date('2026-09-15T15:45:00Z'),
  summary: 'Spray Tan - Jane D - OG Mist',
  description: 'Occasion: wedding, beach\nPhone: (208) 555-0199',
  location: 'Studio',
})

test('required VEVENT lines in UTC with CRLF', () => {
  expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/)
  expect(ics).toContain('UID:abc\r\n')
  expect(ics).toContain('DTSTART:20260915T150000Z\r\n')
  expect(ics).toContain('DTEND:20260915T154500Z\r\n')
})
test('escapes commas and newlines in text', () => {
  expect(ics).toContain('DESCRIPTION:Occasion: wedding\\, beach\\nPhone: (208) 555-0199')
})
test('folds lines longer than 75 octets', () => {
  const long = buildIcs({ uid: 'x', start: new Date(), end: new Date(), summary: 'a'.repeat(120) })
  const line = long.split('\r\n').find((l) => l.startsWith('SUMMARY:'))!
  expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75)
  expect(long).toContain('\r\n a')
})
test('cancelled sets STATUS and keeps SEQUENCE', () => {
  const c = buildIcs({ uid: 'x', start: new Date(), end: new Date(), summary: 's', cancelled: true, sequence: 2 })
  expect(c).toContain('STATUS:CANCELLED\r\n')
  expect(c).toContain('SEQUENCE:2\r\n')
})

test('escapes semicolons, which RFC 5545 treats as a value separator', () => {
  // Regression: the escape was written '\;', which is not a JS escape sequence and evaluates
  // to a bare ';', so semicolons were emitted raw and split the property value.
  const withSemi = buildIcs({
    uid: 'x',
    start: new Date('2026-09-15T15:00:00Z'),
    end: new Date('2026-09-15T15:45:00Z'),
    summary: 'Spray Tan; bridal party',
    description: 'notes: a, b; c',
  })
  expect(withSemi).toContain('SUMMARY:Spray Tan\\; bridal party')
  expect(withSemi).toContain('DESCRIPTION:notes: a\\, b\\; c')
})
