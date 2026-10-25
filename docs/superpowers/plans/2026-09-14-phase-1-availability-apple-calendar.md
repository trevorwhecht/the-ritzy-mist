# Phase 1 — Availability Engine + Apple Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute bookable 5-minute slots for 45-minute appointments from business hours, existing appointments (no buffer), and Apple Calendar events (+30 min buffer), and push an appointment into an iCloud calendar.

**Architecture:** A pure `computeSlots` function (tested) fed by a server loader. iCloud is read over CalDAV (`tsdav`), parsed with the iCal parser ported from onewitharts (`src/lib/employeeCalendar.ts`), expanded into `ExternalBusyBlock` rows that refresh lazily when older than 5 minutes. Writes go to a dedicated booking calendar that is never in the blocking list.

**Tech Stack:** `tsdav`, `date-fns`, `date-fns-tz`, Prisma, zod, jest.

**Spec:** `docs/superpowers/specs/2026-09-14-booking-platform-design.md` §4, §5, §12.

> **STATUS 2026-09-15 — Tasks 1, 2, 4 done; Task 8 partly done.** Implemented and green:
> typed settings (+ admin route), the pure availability engine, the iCal parser with recurrence
> expansion, and the ICS builder. `npx jest` is 11 suites / 52 tests passing, `npx tsc --noEmit`
> is clean, `next build` compiles, and new code is lint-clean.
> Still blocked: Task 3 (iCloud spike), Task 5 (CalDAV client), Task 6 (busy-block sync),
> Task 7 (slot loader + availability API) and `mirror.ts` — those need iCloud credentials
> and/or a live database. Nothing is committed.

## Global Constraints

- Same as Phase 0: the agent never runs `git add`/`commit`/`push`; `npm run build` and `npm test` green at the end of every task; `lib/` and `services/` never import `next/*`.
- Business time zone from settings (`America/Boise`); all stored instants are UTC.
- Rules: `slotStepMin=5`; `durationMin` from the Service (default 45); `externalBufferMin=30` **after external events only**; no buffer after appointments; all-day external events block the whole day (decision D); `TRANSP:TRANSPARENT` and `STATUS:CANCELLED` events ignored.
- Decision B assumed: CalDAV with `ICLOUD_APPLE_ID` + `ICLOUD_APP_PASSWORD`.
- Depends on Phase 0: `prisma` (`Appointment`, `ExternalBusyBlock`, `Setting`), `SETTING_DEFAULTS`, `requireAdmin`, `generatePublicToken`, `formatPhoneDisplay`.

---

### Task 1: Typed settings

**Files:**
- Create: `src/lib/settings.ts`, `src/lib/settings.test.ts`, `src/app/api/admin/settings/route.ts`

**Interfaces:**
- Consumes: `SETTING_DEFAULTS`, `SettingKey`, `SettingValue` from `@/lib/settingsDefaults` (Phase 0 Task 2); `requireAdmin` from `@/lib/auth`.
- Produces: `mergeSetting<K>(key: K, stored: unknown): SettingValue<K>` (pure), `getSetting<K>(key): Promise<SettingValue<K>>`, `setSetting<K>(key, partial): Promise<void>`, `settingSchemas: Record<SettingKey, ZodTypeAny>`; `GET /api/admin/settings` → all keys merged; `PUT /api/admin/settings` `{ key, value }` → validated and saved.

- [ ] **Step 1: Write the failing test** — `src/lib/settings.test.ts`

```ts
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
```

- [ ] **Step 2: Run it to make sure it fails** — `npx jest src/lib/settings` → FAIL, "Cannot find module './settings'".

- [ ] **Step 3: Implement** — `src/lib/settings.ts`

```ts
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
```

- [ ] **Step 4: Run the tests and make sure they pass** — `npx jest src/lib/settings` → 3 passed.

- [ ] **Step 5: Admin settings route** — `src/app/api/admin/settings/route.ts`

```ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getSetting, setSetting, settingSchemas } from '@/lib/settings'
import { SETTING_DEFAULTS, type SettingKey } from '@/lib/settingsDefaults'

export const dynamic = 'force-dynamic'
const KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[]

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const entries = await Promise.all(KEYS.map(async (k) => [k, await getSetting(k)] as const))
  return NextResponse.json(Object.fromEntries(entries))
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const key = body?.key as SettingKey
  if (!KEYS.includes(key)) return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 })
  const parsed = settingSchemas[key].safeParse(body.value)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  await setSetting(key, parsed.data as never)
  return NextResponse.json({ [key]: await getSetting(key) })
}
```

- [ ] **Step 6: Verify** — `npm test` green, `npm run build` green. With `npm run dev` and an admin session, `GET /api/admin/settings` returns the four keys; logged out it returns 401.

- [ ] **Step 7: Ready to commit** — suggested message: `feat: typed settings with defaults and admin API`

---

### Task 2: Pure availability engine

**Files:**
- Create: `src/lib/booking/availability.ts`, `src/lib/booking/availability.test.ts`

**Interfaces:**
- Consumes: nothing (pure module, no imports).
- Produces:
```ts
export interface Interval { start: Date; end: Date }   // half-open [start, end)
export interface ComputeSlotsInput {
  dayOpen: Date; dayClose: Date; durationMin: number; stepMin: number
  now: Date; leadTimeMin: number
  appointments: Interval[]                      // BOOKED only; no buffer
  busyBlocks: Interval[]; bufferMin: number     // external; buffer appended after each
}
export function computeSlots(input: ComputeSlotsInput): Date[]
export function overlaps(aStart: number, aEnd: number, b: Interval): boolean
```

- [ ] **Step 1: Write the failing test** — `src/lib/booking/availability.test.ts`

```ts
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
```

- [ ] **Step 2: Run it to make sure it fails** — `npx jest src/lib/booking/availability` → FAIL.

- [ ] **Step 3: Write the implementation** — `src/lib/booking/availability.ts`

