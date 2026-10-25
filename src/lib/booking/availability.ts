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
