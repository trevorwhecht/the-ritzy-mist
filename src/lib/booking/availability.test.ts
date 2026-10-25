import { computeSlots, type Interval } from './availability'

const T = (h: number, m = 0) => new Date(Date.UTC(2026, 8, 15, h, m))
const base = {
  dayOpen: T(9), dayClose: T(17), durationMin: 45, stepMin: 5,
  now: T(0), leadTimeMin: 0,
  appointments: [] as Interval[], busyBlocks: [] as Interval[], bufferMin: 30,
}
const hhmm = (d: Date) => d.toISOString().slice(11, 16)

test('open day: 5-minute steps, last slot ends exactly at close', () => {
  const slots = computeSlots(base)
  expect(hhmm(slots[0])).toBe('09:00')
  expect(hhmm(slots[slots.length - 1])).toBe('16:15')
  expect(slots).toHaveLength(88)
})
test('external event gets a 30-minute buffer AFTER it only', () => {
  const slots = computeSlots({ ...base, busyBlocks: [{ start: T(11), end: T(12) }] }).map(hhmm)
  expect(slots).toContain('10:15')
  expect(slots).not.toContain('10:20')
  expect(slots).not.toContain('12:25')
  expect(slots).toContain('12:30')
})
test('appointments have NO buffer: back-to-back is allowed', () => {
  const slots = computeSlots({ ...base, appointments: [{ start: T(11), end: T(11, 45) }] }).map(hhmm)
  expect(slots).toContain('10:15')
  expect(slots).not.toContain('10:20')
  expect(slots).not.toContain('11:40')
  expect(slots).toContain('11:45')
})
test('lead time pushes the first slot and rounds up to the step', () => {
  const slots = computeSlots({ ...base, now: T(10, 7), leadTimeMin: 120 }).map(hhmm)
  expect(slots[0]).toBe('12:10')
})
test('closed day and all-day block produce no slots', () => {
  expect(computeSlots({ ...base, dayOpen: T(9), dayClose: T(9) })).toHaveLength(0)
  expect(computeSlots({ ...base, busyBlocks: [{ start: T(0), end: T(24) }] })).toHaveLength(0)
})
test('service duration is honored', () => {
  const slots = computeSlots({ ...base, durationMin: 60 }).map(hhmm)
  expect(slots[slots.length - 1]).toBe('16:00')
})
