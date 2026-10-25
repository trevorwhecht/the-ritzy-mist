import { parseICal, occurrenceStarts, expandBusyIntervals } from './ical'

const wrap = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR\r\n`
const ev = (fields: string) => `BEGIN:VEVENT\r\n${fields}\r\nEND:VEVENT`
const R = [new Date('2026-09-14T00:00:00Z'), new Date('2026-09-21T00:00:00Z')] as const

const startsIn = (ics: string, from: string, to: string) =>
  expandBusyIntervals(parseICal(ics), new Date(from), new Date(to)).map((b) => b.start.toISOString())

// --- the six cases from the plan -------------------------------------------

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

// --- double-booking regressions --------------------------------------------

test('a weekly series keeps its LOCAL time of day across the DST boundary', () => {
  // 09:00 America/Boise every Tuesday. MDT (UTC-6) through Oct, MST (UTC-7) from Nov 1.
  const ics = wrap(ev(
    'UID:dst\r\nDTSTART;TZID=America/Boise:20261006T090000\r\nDTEND;TZID=America/Boise:20261006T100000\r\n' +
    'RRULE:FREQ=WEEKLY;BYDAY=TU'
  ))
  expect(startsIn(ics, '2026-10-01T00:00:00Z', '2026-11-15T00:00:00Z')).toEqual([
    '2026-10-06T15:00:00.000Z',
    '2026-10-13T15:00:00.000Z',
    '2026-10-20T15:00:00.000Z',
    '2026-10-27T15:00:00.000Z',
    '2026-11-03T16:00:00.000Z', // still 09:00 local, one UTC hour later
    '2026-11-10T16:00:00.000Z',
  ])
})

test('UNTIL stops the series and COUNT caps it', () => {
  const daily = (rule: string) => wrap(ev(
    `UID:u\r\nDTSTART:20260914T170000Z\r\nDTEND:20260914T180000Z\r\nRRULE:${rule}`
  ))
  expect(startsIn(daily('FREQ=DAILY;UNTIL=20260916T170000Z'), '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual([
    '2026-09-14T17:00:00.000Z',
    '2026-09-15T17:00:00.000Z',
    '2026-09-16T17:00:00.000Z',
  ])
  expect(startsIn(daily('FREQ=DAILY;COUNT=2'), '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual([
    '2026-09-14T17:00:00.000Z',
    '2026-09-15T17:00:00.000Z',
  ])
})

test('INTERVAL=2 skips alternate periods', () => {
  const ics = wrap(ev('UID:i\r\nDTSTART:20260914T170000Z\r\nDTEND:20260914T180000Z\r\nRRULE:FREQ=DAILY;INTERVAL=2'))
  expect(startsIn(ics, '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual([
    '2026-09-14T17:00:00.000Z',
    '2026-09-16T17:00:00.000Z',
    '2026-09-18T17:00:00.000Z',
    '2026-09-20T17:00:00.000Z',
  ])
})

test('an event starting before the range but overlapping into it still blocks', () => {
  const overnight = wrap(ev('UID:n\r\nDTSTART:20260913T220000Z\r\nDTEND:20260914T060000Z'))
  expect(startsIn(overnight, '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual(['2026-09-13T22:00:00.000Z'])

  const recurringOvernight = wrap(ev(
    'UID:n2\r\nDTSTART:20260910T220000Z\r\nDTEND:20260911T060000Z\r\nRRULE:FREQ=DAILY'
  ))
  expect(startsIn(recurringOvernight, '2026-09-14T00:00:00Z', '2026-09-15T00:00:00Z')).toEqual([
    '2026-09-13T22:00:00.000Z',
    '2026-09-14T22:00:00.000Z',
  ])
})

test('an event entirely outside the range is not returned', () => {
  const after = wrap(ev('UID:o1\r\nDTSTART:20260925T170000Z\r\nDTEND:20260925T180000Z'))
  const before = wrap(ev('UID:o2\r\nDTSTART:20260901T170000Z\r\nDTEND:20260901T180000Z'))
  expect(startsIn(after, '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual([])
  expect(startsIn(before, '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual([])
  // an occurrence touching the boundary exactly does not count as busy
  const touching = wrap(ev('UID:o3\r\nDTSTART:20260913T230000Z\r\nDTEND:20260914T000000Z'))
  expect(startsIn(touching, '2026-09-14T00:00:00Z', '2026-09-21T00:00:00Z')).toEqual([])
})

test('a malformed VEVENT is skipped without throwing and siblings still parse', () => {
  const ics = wrap([
    ev('UID:bad1\r\nSUMMARY:No end\r\nDTSTART:20260915T170000Z'),
    ev('UID:bad2\r\nSUMMARY:Junk start\r\nDTSTART:not-a-date\r\nDTEND:20260915T180000Z'),
    ev('UID:bad3\r\nSUMMARY:Nothing at all'),
    ev('UID:good\r\nSUMMARY:Real\r\nDTSTART:20260915T170000Z\r\nDTEND:20260915T180000Z'),
  ].join('\r\n'))
  let out: ReturnType<typeof expandBusyIntervals> = []
  expect(() => { out = expandBusyIntervals(parseICal(ics), ...R) }).not.toThrow()
  expect(out.map((b) => b.uid)).toEqual(['good'])
})

test('MONTHLY and YEARLY step calendar units and skip impossible dates', () => {
  const monthly = parseICal(wrap(ev(
    'UID:m\r\nDTSTART:20260131T170000Z\r\nDTEND:20260131T180000Z\r\nRRULE:FREQ=MONTHLY'
  )))[0]
  expect(
    occurrenceStarts(monthly, Date.parse('2026-01-01T00:00:00Z'), Date.parse('2026-06-01T00:00:00Z')).map((ms) =>
      new Date(ms).toISOString()
    )
  ).toEqual([
    '2026-01-31T17:00:00.000Z',
    '2026-03-31T17:00:00.000Z', // February has no 31st — skipped, not rolled forward
    '2026-05-31T17:00:00.000Z',
  ])

  const yearly = parseICal(wrap(ev(
    'UID:y\r\nDTSTART:20260220T170000Z\r\nDTEND:20260220T180000Z\r\nRRULE:FREQ=YEARLY;INTERVAL=2'
  )))[0]
  expect(
    occurrenceStarts(yearly, Date.parse('2026-01-01T00:00:00Z'), Date.parse('2031-01-01T00:00:00Z')).map((ms) =>
      new Date(ms).toISOString()
    )
  ).toEqual(['2026-02-20T17:00:00.000Z', '2028-02-20T17:00:00.000Z', '2030-02-20T17:00:00.000Z'])
})