```ts
export interface Interval { start: Date; end: Date }

export interface ComputeSlotsInput {
  dayOpen: Date
  dayClose: Date
  durationMin: number
  stepMin: number
  now: Date
  leadTimeMin: number
  /** BOOKED appointments. No buffer after a spray tan. */
  appointments: Interval[]
  /** External calendar events. bufferMin is appended after each. */
  busyBlocks: Interval[]
  bufferMin: number
}

const MIN = 60_000

/** Half-open overlap: [aStart, aEnd) intersects [b.start, b.end). */
export function overlaps(aStart: number, aEnd: number, b: Interval): boolean {
  return aStart < b.end.getTime() && b.start.getTime() < aEnd
}

export function computeSlots(i: ComputeSlotsInput): Date[] {
  const dur = i.durationMin * MIN
  const step = i.stepMin * MIN
  const open = i.dayOpen.getTime()
  const close = i.dayClose.getTime()
  const earliest = Math.max(open, i.now.getTime() + i.leadTimeMin * MIN)
  const first = open + Math.ceil((earliest - open) / step) * step
  const blocks: Interval[] = [
    ...i.appointments,
    ...i.busyBlocks.map((b) => ({ start: b.start, end: new Date(b.end.getTime() + i.bufferMin * MIN) })),
  ]
  const out: Date[] = []
  for (let t = first; t + dur <= close; t += step) {
    if (!blocks.some((b) => overlaps(t, t + dur, b))) out.push(new Date(t))
  }
  return out
}
```

- [ ] **Step 4: Run the tests and make sure they pass** — `npx jest src/lib/booking/availability` → 6 passed. (09:00 to 16:15 is 435 minutes over a 5-minute step: 87 steps, 88 slots.)

- [ ] **Step 5: Ready to commit** — `feat: pure availability engine with tests`

---

### Task 3: iCloud CalDAV spike (throwaway, half a day maximum)

**Files:**
- Create then delete: `scripts/icloud-spike.ts`
- Modify: the spec's §5.4 paragraph, with the findings

- [ ] **Step 1: Install and configure** — `npm install tsdav && npm install -D dotenv`. Add `ICLOUD_APPLE_ID` and `ICLOUD_APP_PASSWORD` to `.env` (app-specific password from appleid.apple.com, Sign-In and Security, App-Specific Passwords).

- [ ] **Step 2: Write the probe** — `scripts/icloud-spike.ts`

```ts
import 'dotenv/config'
import { DAVClient } from 'tsdav'

async function main() {
  const client = new DAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: { username: process.env.ICLOUD_APPLE_ID!, password: process.env.ICLOUD_APP_PASSWORD! },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  await client.login()
  const calendars = await client.fetchCalendars()
  console.log('calendars:', calendars.map((c) => ({ name: c.displayName, url: c.url })))
  const start = new Date()
  const end = new Date(Date.now() + 7 * 86_400_000)
  for (const cal of calendars.slice(0, 3)) {
    const objs = await client.fetchCalendarObjects({
      calendar: cal,
      timeRange: { start: start.toISOString(), end: end.toISOString() },
      expand: true,
    })
    console.log(cal.displayName, 'objects:', objs.length)
    for (const o of objs.slice(0, 3)) {
      console.log(o.data?.split('\n').filter((l: string) => /^(UID|SUMMARY|DTSTART|DTEND|RRULE|RECURRENCE-ID|TRANSP|STATUS)/.test(l)).join(' | '))
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 3: Run and record** — `npx tsx scripts/icloud-spike.ts`. Answer three questions in the spec's §5.4 paragraph: (a) does login succeed with the app-specific password; (b) does `expand: true` return individual instances (several objects sharing a UID, carrying `RECURRENCE-ID`) or only masters carrying `RRULE`; (c) do `TRANSP` and `STATUS` lines appear. Task 4's expander is built either way, so a "masters only" answer changes nothing structurally.

- [ ] **Step 4: Delete the probe** — `rm scripts/icloud-spike.ts`. The only lasting change is the spec edit.

- [ ] **Step 5: Ready to commit** — `docs: record iCloud CalDAV spike findings`

---

### Task 4: iCal parser and recurrence expansion (ported)

**Files:**
- Create: `src/lib/appleCalendar/ical.ts`, `src/lib/appleCalendar/ical.test.ts`
- Read to port from: `/Users/trevorhecht/Developer/repos/onewitharts/src/lib/employeeCalendar.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces:
```ts
export interface ParsedDateTime { utcMs: number; year: number; month: number; day: number; hour: number; minute: number; second: number; tzid?: string; isDateOnly: boolean }
export interface RawVEvent { uid?: string; title?: string; status?: string; transp?: string; sequence?: number; lastModified?: string; start?: ParsedDateTime; end?: ParsedDateTime; rrule?: string; exdates: number[]; recurrenceId?: number }
export interface BusyInterval { uid: string; summary: string | null; start: Date; end: Date; isAllDay: boolean }
export function parseICal(ics: string): RawVEvent[]
export function occurrenceStarts(master: RawVEvent, rangeStartMs: number, rangeEndMs: number): number[]
export function expandBusyIntervals(events: RawVEvent[], rangeStart: Date, rangeEnd: Date): BusyInterval[]
```

- [ ] **Step 1: Write the failing test** — `src/lib/appleCalendar/ical.test.ts`

```ts
import { parseICal, expandBusyIntervals } from './ical'

const wrap = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR\r\n`
const ev = (fields: string) => `BEGIN:VEVENT\r\n${fields}\r\nEND:VEVENT`
const R = [new Date('2026-09-14T00:00:00Z'), new Date('2026-09-21T00:00:00Z')] as const

