/**
 * Dependency-free iCal parser + recurrence expansion, ported from onewitharts
 * `src/lib/employeeCalendar.ts`.
 *
 * Pure module: an ICS string in, busy intervals out. No DB, no network, no
 * `next/*`. Everything it needs to be DST-correct lives in `./ical-datetime`.
 *
 * Correctness matters more here than anywhere else in the booking flow: a
 * missed occurrence is not a rendering glitch, it is a client booked on top of
 * something the owner is already doing. So:
 *  - RRULEs are expanded (an unedited future event exists ONLY through
 *    expansion; never assume the feed lists instances),
 *  - EXDATEs remove instances and RECURRENCE-ID events replace them,
 *  - stepping is wall-clock in the event's own timezone so a 09:00 weekly
 *    event is still 09:00 after the clocks change,
 *  - anything unparseable is dropped quietly rather than throwing, so one bad
 *    VEVENT cannot take the whole calendar (and therefore all blocking) down.
 */

import {
  addDays,
  addMonths,
  parseICalDateTime,
  unescapeICalText,
  wallDayOfWeek,
  wallToUtcMs,
  type ParsedDateTime,
  type Wall,
} from './ical-datetime'

export type { ParsedDateTime } from './ical-datetime'

export interface RawVEvent {
  uid?: string
  title?: string
  status?: string
  transp?: string
  sequence?: number
  lastModified?: string
  start?: ParsedDateTime
  end?: ParsedDateTime
  rrule?: string
  /** UTC ms of excluded original occurrence starts */
  exdates: number[]
  /** UTC ms of the original occurrence this event overrides */
  recurrenceId?: number
}

export interface BusyInterval {
  uid: string
  summary: string | null
  start: Date
  end: Date
  isAllDay: boolean
}

// --- parsing ---------------------------------------------------------------

interface ContentLine {
  name: string
  params: Map<string, string>
  value: string
}

function parseContentLine(raw: string): ContentLine | null {
  const colon = raw.indexOf(':')
  if (colon === -1) return null
  const segments = raw.slice(0, colon).split(';')
  const params = new Map<string, string>()
  for (let i = 1; i < segments.length; i++) {
    const eq = segments[i].indexOf('=')
    if (eq > 0) {
      params.set(
        segments[i].slice(0, eq).trim().toUpperCase(),
        segments[i].slice(eq + 1).trim().replace(/^"|"$/g, '')
      )
    }
  }
  return { name: segments[0].trim().toUpperCase(), params, value: raw.slice(colon + 1).trim() }
}

/**
 * Parse iCal data into raw VEVENTs (masters, overrides, singles) without
 * expanding. Events without a usable start AND end are dropped: we cannot
 * reason about a block with no boundaries, and guessing one is worse than
 * ignoring it.
 */
