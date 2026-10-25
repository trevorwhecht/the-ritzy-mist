/**
 * iCal date-time parsing and DST-aware wall-clock arithmetic.
 *
 * Split out of `ical.ts` purely for file size; `ical.ts` re-exports everything
 * callers need. Ported from onewitharts `src/lib/employeeCalendar.ts` and
 * `src/lib/insightsDateRange.ts` (getTimezoneOffsetMs).
 *
 * Why wall-clock components are kept alongside the UTC instant: a recurring
 * event recurs at the same LOCAL time, so stepping a series must add calendar
 * days/months to the wall clock and re-resolve the offset each time. Stepping
 * by 86_400_000 ms instead drifts an hour across every DST boundary, which in
 * a booking app means the busy block no longer covers the real appointment.
 */

export interface ParsedDateTime {
  /** UTC instant in ms */
  utcMs: number
  /** Wall-clock components in the event's timezone (for recurrence stepping) */
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
  tzid?: string
  isDateOnly: boolean
}

/** Wall-clock date/time with no zone attached. */
export interface Wall {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

/** Offset of `timeZone` from UTC (ms) at the given UTC instant. */
export function getTimezoneOffsetMs(timeZone: string, utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(utcDate)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0)
  // hour12:false can yield "24" for midnight in some environments
  const hour = get('hour') % 24
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
  return asUtc - utcDate.getTime()
}

/**
 * Wall-clock time in `tzid` as a UTC instant. Two-pass: estimate the offset at
 * the naive instant, then re-evaluate at the estimated instant so DST edges
 * resolve correctly. No tzid = floating time, treated as UTC for stable
 * comparisons (same as the original parse).
 */
export function wallToUtcMs(w: Wall, tzid?: string): number {
  const naive = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  if (!tzid) return naive
  try {
    const offset1 = getTimezoneOffsetMs(tzid, new Date(naive))
    const offset2 = getTimezoneOffsetMs(tzid, new Date(naive - offset1))
    return naive - offset2
  } catch {
    return naive // unknown TZID — fall back to floating time
  }
}

/** Same wall-clock time `days` later. Date.UTC normalizes overflow (Jan 40 -> Feb 9). */
export function addDays(w: Wall, days: number): Wall {
  const d = new Date(Date.UTC(w.year, w.month - 1, w.day + days))
  return { ...w, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

/**
 * Same wall-clock time `months` later, or null when that date does not exist
 * (Jan 31 + 1 month). RFC 5545 skips impossible dates rather than rolling them
 * into the next month, and rolling forward would invent a busy block on a day
 * the business is actually free.
 */
export function addMonths(w: Wall, months: number): Wall | null {
  const d = new Date(Date.UTC(w.year, w.month - 1 + months, w.day))
  if (d.getUTCDate() !== w.day) return null
  return { ...w, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

/** Day of week of a wall date, 0 = Sunday. */
export function wallDayOfWeek(w: Wall): number {
  return new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay()
}

/**
 * Parse an iCal date-time (YYYYMMDDTHHMMSS[Z] or YYYYMMDD) into a UTC instant
 * plus its wall-clock components. TZID conversion uses real timezone rules
 * (DST-aware), not hardcoded offsets. Returns null for anything unparseable —
 * callers drop the event rather than guessing a time.
 */
export function parseICalDateTime(dateStr: string, tzid?: string): ParsedDateTime | null {
  if (dateStr.includes('T') && dateStr.length >= 15) {
    const year = Number(dateStr.substring(0, 4))
    const month = Number(dateStr.substring(4, 6))
    const day = Number(dateStr.substring(6, 8))
    const hour = Number(dateStr.substring(9, 11))
    const minute = Number(dateStr.substring(11, 13))
    const second = Number(dateStr.substring(13, 15)) || 0
    if ([year, month, day, hour, minute].some(isNaN)) return null

    const wall: Wall = { year, month, day, hour, minute, second }
    const naive = Date.UTC(year, month - 1, day, hour, minute, second)

    if (dateStr.endsWith('Z')) return { ...wall, utcMs: naive, isDateOnly: false }
    if (!tzid) return { ...wall, utcMs: naive, isDateOnly: false } // floating time
    return { ...wall, utcMs: wallToUtcMs(wall, tzid), tzid, isDateOnly: false }
  }

  if (dateStr.length === 8) {
    const year = Number(dateStr.substring(0, 4))
    const month = Number(dateStr.substring(4, 6))
    const day = Number(dateStr.substring(6, 8))
    if ([year, month, day].some(isNaN)) return null
    return {
      year,
      month,
      day,
      hour: 0,
      minute: 0,
      second: 0,
      utcMs: Date.UTC(year, month - 1, day),
      tzid,
      isDateOnly: true,
    }
  }

  return null
}

export function unescapeICalText(text: string): string {
  return text.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\\\/g, '\\')
}