test('single timed event', () => {
  const evs = parseICal(wrap(ev('UID:a\r\nSUMMARY:Dentist\r\nDTSTART:20260915T170000Z\r\nDTEND:20260915T180000Z')))
  expect(expandBusyIntervals(evs, ...R)).toEqual([
    { uid: 'a', summary: 'Dentist', start: new Date('2026-09-15T17:00:00Z'), end: new Date('2026-09-15T18:00:00Z'), isAllDay: false },
  ])
})
test('TZID is converted with real DST rules', () => {
  const evs = parseICal(wrap(ev('UID:b\r\nDTSTART;TZID=America/Boise:20260915T090000\r\nDTEND;TZID=America/Boise:20260915T100000')))
  expect(expandBusyIntervals(evs, ...R)[0].start.toISOString()).toBe('2026-09-15T15:00:00.000Z')
})
test('weekly RRULE expands, EXDATE removes, RECURRENCE-ID overrides', () => {
  const ics = wrap([
    ev('UID:c\r\nSUMMARY:Gym\r\nDTSTART:20260901T120000Z\r\nDTEND:20260901T130000Z\r\nRRULE:FREQ=WEEKLY;BYDAY=TU,TH\r\nEXDATE:20260917T120000Z'),
    ev('UID:c\r\nRECURRENCE-ID:20260915T120000Z\r\nSUMMARY:Gym (moved)\r\nDTSTART:20260915T140000Z\r\nDTEND:20260915T150000Z'),
  ].join('\r\n'))
  expect(expandBusyIntervals(parseICal(ics), ...R).map((b) => b.start.toISOString())).toEqual(['2026-09-15T14:00:00.000Z'])
})
test('all-day events are flagged', () => {
  const out = expandBusyIntervals(parseICal(wrap(ev('UID:d\r\nDTSTART;VALUE=DATE:20260916\r\nDTEND;VALUE=DATE:20260917'))), ...R)
  expect(out[0].isAllDay).toBe(true)
})
test('TRANSPARENT and CANCELLED events are ignored', () => {
  const ics = wrap([
    ev('UID:e\r\nDTSTART:20260915T170000Z\r\nDTEND:20260915T180000Z\r\nTRANSP:TRANSPARENT'),
    ev('UID:f\r\nDTSTART:20260915T170000Z\r\nDTEND:20260915T180000Z\r\nSTATUS:CANCELLED'),
  ].join('\r\n'))
  expect(expandBusyIntervals(parseICal(ics), ...R)).toHaveLength(0)
})
test('folded lines and escaped text are unfolded', () => {
  const evs = parseICal(wrap(ev('UID:g\r\nSUMMARY:Hair\\, nails\r\n  and more\r\nDTSTART:20260915T170000Z\r\nDTEND:20260915T180000Z')))
  expect(evs[0].title).toBe('Hair, nails and more')
})
```

- [ ] **Step 2: Run it to make sure it fails** — `npx jest src/lib/appleCalendar/ical` → FAIL.

- [ ] **Step 3: Port the parser** — copy into `src/lib/appleCalendar/ical.ts` from `onewitharts/src/lib/employeeCalendar.ts`:
  - `ParsedDateTime` and `RawVEvent` interfaces (around L51 to L79). Add `transp?: string` to `RawVEvent`.
  - `parseICalCalendar` (L394 to L458), renamed `parseICal`, returning `RawVEvent[]` instead of `{ events }`. Immediately after the `statusMatch` block add:
    ```ts
    const transpMatch = block.match(/TRANSP[;:]([^\r\n]+)/i)
    if (transpMatch) event.transp = transpMatch[1].trim().toUpperCase()
    ```
  - `parseICalDateTime` (from L465), plus the helpers it uses: `unescapeICalText` and the RRULE field parser that ends at L391.
  - `getTimezoneOffsetMs` from `onewitharts/src/lib/insightsDateRange.ts` (copy just that function; it is what makes TZID conversion DST-aware).

- [ ] **Step 4: Write `occurrenceStarts`** — extract OWA's RRULE stepping loop (inside `summarizeShiftsInRange`, L167 to L232) into a standalone exported function in `ical.ts`:

```ts
/**
 * Original-occurrence start instants (UTC ms) for a master event inside [rangeStartMs, rangeEndMs).
 * Steps wall-clock components in the event's own timezone so DST shifts do not drift the time of day.
 * Supports FREQ=DAILY|WEEKLY(+BYDAY)|MONTHLY|YEARLY with INTERVAL, UNTIL and COUNT.
 */
export function occurrenceStarts(master: RawVEvent, rangeStartMs: number, rangeEndMs: number): number[] { /* ported body */ }
```

- [ ] **Step 5: Write the expander** — append to `ical.ts`:

```ts
export interface BusyInterval { uid: string; summary: string | null; start: Date; end: Date; isAllDay: boolean }

const isBusy = (e: RawVEvent) => e.status !== 'CANCELLED' && e.transp !== 'TRANSPARENT'

/** Expand masters, apply EXDATE and RECURRENCE-ID overrides, clip to [rangeStart, rangeEnd). */
export function expandBusyIntervals(events: RawVEvent[], rangeStart: Date, rangeEnd: Date): BusyInterval[] {
  const lo = rangeStart.getTime()
  const hi = rangeEnd.getTime()
  const overrides = new Map<string, RawVEvent>()
  const masters: RawVEvent[] = []
  for (const e of events) {
    if (!e.start || !e.end) continue
    if (e.recurrenceId !== undefined && e.uid) overrides.set(`${e.uid}|${e.recurrenceId}`, e)
    else masters.push(e)
  }
  const out: BusyInterval[] = []
  const push = (e: RawVEvent, start: number, end: number) => {
    if (!isBusy(e) || end <= lo || start >= hi) return
    out.push({
      uid: e.uid ?? String(start),
      summary: e.title ?? null,
      start: new Date(start),
      end: new Date(end),
      isAllDay: Boolean(e.start?.isDateOnly),
    })
  }
  for (const m of masters) {
    const durationMs = m.end!.utcMs - m.start!.utcMs
    if (!m.rrule) { push(m, m.start!.utcMs, m.end!.utcMs); continue }
    for (const occ of occurrenceStarts(m, lo, hi)) {
      if (m.exdates.includes(occ)) continue
      const key = `${m.uid}|${occ}`
      const o = overrides.get(key)
      if (o) { overrides.delete(key); push(o, o.start!.utcMs, o.end!.utcMs) }
      else push(m, occ, occ + durationMs)
    }
  }
  // Overrides whose original occurrence fell outside the range but were moved into it
  for (const o of overrides.values()) push(o, o.start!.utcMs, o.end!.utcMs)
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}
```

- [ ] **Step 6: Run the tests and make sure they pass** — `npx jest src/lib/appleCalendar/ical` → 6 passed. Keep `ical.ts` under about 350 lines; if the port runs longer, move `parseICalDateTime` and the timezone helper into `ical-datetime.ts` and re-export.

- [ ] **Step 7: Ready to commit** — `feat: iCal parser and recurrence expansion ported from onewitharts`

---

### Task 5: CalDAV client

**Files:**
- Create: `src/lib/appleCalendar/client.ts`, `scripts/icloud-list.ts` (kept as a diagnostic)

**Interfaces:**
- Consumes: `ICLOUD_APPLE_ID`, `ICLOUD_APP_PASSWORD`.
- Produces:
```ts
export class AppleCalendarError extends Error {}
export interface CalendarRef { name: string; url: string }
export function listCalendars(): Promise<CalendarRef[]>
export function fetchCalendarIcs(name: string, start: Date, end: Date): Promise<string[]>
export function putEvent(calendarName: string, uid: string, ics: string): Promise<{ url: string; etag: string | null }>
export function updateEvent(url: string, etag: string | null, ics: string): Promise<{ etag: string | null }>
export function deleteEvent(url: string, etag: string | null): Promise<void>
```

- [ ] **Step 1: Write the client** — `src/lib/appleCalendar/client.ts`

```ts
import { DAVClient, type DAVCalendar } from 'tsdav'

