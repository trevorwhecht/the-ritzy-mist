// settings.ts imports the Prisma client for getSetting/setSetting. These tests only
// exercise the pure parts, so the client is mocked away — no DATABASE_URL required.
jest.mock('./db', () => ({ __esModule: true, default: {}, prisma: {} }))

import { mergeSetting, settingSchemas } from './settings'

test('mergeSetting fills missing keys from defaults and keeps stored ones', () => {
  const v = mergeSetting('bookingRules', { leadTimeMin: 30 })
  expect(v.leadTimeMin).toBe(30)
  expect(v.slotStepMin).toBe(5)
  expect(v.timeZone).toBe('America/Boise')
})
test('mergeSetting ignores junk', () => {
  expect(mergeSetting('bookingRules', 'nope').leadTimeMin).toBe(120)
  expect(mergeSetting('businessHours', null)[1]).toEqual({ open: '09:00', close: '19:00' })
})
test('schemas reject bad hours and bad steps', () => {
  expect(settingSchemas.businessHours.safeParse({ 0: null, 1: { open: '9', close: '19:00' } }).success).toBe(false)
  expect(settingSchemas.bookingRules.safeParse({ slotStepMin: 0 }).success).toBe(false)
})