export function parseICal(ics: string): RawVEvent[] {
  // RFC 5545 line folding: CRLF followed by a single space or tab continues the
  // previous line. Unfold once up front so every field is a single line.
  const unfolded = ics.replace(/\r\n[ \t]|\n[ \t]|\r[ \t]/g, '')
  const events: RawVEvent[] = []

  const blocks = unfolded.split('BEGIN:VEVENT')
  for (let i = 1; i < blocks.length; i++) {
    // Cut at END:VEVENT so trailing VTIMEZONE/calendar data cannot leak into
    // this event's fields (it previously injected bogus RRULEs).
    const block = blocks[i].split('END:VEVENT')[0]
    const event: RawVEvent = { exdates: [] }

    for (const raw of block.split(/\r?\n|\r/)) {
      const line = parseContentLine(raw)
      if (!line) continue
      const tzid = line.params.get('TZID')
      switch (line.name) {
        case 'UID':
          event.uid = unescapeICalText(line.value)
          break
        case 'SUMMARY':
          event.title = unescapeICalText(line.value)
          break
        case 'STATUS':
          event.status = line.value.toUpperCase()
          break
        case 'TRANSP':
          event.transp = line.value.toUpperCase()
          break
        case 'LAST-MODIFIED':
          event.lastModified = line.value
          break
        case 'SEQUENCE': {
          const seq = parseInt(line.value, 10)
          if (!isNaN(seq)) event.sequence = seq
          break
        }
        case 'DTSTART':
          event.start = parseICalDateTime(line.value, tzid) ?? undefined
          break
        case 'DTEND':
          event.end = parseICalDateTime(line.value, tzid) ?? undefined
          break
        case 'RRULE':
          event.rrule = line.value
          break
        case 'RECURRENCE-ID': {
          const parsed = parseICalDateTime(line.value, tzid)
          if (parsed) event.recurrenceId = parsed.utcMs
          break
        }
        case 'EXDATE':
          for (const value of line.value.split(',')) {
            const parsed = parseICalDateTime(value.trim(), tzid)
            if (parsed) event.exdates.push(parsed.utcMs)
          }
          break
      }
    }

    // TODO[7]: DTEND-less VEVENTs are dropped — support DURATION/implicit end.
    // Apple and some CalDAV servers emit DURATION instead of DTEND, and a
    // single-day all-day event may omit DTEND legally. Dropping it means the
    // event never blocks, which double-books. Ideal: derive the end from
    // DURATION, else DTSTART + 1 day (date-only) / DTSTART (timed) per RFC 5545.
    // Left out because the plan's spec and its test require the drop.
    if (event.start && event.end) events.push(event)
  }

  return events
}

// --- recurrence ------------------------------------------------------------

type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

interface ParsedRRule {
  freq: Freq
  interval: number
  until?: number // UTC ms, inclusive
  count?: number
  byDay?: number[] // 0 = Sunday
  wkst: number
}

const DAY_NUMBERS: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

function parseRRule(rrule: string): ParsedRRule | null {
  const parts = new Map<string, string>()
  for (const piece of rrule.split(';')) {
    const eq = piece.indexOf('=')
    if (eq > 0) parts.set(piece.slice(0, eq).toUpperCase().trim(), piece.slice(eq + 1).trim())
  }

  const freq = parts.get('FREQ')?.toUpperCase()
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') return null

  const interval = Math.max(1, parseInt(parts.get('INTERVAL') || '1', 10) || 1)

  let until: number | undefined
  const untilRaw = parts.get('UNTIL')
  if (untilRaw) until = parseICalDateTime(untilRaw)?.utcMs

  let count: number | undefined
  const countRaw = parts.get('COUNT')
  if (countRaw) {
    const parsed = parseInt(countRaw, 10)
    if (!isNaN(parsed) && parsed > 0) count = parsed
  }

  let byDay: number[] | undefined
  const byDayRaw = parts.get('BYDAY')
  if (byDayRaw) {
    // Ordinal prefixes (2TU, -1FR) are meaningless for FREQ=WEEKLY; strip them.
    const days = byDayRaw
      .split(',')
      .map((code) => DAY_NUMBERS[code.trim().toUpperCase().replace(/^[+-]?\d+/, '')])
      .filter((day): day is number => day !== undefined)
    if (days.length > 0) byDay = days
  }

  const wkst = DAY_NUMBERS[parts.get('WKST')?.toUpperCase() ?? ''] ?? 1 // RFC default MO
  return { freq, interval, until, count, byDay, wkst }
}

/** 5000 periods: ~13 years of DAILY, ~96 years of WEEKLY. */
const MAX_PERIODS = 5000

/**
 * Original-occurrence start instants (UTC ms) for a master event overlapping
 * [rangeStartMs, rangeEndMs). Steps wall-clock components in the event's own
 * timezone so DST shifts do not drift the time of day.
 * Supports FREQ=DAILY|WEEKLY(+BYDAY)|MONTHLY|YEARLY with INTERVAL, UNTIL and COUNT.
 *
 * An occurrence that starts before the range but runs into it is included —
 * an overnight or multi-day block still blocks.
 */