export class AppleCalendarError extends Error {}
export interface CalendarRef { name: string; url: string }

let clientPromise: Promise<DAVClient> | null = null
let calendarsCache: { at: number; list: DAVCalendar[] } | null = null

function getClient(): Promise<DAVClient> {
  if (!clientPromise) {
    const username = process.env.ICLOUD_APPLE_ID
    const password = process.env.ICLOUD_APP_PASSWORD
    if (!username || !password) throw new AppleCalendarError('ICLOUD_APPLE_ID / ICLOUD_APP_PASSWORD not set')
    const c = new DAVClient({ serverUrl: 'https://caldav.icloud.com', credentials: { username, password }, authMethod: 'Basic', defaultAccountType: 'caldav' })
    clientPromise = c.login().then(() => c).catch((e) => {
      clientPromise = null   // a failed login must not be cached, or every later call fails too
      throw new AppleCalendarError(`iCloud login failed: ${e instanceof Error ? e.message : String(e)}`)
    })
  }
  return clientPromise
}

async function calendars(): Promise<DAVCalendar[]> {
  if (calendarsCache && Date.now() - calendarsCache.at < 10 * 60_000) return calendarsCache.list
  const list = await (await getClient()).fetchCalendars()
  calendarsCache = { at: Date.now(), list }
  return list
}

async function calendarByName(name: string): Promise<DAVCalendar> {
  const cal = (await calendars()).find((c) => String(c.displayName) === name)
  if (!cal) throw new AppleCalendarError(`iCloud calendar "${name}" not found`)
  return cal
}

export async function listCalendars(): Promise<CalendarRef[]> {
  return (await calendars()).map((c) => ({ name: String(c.displayName ?? ''), url: c.url }))
}

export async function fetchCalendarIcs(name: string, start: Date, end: Date): Promise<string[]> {
  const client = await getClient()
  const objects = await client.fetchCalendarObjects({
    calendar: await calendarByName(name),
    timeRange: { start: start.toISOString(), end: end.toISOString() },
    expand: true,
  })
  return objects.map((o) => o.data).filter((d): d is string => typeof d === 'string')
}

export async function putEvent(calendarName: string, uid: string, ics: string) {
  const client = await getClient()
  const calendar = await calendarByName(calendarName)
  const res = await client.createCalendarObject({ calendar, filename: `${uid}.ics`, iCalString: ics })
  if (!res.ok) throw new AppleCalendarError(`create event failed: ${res.status}`)
  return { url: new URL(`${uid}.ics`, calendar.url).toString(), etag: res.headers.get('etag') }
}

export async function updateEvent(url: string, etag: string | null, ics: string) {
  const client = await getClient()
  const res = await client.updateCalendarObject({ calendarObject: { url, etag: etag ?? undefined, data: ics } })
  if (!res.ok) throw new AppleCalendarError(`update event failed: ${res.status}`)
  return { etag: res.headers.get('etag') }
}

export async function deleteEvent(url: string, etag: string | null) {
  const client = await getClient()
  const res = await client.deleteCalendarObject({ calendarObject: { url, etag: etag ?? undefined } })
  if (!res.ok && res.status !== 404) throw new AppleCalendarError(`delete event failed: ${res.status}`)
}
```

- [ ] **Step 2: Diagnostic script** — `scripts/icloud-list.ts`

```ts
import 'dotenv/config'
import { listCalendars } from '../src/lib/appleCalendar/client'
listCalendars().then((c) => console.log(c)).catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 3: Choose the calendars** — run `npx tsx scripts/icloud-list.ts`, then set `ICLOUD_BLOCKING_CALENDARS` and `ICLOUD_BOOKING_CALENDAR` in `.env` and store them in settings:

```bash
npx tsx -e "import {setSetting} from './src/lib/settings'; setSetting('calendars',{blocking: process.env.ICLOUD_BLOCKING_CALENDARS!.split(','), booking: process.env.ICLOUD_BOOKING_CALENDAR!}).then(()=>console.log('ok'))"
```

The booking calendar must not appear in the blocking list, or every tan would block the 30 minutes after itself.

- [ ] **Step 4: Verify** — `npm run build` green (the client is imported only from server code).

- [ ] **Step 5: Ready to commit** — `feat: iCloud CalDAV client`

---

### Task 6: Busy-block sync

**Files:**
- Create: `src/lib/appleCalendar/sync.ts`, `src/lib/appleCalendar/sync.test.ts`, `src/app/api/admin/calendars/route.ts`, `src/app/api/admin/calendars/sync/route.ts`

**Interfaces:**
- Consumes: `fetchCalendarIcs`, `parseICal`, `expandBusyIntervals`, `getSetting`, `setSetting`, `prisma`.
- Produces: `syncBusyBlocks(rangeStart: Date, rangeEnd: Date): Promise<{ count: number }>`, `ensureFreshBusyBlocks(): Promise<void>`, `liveBusyCheck(start: Date, end: Date): Promise<boolean>` (true means clear; Phase 2 calls it inside the booking transaction); `GET /api/admin/calendars`; `POST /api/admin/calendars/sync`.

- [ ] **Step 1: Write the failing test** — `src/lib/appleCalendar/sync.test.ts`

