import { z } from 'zod'
import prisma from './db'
import { SETTING_DEFAULTS, type SettingKey, type SettingValue } from './settingsDefaults'

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')
const dayHours = z.object({ open: hhmm, close: hhmm }).nullable()

export const settingSchemas = {
  businessHours: z.object({ 0: dayHours, 1: dayHours, 2: dayHours, 3: dayHours, 4: dayHours, 5: dayHours, 6: dayHours }),
  bookingRules: z.object({
    slotStepMin: z.number().int().min(1).max(60),
    externalBufferMin: z.number().int().min(0).max(240),
    leadTimeMin: z.number().int().min(0),
    maxAdvanceDays: z.number().int().min(1).max(365),
    cancelCutoffHours: z.number().int().min(0),
    syncStaleMin: z.number().int().min(1),
    timeZone: z.string().min(1),
  }).partial(),
  calendars: z.object({
    blocking: z.array(z.string()),
    booking: z.string(),
    lastSyncedAt: z.string().nullable(),
    lastError: z.string().nullable(),
  }).partial(),
  insightsCardLayout: z.array(z.string()),
} satisfies Record<SettingKey, z.ZodTypeAny>

/** Pure: stored JSON (possibly partial or invalid) → a complete value backed by defaults. */
export function mergeSetting<K extends SettingKey>(key: K, stored: unknown): SettingValue<K> {
  const def = SETTING_DEFAULTS[key]
  if (Array.isArray(def)) return (Array.isArray(stored) ? stored : def) as SettingValue<K>
  if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) return def
  return { ...(def as object), ...(stored as object) } as SettingValue<K>
}

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return mergeSetting(key, row?.value)
}

export async function setSetting<K extends SettingKey>(key: K, value: Partial<SettingValue<K>>): Promise<void> {
  const current = await getSetting(key)
  const merged = mergeSetting(key, { ...(current as object), ...(value as object) })
  await prisma.setting.upsert({ where: { key }, update: { value: merged as object }, create: { key, value: merged as object } })
}
