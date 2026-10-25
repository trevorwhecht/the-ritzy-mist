export type DayHours = { open: string; close: string } | null   // 'HH:mm' in business TZ
export type BusinessHours = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DayHours>

export const SETTING_DEFAULTS = {
  businessHours: {
    0: null,
    1: { open: '09:00', close: '19:00' }, 2: { open: '09:00', close: '19:00' },
    3: { open: '09:00', close: '19:00' }, 4: { open: '09:00', close: '19:00' },
    5: { open: '09:00', close: '19:00' }, 6: { open: '09:00', close: '15:00' },
  } as BusinessHours,
  bookingRules: {
    slotStepMin: 5, externalBufferMin: 30, leadTimeMin: 120, maxAdvanceDays: 60,
    cancelCutoffHours: 24, syncStaleMin: 5, timeZone: 'America/Boise',
  },
  calendars: { blocking: [] as string[], booking: '', lastSyncedAt: null as string | null, lastError: null as string | null },
  insightsCardLayout: [] as string[],
}
export type SettingKey = keyof typeof SETTING_DEFAULTS
export type SettingValue<K extends SettingKey> = (typeof SETTING_DEFAULTS)[K]