```ts
jest.mock('./client', () => ({ fetchCalendarIcs: jest.fn() }))
jest.mock('@/lib/settings', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }))
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)), externalBusyBlock: { deleteMany: jest.fn(), createMany: jest.fn() } },
}))
import { fetchCalendarIcs } from './client'
import { getSetting, setSetting } from '@/lib/settings'
import prisma from '@/lib/db'
import { syncBusyBlocks } from './sync'

const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:a\r\nSUMMARY:Dentist\r\nDTSTART:20260915T170000Z\r\nDTEND:20260915T180000Z\r\nEND:VEVENT\r\nEND:VCALENDAR'
const db = prisma as unknown as { externalBusyBlock: Record<string, jest.Mock> }

test('replaces blocks in range from every blocking calendar and clears lastError', async () => {
  ;(getSetting as jest.Mock).mockResolvedValue({ blocking: ['Personal', 'Work'], booking: 'Bookings', lastSyncedAt: null, lastError: null })
  ;(fetchCalendarIcs as jest.Mock).mockResolvedValue([ics])
  const start = new Date('2026-09-14T00:00:00Z')
  const end = new Date('2026-09-21T00:00:00Z')
  const r = await syncBusyBlocks(start, end)
  expect(r.count).toBe(2)
  expect(db.externalBusyBlock.deleteMany).toHaveBeenCalledWith({ where: { startAt: { lt: end }, endAt: { gt: start } } })
  expect(db.externalBusyBlock.createMany.mock.calls[0][0].data[0]).toMatchObject({ calendarName: 'Personal', uid: 'a', summary: 'Dentist', isAllDay: false })
  expect(setSetting).toHaveBeenCalledWith('calendars', expect.objectContaining({ lastError: null }))
})
test('records lastError and rethrows when iCloud fails', async () => {
  ;(getSetting as jest.Mock).mockResolvedValue({ blocking: ['Personal'], booking: '', lastSyncedAt: null, lastError: null })
  ;(fetchCalendarIcs as jest.Mock).mockRejectedValue(new Error('401'))
  await expect(syncBusyBlocks(new Date(), new Date())).rejects.toThrow('401')
  expect(setSetting).toHaveBeenCalledWith('calendars', expect.objectContaining({ lastError: expect.stringContaining('401') }))
})
```

- [ ] **Step 2: Run it to make sure it fails** — `npx jest src/lib/appleCalendar/sync` → FAIL.

- [ ] **Step 3: Write the implementation** — `src/lib/appleCalendar/sync.ts`

```ts
import prisma from '@/lib/db'
import { getSetting, setSetting } from '@/lib/settings'
import { fetchCalendarIcs } from './client'
import { parseICal, expandBusyIntervals } from './ical'

const DAY = 86_400_000

export async function syncBusyBlocks(rangeStart: Date, rangeEnd: Date): Promise<{ count: number }> {
  const cal = await getSetting('calendars')
  try {
    const rows: { calendarName: string; uid: string; summary: string | null; startAt: Date; endAt: Date; isAllDay: boolean }[] = []
    for (const name of cal.blocking) {
      const docs = await fetchCalendarIcs(name, rangeStart, rangeEnd)
      const events = docs.flatMap(parseICal)
      for (const b of expandBusyIntervals(events, rangeStart, rangeEnd)) {
        rows.push({ calendarName: name, uid: b.uid, summary: b.summary, startAt: b.start, endAt: b.end, isAllDay: b.isAllDay })
      }
    }
    await prisma.$transaction([
      prisma.externalBusyBlock.deleteMany({ where: { startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } } }),
      prisma.externalBusyBlock.createMany({ data: rows }),
    ])
    await setSetting('calendars', { lastSyncedAt: new Date().toISOString(), lastError: null })
    return { count: rows.length }
  } catch (error) {
    console.error('DEBUG: syncBusyBlocks', { rangeStart, rangeEnd, error })
    await setSetting('calendars', { lastError: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/** Lazy refresh used by the availability routes. No-op while the cache is younger than syncStaleMin. */
export async function ensureFreshBusyBlocks(): Promise<void> {
  const [cal, rules] = await Promise.all([getSetting('calendars'), getSetting('bookingRules')])
  if (cal.blocking.length === 0) return
  if (cal.lastSyncedAt && Date.now() - new Date(cal.lastSyncedAt).getTime() < rules.syncStaleMin * 60_000) return
  await syncBusyBlocks(new Date(Date.now() - DAY), new Date(Date.now() + (rules.maxAdvanceDays + 1) * DAY))
}

/** Live check for one booking window. Returns false when the window is blocked. */
export async function liveBusyCheck(start: Date, end: Date): Promise<boolean> {
  const [cal, rules] = await Promise.all([getSetting('calendars'), getSetting('bookingRules')])
  const from = new Date(start.getTime() - DAY)   // catch long and all-day events that began earlier
  for (const name of cal.blocking) {
    const events = (await fetchCalendarIcs(name, from, end)).flatMap(parseICal)
    for (const b of expandBusyIntervals(events, from, end)) {
      const blockedUntil = b.end.getTime() + rules.externalBufferMin * 60_000
      if (start.getTime() < blockedUntil && b.start.getTime() < end.getTime()) return false
    }
  }
  return true
}
```

- [ ] **Step 4: Run the tests and make sure they pass** — `npx jest src/lib/appleCalendar/sync` → 2 passed.

- [ ] **Step 5: Admin calendars route** — `src/app/api/admin/calendars/route.ts`

```ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listCalendars, AppleCalendarError } from '@/lib/appleCalendar/client'
import { getSetting } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await getSetting('calendars')
  try {
    return NextResponse.json({ calendars: await listCalendars(), settings })
  } catch (error) {
    console.error('DEBUG: GET /api/admin/calendars', error)
    const message = error instanceof AppleCalendarError ? error.message : 'iCloud unavailable'
    return NextResponse.json({ calendars: [], settings, error: message }, { status: 502 })
  }
}
```

- [ ] **Step 6: Manual sync route** — `src/app/api/admin/calendars/sync/route.ts`

```ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { syncBusyBlocks } from '@/lib/appleCalendar/sync'
import { getSetting } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { maxAdvanceDays } = await getSetting('bookingRules')
  try {
    const r = await syncBusyBlocks(new Date(Date.now() - 86_400_000), new Date(Date.now() + (maxAdvanceDays + 1) * 86_400_000))
    return NextResponse.json({ ok: true, ...r })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sync failed' }, { status: 502 })
  }
}
```