export function occurrenceStarts(master: RawVEvent, rangeStartMs: number, rangeEndMs: number): number[] {
  const start = master.start
  if (!start) return []
  const rule = master.rrule ? parseRRule(master.rrule) : null
  // No/unsupported RRULE: the event is its own single occurrence.
  if (!rule) return [start.utcMs]

  const durationMs = master.end ? Math.max(0, master.end.utcMs - start.utcMs) : 0
  const startWall: Wall = {
    year: start.year,
    month: start.month,
    day: start.day,
    hour: start.hour,
    minute: start.minute,
    second: start.second,
  }

  // FREQ=WEEKLY repeats a set of weekdays within each interval-week, measured
  // from the week containing DTSTART (WKST decides where that week begins).
  let dayOffsets: number[] | undefined
  let weekStart = startWall
  if (rule.freq === 'WEEKLY') {
    const days = rule.byDay ?? [wallDayOfWeek(startWall)]
    dayOffsets = Array.from(new Set(days.map((day) => (day - rule.wkst + 7) % 7))).sort((a, b) => a - b)
    weekStart = addDays(startWall, -((wallDayOfWeek(startWall) - rule.wkst + 7) % 7))
  }

  const slotsForPeriod = (period: number): Wall[] => {
    switch (rule.freq) {
      case 'DAILY':
        return [addDays(startWall, period * rule.interval)]
      case 'WEEKLY':
        return dayOffsets!.map((offset) => addDays(weekStart, period * rule.interval * 7 + offset))
      case 'MONTHLY': {
        const wall = addMonths(startWall, period * rule.interval)
        return wall ? [wall] : []
      }
      case 'YEARLY': {
        const wall = addMonths(startWall, period * rule.interval * 12)
        return wall ? [wall] : []
      }
    }
  }

  // Skip ahead to the period nearest the range instead of walking every period
  // since DTSTART — a daily event created years ago would otherwise exhaust
  // MAX_PERIODS before reaching today and silently stop blocking. COUNT is
  // indexed from the first occurrence, so a counted series is never skipped.
  let firstPeriod = 0
  const lowerMs = rangeStartMs - durationMs
  if (rule.count === undefined && lowerMs > start.utcMs) {
    if (rule.freq === 'MONTHLY' || rule.freq === 'YEARLY') {
      const lower = new Date(lowerMs)
      const months = (lower.getUTCFullYear() - startWall.year) * 12 + (lower.getUTCMonth() + 1 - startWall.month)
      const perPeriod = rule.interval * (rule.freq === 'YEARLY' ? 12 : 1)
      firstPeriod = Math.max(0, Math.floor(months / perPeriod) - 1)
    } else {
      const days = Math.floor((lowerMs - start.utcMs) / 86_400_000)
      const perPeriod = rule.interval * (rule.freq === 'WEEKLY' ? 7 : 1)
      firstPeriod = Math.max(0, Math.floor(days / perPeriod) - 1)
    }
  }

  const out: number[] = []
  let index = 0 // 1-based occurrence number, for COUNT
  for (let step = 0; step < MAX_PERIODS; step++) {
    for (const wall of slotsForPeriod(firstPeriod + step)) {
      const occurrenceMs = wallToUtcMs(wall, start.tzid)
      if (occurrenceMs < start.utcMs) continue // week-0 days before DTSTART
      index += 1
      if (rule.count !== undefined && index > rule.count) return out
      if (rule.until !== undefined && occurrenceMs > rule.until) return out
      if (occurrenceMs >= rangeEndMs) return out
      if (occurrenceMs + durationMs > rangeStartMs) out.push(occurrenceMs)
    }
  }
  return out
}

// --- expansion -------------------------------------------------------------

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
    if (!m.rrule) {
      push(m, m.start!.utcMs, m.end!.utcMs)
      continue
    }
    for (const occ of occurrenceStarts(m, lo, hi)) {
      if (m.exdates.includes(occ)) continue
      const key = `${m.uid}|${occ}`
      const o = overrides.get(key)
      if (o) {
        overrides.delete(key)
        push(o, o.start!.utcMs, o.end!.utcMs)
      } else {
        push(m, occ, occ + durationMs)
      }
    }
  }
  // Overrides whose original occurrence fell outside the range but were moved into it
  for (const o of overrides.values()) push(o, o.start!.utcMs, o.end!.utcMs)
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}