- [ ] **Step 7: Verify** — `npm test` green, `npm run build` green. As admin, `POST /api/admin/calendars/sync` returns `{ ok: true, count: N }`; `npx prisma studio` shows `ExternalBusyBlock` rows matching her real calendar.

- [ ] **Step 8: Ready to commit** — `feat: external busy-block sync from iCloud`

---

### Task 7: Slot loader and availability API

**Files:**
- Create: `src/lib/booking/slots.ts`, `src/lib/booking/slots.test.ts`, `src/app/api/services/route.ts`, `src/app/api/availability/route.ts`, `src/app/api/availability/days/route.ts`

**Interfaces:**
- Consumes: `computeSlots`, `Interval`, `getSetting`, `ensureFreshBusyBlocks`, `prisma`, `BusinessHours`.
- Produces:
```ts
export function dayWindow(ymd: string, hours: BusinessHours, tz: string): { open: Date; close: Date } | null
export function getSlotsForDay(ymd: string, service: { durationMin: number }, opts?: { adminOverride?: boolean; now?: Date }): Promise<Date[]>
export function countSlotsForMonth(yyyymm: string, service: { durationMin: number }): Promise<Record<string, number>>
```
  - `GET /api/services` → `{ services: [{id,slug,name,description,priceCents,durationMin,location}], addOns: [{id,name,description,priceCents}] }`
  - `GET /api/availability?date=YYYY-MM-DD&serviceId=` → `{ date, durationMin, slots: string[] }`
  - `GET /api/availability/days?month=YYYY-MM&serviceId=` → `{ days: Record<string, number> }`

- [ ] **Step 1: Write the failing test** — `src/lib/booking/slots.test.ts`

```ts
import { dayWindow } from './slots'
import { SETTING_DEFAULTS } from '@/lib/settingsDefaults'

test('dayWindow converts business hours in America/Boise to UTC instants during MDT', () => {
  const w = dayWindow('2026-09-15', SETTING_DEFAULTS.businessHours, 'America/Boise')!
  expect(w.open.toISOString()).toBe('2026-09-15T15:00:00.000Z')
  expect(w.close.toISOString()).toBe('2026-09-16T01:00:00.000Z')
})
test('dayWindow is null on a closed day (Sunday)', () => {
  expect(dayWindow('2026-09-13', SETTING_DEFAULTS.businessHours, 'America/Boise')).toBeNull()
})
test('dayWindow handles standard time after DST ends', () => {
  const w = dayWindow('2026-11-02', SETTING_DEFAULTS.businessHours, 'America/Boise')!
  expect(w.open.toISOString()).toBe('2026-11-02T16:00:00.000Z')
})
```

- [ ] **Step 2: Run it to make sure it fails** — `npx jest src/lib/booking/slots` → FAIL.

- [ ] **Step 3: Write the implementation** — `src/lib/booking/slots.ts`

```ts
import { fromZonedTime } from 'date-fns-tz'
import prisma from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { ensureFreshBusyBlocks } from '@/lib/appleCalendar/sync'
import type { BusinessHours } from '@/lib/settingsDefaults'
import { computeSlots, type Interval } from './availability'

const DAY = 86_400_000

export function dayWindow(ymd: string, hours: BusinessHours, tz: string) {
  // Noon avoids the DST edge when deciding which weekday this local date is.
  const weekday = fromZonedTime(`${ymd}T12:00:00`, tz).getUTCDay() as keyof BusinessHours
  const h = hours[weekday]
  if (!h) return null
  return { open: fromZonedTime(`${ymd}T${h.open}:00`, tz), close: fromZonedTime(`${ymd}T${h.close}:00`, tz) }
}

async function loadBlocks(open: Date, close: Date): Promise<{ appointments: Interval[]; busy: Interval[] }> {
  const [appts, busy] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: 'BOOKED', startAt: { lt: close }, endAt: { gt: open } },
      select: { startAt: true, endAt: true },
    }),
    prisma.externalBusyBlock.findMany({
      where: { startAt: { lt: new Date(close.getTime() + DAY) }, endAt: { gt: new Date(open.getTime() - DAY) } },
      select: { startAt: true, endAt: true },
    }),
  ])
  return {
    appointments: appts.map((a) => ({ start: a.startAt, end: a.endAt })),
    busy: busy.map((b) => ({ start: b.startAt, end: b.endAt })),
  }
}

export async function getSlotsForDay(
  ymd: string,
  service: { durationMin: number },
  opts: { adminOverride?: boolean; now?: Date } = {}
): Promise<Date[]> {
  const [hours, rules] = await Promise.all([getSetting('businessHours'), getSetting('bookingRules')])
  const now = opts.now ?? new Date()
  let window = dayWindow(ymd, hours, rules.timeZone)
  if (!window) {
    // Admin override may book on a closed day; conflicts still apply.
    if (!opts.adminOverride) return []
    window = { open: fromZonedTime(`${ymd}T06:00:00`, rules.timeZone), close: fromZonedTime(`${ymd}T22:00:00`, rules.timeZone) }
  }
  await ensureFreshBusyBlocks()
  const { appointments, busy } = await loadBlocks(window.open, window.close)
  return computeSlots({
    dayOpen: window.open,
    dayClose: window.close,
    durationMin: service.durationMin,
    stepMin: rules.slotStepMin,
    now,
    leadTimeMin: opts.adminOverride ? 0 : rules.leadTimeMin,
    appointments,
    busyBlocks: busy,
    bufferMin: rules.externalBufferMin,
  })
}

export async function countSlotsForMonth(yyyymm: string, service: { durationMin: number }): Promise<Record<string, number>> {
  const [y, m] = yyyymm.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  await ensureFreshBusyBlocks()   // once; the per-day call is then a no-op
  const out: Record<string, number> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${yyyymm}-${String(d).padStart(2, '0')}`
    out[ymd] = (await getSlotsForDay(ymd, service)).length
  }
  return out
}
```

- [ ] **Step 4: Run the tests and make sure they pass** — `npx jest src/lib/booking/slots` → 3 passed.

- [ ] **Step 5: Services route** — `src/app/api/services/route.ts`

```ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [services, addOns] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, name: true, description: true, priceCents: true, durationMin: true, location: true },
    }),
    prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, description: true, priceCents: true },
    }),
  ])
  return NextResponse.json({ services, addOns })
}
```

- [ ] **Step 6: Availability routes** — `src/app/api/availability/route.ts`

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { getSlotsForDay } from '@/lib/booking/slots'
import { AppleCalendarError } from '@/lib/appleCalendar/client'

export const dynamic = 'force-dynamic'
const query = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), serviceId: z.string().min(1) })

export async function GET(req: Request) {
  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'date=YYYY-MM-DD and serviceId are required' }, { status: 400 })
  const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId }, select: { durationMin: true, isActive: true } })
  if (!service?.isActive) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  try {
    const slots = await getSlotsForDay(parsed.data.date, service)
    return NextResponse.json({ date: parsed.data.date, durationMin: service.durationMin, slots: slots.map((d) => d.toISOString()) })
  } catch (error) {
    console.error('DEBUG: GET /api/availability', { query: parsed.data, error })
    return NextResponse.json({ error: 'Availability is temporarily unavailable' }, { status: error instanceof AppleCalendarError ? 502 : 500 })
  }
}
```

`src/app/api/availability/days/route.ts` is the same shape with `month: z.string().regex(/^\d{4}-\d{2}$/)`, calling `countSlotsForMonth` and returning `{ days }`.

- [ ] **Step 7: Verify** — `npm test` green, `npm run build` green. Fetch a service id from `/api/services`, then `curl 'localhost:3000/api/availability?date=<tomorrow>&serviceId=<id>'`. Add a test event to her iCloud calendar, `POST /api/admin/calendars/sync`, re-query, and confirm the hole plus the 30 minutes after it.

- [ ] **Step 8: Ready to commit** — `feat: services and availability APIs`

---

### Task 8: ICS builder and calendar mirror

**Files:**
- Create: `src/lib/appleCalendar/buildIcs.ts`, `src/lib/appleCalendar/buildIcs.test.ts`, `src/lib/appleCalendar/mirror.ts`

**Interfaces:**
- Consumes: `putEvent`, `updateEvent`, `deleteEvent` (Task 5), `getSetting('calendars').booking`, `formatPhoneDisplay`, `prisma`.
- Produces:
```ts
export interface IcsEvent { uid: string; start: Date; end: Date; summary: string; description?: string; location?: string; url?: string; sequence?: number; cancelled?: boolean }
export function buildIcs(e: IcsEvent): string
export function pushAppointment(id: string): Promise<void>
export function removeAppointment(id: string): Promise<void>
```

- [ ] **Step 1: Write the failing test** — `src/lib/appleCalendar/buildIcs.test.ts`

```ts
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
```

- [ ] **Step 2: Run it to make sure it fails** — `npx jest src/lib/appleCalendar/buildIcs` → FAIL.

- [ ] **Step 3: Write the implementation** — `src/lib/appleCalendar/buildIcs.ts`

```ts
export interface IcsEvent {
  uid: string; start: Date; end: Date; summary: string
  description?: string; location?: string; url?: string
  sequence?: number; cancelled?: boolean
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

function fold(line: string): string {
  const out: string[] = []
  let rest = line
  while (Buffer.byteLength(rest, 'utf8') > 75) {
    let cut = 75
    while (Buffer.byteLength(rest.slice(0, cut), 'utf8') > 75) cut--
    out.push(rest.slice(0, cut))
    rest = ' ' + rest.slice(cut)
  }
  out.push(rest)
  return out.join('\r\n')
}

export function buildIcs(e: IcsEvent): string {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Ritzy Mist//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(e.summary)}`,
    ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    `SEQUENCE:${e.sequence ?? 0}`,
    `STATUS:${e.cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
```

- [ ] **Step 4: Run the tests and make sure they pass** — `npx jest src/lib/appleCalendar/buildIcs` → 4 passed.

- [ ] **Step 5: Write the mirror** — `src/lib/appleCalendar/mirror.ts`

```ts
import prisma from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { formatPhoneDisplay } from '@/lib/phone'
import { buildIcs } from './buildIcs'
import { putEvent, updateEvent, deleteEvent } from './client'

const load = (id: string) =>
  prisma.appointment.findUniqueOrThrow({ where: { id }, include: { user: true, service: true, addOns: { include: { addOn: true } } } })

type Loaded = Awaited<ReturnType<typeof load>>

function toIcs(a: Loaded, uid: string, sequence: number, cancelled: boolean) {
  const name = a.user ? `${a.user.firstName} ${a.user.lastName[0] ?? ''}`.trim() : 'No account yet'
  const description = [
    a.occasion && `Occasion: ${a.occasion}`,
    a.addOns.length > 0 && `Add-ons: ${a.addOns.map((x) => x.addOn.name).join(', ')}`,
    a.user?.phone && `Phone: ${formatPhoneDisplay(a.user.phone)}`,
    a.user?.skinType && `Skin type ${a.user.skinType}${a.user.skinTone ? ` (${a.user.skinTone.toLowerCase()})` : ''}`,
    a.clientNotes && `Notes: ${a.clientNotes}`,
    `${process.env.NEXTAUTH_URL}/appointment/${a.token}`,
  ].filter(Boolean).join('\n')
  return buildIcs({
    uid, start: a.startAt, end: a.endAt,
    summary: `Spray Tan - ${name} - ${a.service.name}`,
    description,
    location: a.address ?? (a.service.location === 'STUDIO' ? 'Studio' : undefined),
    sequence, cancelled,
  })
}

/** Best effort. A failure is logged and left to the admin "Push to Apple Calendar" retry button. */
export async function pushAppointment(id: string): Promise<void> {
  const { booking } = await getSetting('calendars')
  if (!booking) return
  const a = await load(id)
  try {
    if (a.icalUrl) {
      const { etag } = await updateEvent(a.icalUrl, a.icalEtag, toIcs(a, a.icalUid ?? `ritzy-${a.id}`, 1, a.status === 'CANCELLED'))
      await prisma.appointment.update({ where: { id }, data: { icalEtag: etag } })
    } else {
      const uid = `ritzy-${a.id}`
      const { url, etag } = await putEvent(booking, uid, toIcs(a, uid, 0, false))
      await prisma.appointment.update({ where: { id }, data: { icalUid: uid, icalUrl: url, icalEtag: etag } })
    }
  } catch (error) {
    console.error('DEBUG: pushAppointment failed', { id, error })
  }
}

export async function removeAppointment(id: string): Promise<void> {
  const a = await prisma.appointment.findUnique({ where: { id }, select: { icalUrl: true, icalEtag: true } })
  if (!a?.icalUrl) return
  try {
    await deleteEvent(a.icalUrl, a.icalEtag)
    await prisma.appointment.update({ where: { id }, data: { icalUrl: null, icalEtag: null } })
  } catch (error) {
    console.error('DEBUG: removeAppointment failed', { id, error })
  }
}
```

- [ ] **Step 6: Verify end to end** — `npm test` green, `npm run build` green. Then create a throwaway appointment against a seeded service, push it, confirm it appears on her phone in the booking calendar, then remove it and delete the row:

```bash
npx tsx -e "
import p from './src/lib/db'; import {generatePublicToken} from './src/lib/tokenGenerator';
import {pushAppointment} from './src/lib/appleCalendar/mirror';
(async () => {
  const s = await p.service.findFirstOrThrow();
  const start = new Date(Date.now() + 864e5);
  const a = await p.appointment.create({ data: { token: generatePublicToken(), serviceId: s.id, startAt: start, endAt: new Date(start.getTime() + s.durationMin*6e4), priceCents: s.priceCents } });
  await pushAppointment(a.id); console.log('pushed', a.id);
})()"
```

- [ ] **Step 7: Ready to commit** — `feat: ICS builder and Apple Calendar mirror`

---

## Self-review against the spec

- §4 rules all covered by tests: 5-minute step, per-service duration, buffer after external events only, no buffer after tans, lead time, business hours, all-day, TRANSPARENT and CANCELLED. DST is covered twice: TZID parsing (Task 4) and `dayWindow` across MDT and MST (Task 7).
- §5.1 CalDAV transport in Tasks 3 and 5. §5.2 modules `client`, `ical`, `sync`, `mirror`, `buildIcs` in Tasks 4 to 8. Lazy sync with a staleness window in Task 6. §5.3 `liveBusyCheck` exists in Task 6 and is consumed by Phase 2's booking transaction. §5.4 spike is Task 3.
- The booking calendar is kept out of the blocking list by the settings shape (`blocking[]` versus `booking`); the Phase 4 Settings screen must exclude the booking calendar from the blocking multi-select.
- §12 items that apply to server-only work: `force-dynamic` routes, server libraries never imported by components, error contract 400/401/404/502/500 with `DEBUG:` logs. No UI ships in this phase.
- Type consistency: `Interval` (Task 2) is what `slots.ts` builds; `BusyInterval` (Task 4) is what `sync.ts` stores; `CalendarRef` (Task 5) is what the admin route returns; the `calendars` setting fields `blocking`, `booking`, `lastSyncedAt`, `lastError` are used identically in Tasks 1, 6, and 8.
- One function is ported rather than printed in full: `occurrenceStarts`, from onewitharts L167 to L232. The RRULE test in Task 4 is its acceptance check.


---

## Implementation notes (written during execution, 2026-09-15)

1. **The plan's ICS escape function had a real bug.** It wrote `.replace(/;/g, '\;')`, but `'\;'`
   is not an escape sequence in JavaScript — it evaluates to plain `';'`, so semicolons were
   never escaped and any summary or description containing one would corrupt the VEVENT.
   Corrected to `'\\;'` in both the plan above and the implementation.
2. **`GET`/`PUT /api/admin/settings` wrap their handlers in try/catch** with `DEBUG:` logging and
   a generic client message. The plan omitted this; the error contract in spec §12.9 requires it.
3. **`settings.test.ts` mocks `@/lib/db`** so the suite never instantiates `PrismaClient`
   without a `DATABASE_URL`.
4. **The 88-slot assertion in Task 2 is correct** and was verified independently: 09:00 to 16:15
   is 435 minutes, which is 87 five-minute steps, so 88 slots inclusive.

5. **Two bugs in the onewitharts parser were fixed during the port, both verified against its
   source.** They are harmless for payroll and would cause double-bookings here:
   - **`BYDAY` is not parsed at all.** `employeeCalendar.ts:290` steps a fixed
     `7 * interval` days from DTSTART, so `FREQ=WEEKLY;BYDAY=TU,TH` yields only the Tuesdays
     and every Thursday stays bookable forever.
   - **`FREQ` other than DAILY/WEEKLY is rejected** (`employeeCalendar.ts:372`), so a monthly
     or yearly commitment blocks exactly once and never again.
   - Related: `MAX_EXPANSION_ITERATIONS = 5000` is counted from DTSTART rather than from the
     query window, so a daily series older than ~13.7 years exhausts the cap before reaching
     today and silently stops blocking. The port fast-forwards to the window instead.
6. **`parseICal` is line-based rather than regex-per-field.** The onewitharts `DTSTART` regex
   only finds `TZID` when it follows `VALUE=DATE`, so a real-world
   `DTSTART;TZID=America/Boise;VALUE=DATE-TIME:...` loses its zone and is read as UTC — a
   six-hour shift on every event from that calendar.
7. **`ical.ts` was split**, with date and timezone handling in `ical-datetime.ts`, per Task 4
   Step 6's size guidance.

## Open decisions surfaced by the port (need answers before Task 6 consumes this)

- **Floating times and unknown TZIDs are treated as UTC.** For a Boise business that is a six
  to seven hour error on every floating event. The right behaviour is to resolve them in the
  business time zone. Decide whether `parseICal` takes a fallback zone or the sync layer
  normalises.
- **All-day events resolve to UTC midnight, not business-zone midnight**, so
  `DTSTART;VALUE=DATE:20260916` becomes 18:00 on the 15th in Boise. The `isAllDay` flag exists
  so the consumer re-derives day boundaries in the business zone. Task 6 must actually do that
  rather than using `start`/`end` directly, or it will block the wrong six-hour slice.
- **VEVENTs carrying `DURATION` instead of `DTEND` are dropped** (`TODO[7]` at the drop site).
  Apple emits this occasionally, and a dropped event means no block at all.
