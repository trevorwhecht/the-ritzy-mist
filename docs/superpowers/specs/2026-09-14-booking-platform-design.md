# The Ritzy Mist — Booking Platform Makeover (Design)

Date: 2026-09-14 · Status: DRAFT, awaiting Trevor's decisions (see §11)

Replaces the embedded Google Calendar appointment widget with a first-party booking
system: Prisma/Postgres, NextAuth accounts + guests (ported from onewitharts, "OWA"),
Apple Calendar (iCloud) availability + write-back, admin dashboard (Calendar, Users,
Insights, Settings), and Stripe subscriptions.

---

## 1. What exists today (this repo)

- Next 15.3 / React 19 / Tailwind 3 / `@nextui-org/react` 2.6 / framer-motion. No DB, no auth.
- Booking = `GoogleBookingWidget` iframe on `/services/spraytans[/[serviceName]]` and
  `/services/mobilespraytan[/...]`. `api/book-appointment` and `api/gmail`, `api/auth/google`,
  `api/auth/callback/google` are dead Google-API scaffolding.
- Editable content (pricing, care) = JSON in Vercel Blob behind `api/content/[key]` with a
  shared password (`PRICING_PASSWORD`, fallback `'6969'`) and `PasswordModal`.
- Services/prices live in `src/lib/pricingData.ts` (in-studio: OG New Client $55, OG Mist $65,
  OG+Powder $70, Rapid+Powder $80, Bridal Trial $75, Bridal Glow $85, Birthday Bronze $50;
  mobile: OG $75, Rapid $90, Bridal $100; add-ons $5/$8/$10) and again in
  `services/spraytans/[serviceName]/page.tsx` (`serviceMap`, duplicated).
- Housekeeping debt: both `next.config.js` and `next.config.ts` exist (Next only reads one),
  both `tailwind.config.js` and `.ts`; `nodemailer` and `@sendgrid/mail` both installed.

## 2. What we reuse from onewitharts (verified file paths)

| Concern | OWA source | Reuse mode |
|---|---|---|
| Prisma client singleton | `src/lib/db.ts` | copy |
| NextAuth (credentials + optional Google, JWT, guest upgrade) | `src/lib/auth.ts`, `src/types/next-auth.d.ts`, `api/auth/[...nextauth]` | copy, strip Employee branch (§11-A) |
| User zod schemas | `src/models/user.ts` (`guestInfoSchema`, `userSignupSchema`, `userUpdateSchema`) | copy, drop companyName/tiers/reseller |
| Create user / guest heuristics | `src/services/userService.ts`, `src/services/guestUserService.ts` (`findOrCreateGuestUser` → `PHONE_HAS_ACCOUNT` / `EMAIL_IN_USE`) | copy |
| Phone normalize | `src/lib/phone.ts` | copy |
| User APIs | `api/users/route.ts` (POST signup, PATCH), `api/users/guest`, `api/users/all`, `api/users/[id]/details` | copy, re-point details at appointments |
| Account menu + login/user dropdown | `components/accountMenu/*` (accountMenu, signIn, signUp, loggedIn, PhonePrompt, GoogleButton), `contexts/AuthModalContext.tsx`, nav toggle in `components/nav.tsx` | copy, rewrite `loggedIn.tsx` menus |
| Guest + user pickers | `components/GuestUserForm.tsx`, `components/PhoneInput.tsx`, `components/users/UserSearchSelect.tsx` (+ `UserTypeBadge`) | copy |
| Admin "3-way customer choice" (No Account Yet / New Guest / existing) | `quoteBuilder/quote-builder-content.tsx` L11931–12035; `OrdersView-AssignGuestModal.tsx`; `api/orders/[id]/assign-guest` (anti-hijack: `409` if owned and caller not staff) | re-implement as `CalendarView-NewAppointmentModal` + `api/appointments/[token]/claim` |
| Public share token | `Order.token` via `utils/tokenGenerator.ts` (`randomBytes(32).toString('base64url')`); copy button `OrdersView-ShareButton.tsx` | copy generator; `Appointment.token` |
| Dashboard shell (sidebar, `?view=` routing, dynamic view imports, admin gate) | `admin/dashboard/page.tsx`, `layout.tsx`, `admin/page.tsx` | copy, trim to 4 views |
| Calendar grid (rolling 4 weeks, prev/next/today, day cells, cards) | `views/calendar/CalendarView.tsx` (635), `-Card`, `-DayCell` | copy grid + navigation; DROP dnd-kit drag (§5.2) |
| Insights | `views/insights/InsightsView.tsx`, `-Filters`, `-Cards`, `-CardEditor`, `-ChartKit` (recharts), `-TopUsers`, `-ModalShell`, `insightsShared.ts` (`PeriodFilter`, `filterToQuery`), `lib/insightsDateRange.ts` | copy shell; replace metrics/queries |
| iCal parser (RRULE, EXDATE, RECURRENCE-ID, TZID, folding) | `src/lib/employeeCalendar.ts` (`parseICalCalendar` L394, `parseICalDateTime` L465) + test | copy parser core (~250 lines), drop shift/payroll parts |
| Stripe webhook skeleton (sig verify, retry status contract) | `api/stripe/webhook/route.ts` + `route.test.ts` | copy skeleton; subscription events are NET NEW (OWA has none) |
| Providers | `src/app/providers.tsx` (SessionProvider → HeroUIProvider → AuthModalProvider → ConfirmProvider → sonner Toaster) | copy |
| Settings key/value | `UniversalSettings` + `api/settings/universal` | copy as `Setting` |

NOT reused: Employee table/staffAccess, referral system, markup/pricing tiers, reseller/tax
deferral, signup-invite tokens (tier-bound), Orders views, dnd-kit, Cloudinary.

UI library: OWA is on `@heroui/react` (NextUI's rename). This repo is on `@nextui-org/react`.
Ported files import `@heroui/react`, so **migrate this repo to `@heroui/react`** in Phase 0
(rename imports in NavBar/providers; API is identical).

## 3. Data model (Prisma, Postgres)

```prisma
enum Role              { CUSTOMER ADMIN }
enum SkinTone          { PINK OLIVE }
enum ServiceLocation   { STUDIO MOBILE }
enum AppointmentStatus { BOOKED COMPLETED CANCELLED NO_SHOW }
enum SubscriptionStatus{ ACTIVE PAST_DUE CANCELLED INCOMPLETE }

model User {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  phone       String?           // NOT unique (OWA rule: unverified contact info)
  email       String?  @unique  // the account identifier
  password    String?           // bcrypt; null for guests and Google users
  isGuest     Boolean  @default(false)  // only guest test; never infer from password
  role        Role     @default(CUSTOMER)
  // ---- persistent tan profile (stays the same across visits) ----
  skinType    Int?              // 1–6 Fitzpatrick; CHECK (skinType BETWEEN 1 AND 6) in migration SQL
  skinTone    SkinTone?
  instagram   String?
  adminNotes  String?           // private to admin
  stripeCustomerId String? @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  appointments Appointment[]
  subscription Subscription?
}

model Service {
  id          String @id @default(cuid())
  slug        String @unique        // 'og-new-client' … matches today's URLs
  name        String
  description String
  priceCents  Int
  durationMin Int    @default(45)
  location    ServiceLocation
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)
  appointments Appointment[]
}

model AddOn {
  id String @id @default(cuid())
  name String; description String?; priceCents Int; isActive Boolean @default(true); sortOrder Int @default(0)
  appointments AppointmentAddOn[]
}

model Appointment {
  id        String  @id @default(cuid())
  token     String  @unique          // public share / claim link (43-char base64url)
  userId    String?                  // null = "No Account Yet" (admin-created, claimable via link)
  serviceId String
  startAt   DateTime @db.Timestamptz(3)
  endAt     DateTime @db.Timestamptz(3)   // startAt + service.durationMin
  status    AppointmentStatus @default(BOOKED)
  // ---- per-visit fields ----
  occasion     String?
  clientNotes  String?
  adminNotes   String?
  address      String?               // required when service.location = MOBILE
  priceCents   Int                   // snapshot of service price at booking
  paidWithSubscription Boolean @default(false)
  createdByAdmin Boolean @default(false)
  // ---- Apple Calendar mirror ----
  icalUid   String? @unique
  icalEtag  String?
  cancelledAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user    User?    @relation(fields: [userId], references: [id])
  service Service  @relation(fields: [serviceId], references: [id])
  addOns  AppointmentAddOn[]
  @@index([startAt])
  @@index([userId])
}

model AppointmentAddOn {
  appointmentId String; addOnId String; priceCents Int   // snapshot
  @@id([appointmentId, addOnId])
}

model Subscription {
  id String @id @default(cuid())
  userId String @unique
  stripeSubscriptionId String @unique
  stripePriceId String
  status SubscriptionStatus
  currentPeriodEnd DateTime
  cancelAtPeriodEnd Boolean @default(false)
  tansIncludedPerPeriod Int     // from plan config (§8)
  tansUsedThisPeriod    Int @default(0)
  createdAt DateTime @default(now()); updatedAt DateTime @updatedAt
}

/// External (Apple Calendar) busy time, already expanded from recurrences. Cache, not truth.
model ExternalBusyBlock {
  id String @id @default(cuid())
  calendarName String; uid String; summary String?
  startAt DateTime @db.Timestamptz(3); endAt DateTime @db.Timestamptz(3); isAllDay Boolean @default(false)
  syncedAt DateTime @default(now())
  @@index([startAt, endAt])
}

model Setting { key String @id; value Json; updatedAt DateTime @updatedAt }
// keys: businessHours, bookingRules, calendars, insightsCardLayout
```

Migration SQL added by hand (Prisma can't express these):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (tstzrange("startAt","endAt") WITH &&) WHERE (status = 'BOOKED');
ALTER TABLE "User" ADD CONSTRAINT user_skin_type_range CHECK ("skinType" IS NULL OR "skinType" BETWEEN 1 AND 6);
```

The instant columns must be `@db.Timestamptz` — Prisma otherwise maps `DateTime` to
`timestamp(3)` without a time zone and `tstzrange(...)` does not exist for that type.

The exclusion constraint makes double-booking structurally impossible regardless of race
conditions or which code path creates the row (public, admin, reschedule). If the hosted
Postgres refuses `btree_gist`, fallback = `pg_advisory_xact_lock(hash)` inside the booking
transaction. Decide in Phase 0 when the DB exists.

Settings JSON shapes:

```ts
businessHours: { 0:null, 1:{open:'09:00',close:'19:00'}, … 6:{…} }   // per weekday, null = closed
bookingRules:  { slotStepMin:5, externalBufferMin:30, leadTimeMin:120, maxAdvanceDays:60,
                 cancelCutoffHours:24, syncStaleMin:5, timeZone:'America/Boise' }
calendars:     { blocking:['Personal','Work'], booking:'Ritzy Mist Bookings' }
```

## 4. Availability engine (pure, tested)

`src/lib/booking/availability.ts` — no I/O, one exported function:

```ts
computeSlots({ dayStart, dayEnd, durationMin, stepMin, now, leadTimeMin,
               appointments: Interval[],           // BOOKED only, no buffer
               busyBlocks: Interval[], bufferMin }) // external, block = [start, end + bufferMin]
  → Date[]   // slot start times
```

Rules (all from the ask):
- slots every **5 min**; appointment occupies **durationMin = 45** (per Service, default 45)
- slot `t` valid iff `[t, t+45)` inside business hours, `t ≥ now + leadTime`, and
  `[t, t+45)` overlaps no appointment `[a.start, a.end)` and no busy block `[b.start, b.end+30)`
- **no buffer after a spray tan**: back-to-back appointments allowed
- all-day external events block the whole day (assumption — §11-D)
- external events with `TRANSP:TRANSPARENT` (marked "free") or `STATUS:CANCELLED` are ignored

`availability.test.ts` covers: 30-min buffer edge (event ends 12:00 → first slot 12:30),
back-to-back tans, lead time, closed day, all-day block, DST day.

Time zone: business TZ from settings (`America/Boise`); everything stored UTC; day boundaries
computed with `date-fns-tz`.

## 5. Apple Calendar (iCloud) integration

### 5.1 Transport — CalDAV, not a published webcal URL
OWA reads a *published* iCloud feed (`EMPLOYEE_CALENDAR_URL`, read-only, refreshed by Apple on
its own schedule, often hours late). That is fine for payroll, not for "you may not book here
for the next 30 minutes". Recommendation: **CalDAV via `tsdav`** against
`https://caldav.icloud.com` with an Apple ID + app-specific password. That gives near-real-time
reads of any number of calendars *and* lets us write appointments back into a calendar Kayla
sees on her phone.

Env: `ICLOUD_APPLE_ID`, `ICLOUD_APP_PASSWORD` (app-specific, 2FA account),
`ICLOUD_BLOCKING_CALENDARS="Personal,Work"`, `ICLOUD_BOOKING_CALENDAR="Ritzy Mist Bookings"`.
Calendar names are also editable in Settings (populated from `listCalendars()`).

### 5.2 Modules (`src/lib/appleCalendar/`)
- `client.ts` — `getClient()`, `listCalendars()`, `fetchIcs(calendarName, start, end)` (tsdav
  `fetchCalendarObjects` with `timeRange`, `expand: true`).
- `ical.ts` — OWA's `parseICalCalendar` / `parseICalDateTime` ported (RRULE/EXDATE/
  RECURRENCE-ID/TZID/all-day) as belt-and-braces if iCloud does not honor `expand`.
- `sync.ts` — `syncBusyBlocks(rangeStart, rangeEnd)`: fetch blocking calendars → parse →
  replace `ExternalBusyBlock` rows in range → update `Setting.calendarSync.lastSyncedAt`.
  Called lazily by `GET /api/availability` when older than `syncStaleMin` (5). No cron.
- `mirror.ts` — `pushAppointment(appt)` (create/update VEVENT in booking calendar:
  summary `"Spray Tan · Jane D · OG Mist"`, location, description with occasion/phone/link),
  `removeAppointment(appt)`. Best-effort: on failure log, leave `icalUid` null, admin modal shows
  a "Push to Apple Calendar" retry button. The booking calendar is **never** in the blocking
  list (else our own tans would get a 30-min buffer via the mirror).
- `buildIcs(appt)` shared with the customer confirmation email ("Add to calendar" attachment).

### 5.3 Double-booking guard at write time
`POST /api/appointments` runs inside one transaction: live CalDAV time-range check for
`[start, end+30)` on blocking calendars (1 small query, not a full sync) → recompute slot
validity → insert. The exclusion constraint (§3) is the last line of defense.

### 5.4 Spike first (½ day, throwaway)
Before Phase 1 code: script that logs into iCloud with the app password, lists calendars,
fetches a week of one calendar with `expand:true`, and prints instances. Confirms auth,
recurrence expansion, and TZ handling. Output is a yes/no on `expand`, nothing kept.

## 6. Public booking flow — `/book`

Replaces the Google iframe pages. `/services/spraytans/[serviceName]` and
`/services/mobilespraytan/[serviceName]` become redirects to `/book?service=<slug>` so the
pricing-page links keep working.

Single client page, children named per `{Container}-{Child}`:

1. `Book-ServiceStep` — services from `GET /api/services` (grouped In-Studio / Mobile), add-on
   checkboxes. Skin-type chart (`SkinTypesOnly`) shown alongside as today.
2. `Book-DateStep` — month grid, prev/next month (not before today, not past `maxAdvanceDays`);
   days with zero availability greyed (`GET /api/availability/days?month=&serviceId=` returns
   a day→count map computed server-side from cached busy blocks).
3. `Book-TimeStep` — `GET /api/availability?date=&serviceId=` → slot list. UI: one row per
   hour, each expands to its 5-minute chips (12 per hour). Only hours with ≥1 slot render.
4. `Book-DetailsStep`
   - signed in → profile prefilled (skin type/tone/instagram editable inline, saved to User),
     occasion + notes + address (mobile only).
   - not signed in → three buttons: **Sign in**, **Create account**, **Continue as guest**
     (`GuestUserForm` + the profile fields). Same modal/flow as OWA's account menu; the
     guest path calls the public `POST /api/appointments` with `{ guest: {...} }` and the
     server runs `findOrCreateGuestUser` (409 `PHONE_HAS_ACCOUNT` → "that number has an
     account, please sign in"; `EMAIL_IN_USE` → soft-ask, continue without email).
5. `Book-ConfirmStep` — summary → `POST /api/appointments` → redirect to
   `/appointment/[token]`.

`POST /api/appointments` body (zod):
```ts
{ serviceId, startAt, addOnIds[], occasion?, clientNotes?, address?,
  guest?: GuestInfo, profile?: { skinType?, skinTone?, instagram? } }
```
Validation layers: zod at the route (entry), `computeSlots` re-check + live CalDAV check
(business logic), exclusion constraint (DB), `console.error('DEBUG:', …)` before insert on
failure (instrumentation).

Confirmation email (SendGrid, existing dep; drop nodemailer): details, share link, `.ics`
attachment. Admin gets a copy.

### 6.1 Public appointment page — `/appointment/[token]`
`GET /api/appointments/[token]` (no auth, strips adminNotes). Shows details, "Add to
calendar", reschedule (re-uses `Book-DateStep`/`Book-TimeStep`) and cancel while
`now < start - cancelCutoffHours`. If `userId` is null (admin "No Account Yet") the page
asks the visitor to claim it: sign in, or `GuestUserForm` → `POST /api/appointments/[token]/claim`
(OWA assign-guest rules: 409 if already owned and caller is not admin).

## 7. Admin dashboard — `/admin/dashboard?view=calendar|users|insights|settings`

Shell copied from OWA (sidebar + `?view=` + `next/dynamic` per view + admin gate in
`layout.tsx`). Login at `/admin` and via the nav account menu. Default view = calendar.

### 7.1 CalendarView (`views/calendar/`)
- `CalendarView.tsx` — OWA's rolling 4-week grid, prev/next week + Today (this is the
  "go back in history" requirement; there is no lower bound). `GET /api/appointments?start&end`
  includes user + service. Drag-and-drop removed: rescheduling a 45-min slot by dragging onto a
  *day* is meaningless; it goes through the modal's slot picker instead.
- `CalendarView-DayCell.tsx` — copied; adds a "+" that opens the New Appointment modal for
  that day. Clicking a cell with many cards opens `CalendarView-DayList` (OWA's mobile
  overlay, promoted to all sizes) sorted by time.
- `CalendarView-Card.tsx` — `9:05 · Jane D · OG Mist`, status colour (booked / completed /
  cancelled / no-show), guest badge, "no account" badge, red dot if `icalUid` is null.
- `CalendarView-AppointmentModal.tsx` — opened by clicking a card. Client block (name, phone,
  email, skin type/tone, instagram, link to Users view), visit block (service, add-ons,
  occasion, notes, address, price), actions: **Copy public link** (`origin + /appointment/{token}`,
  OWA ShareButton behaviour), Reschedule (slot picker with `adminOverride` = ignore business
  hours/lead time, still blocks on conflicts), Mark completed / no-show, Cancel, Push to
  Apple Calendar, edit admin notes.
- `CalendarView-NewAppointmentModal.tsx` — admin create. Customer chooser is OWA's three
  branches verbatim: **No Account Yet** (`userId: null`, link shared after), **New Guest**
  (`GuestUserForm` → `POST /api/users/guest`; on 409 `PHONE_HAS_ACCOUNT` select that user),
  **existing** (`UserSearchSelect`). Then service, add-ons, slot picker (`adminOverride`),
  per-visit fields. `POST /api/appointments` with `createdByAdmin: true`.

### 7.2 UsersView (`views/users/`)
OWA's file is a 1332-line monolith; we build it split from day one:
- `UsersView.tsx` — `UserSearchSelect` + recent-users list with `UserTypeBadge`, "New guest"
  button (`GuestUserForm`).
- `UsersView-Profile.tsx` — editable persistent fields (name, phone, email, skin type 1–6,
  skin tone, instagram, admin notes), guest/account badge, membership status.
  `PATCH /api/users/[id]` (admin) — reuses `userUpdateSchema`.
- `UsersView-Appointments.tsx` — history table (date, service, add-ons, occasion, status,
  price), totals (visits, lifetime spend, last visit), click → the same AppointmentModal.
  Data from `GET /api/users/[id]/details` (OWA route re-pointed at appointments).

### 7.3 InsightsView (`views/insights/`)
OWA shell (Filters year/month/range, Cards + CardEditor with DB-saved layout, ChartKit,
TopUsers, ModalShell) with spray-tan metrics computed by `GET /api/admin/insights`:
- cards: revenue, appointments, completed, cancelled, no-show rate, new clients, returning
  rate, avg ticket, add-on attach rate, active members, MRR
- charts: revenue trend (area), bookings by weekday × hour (bars), service mix and occasion
  mix (donuts)
- top clients by visits / revenue with drill-down to their appointments
Queries are Prisma `groupBy` / one raw SQL per chart, filtered on `startAt` in range.

### 7.4 SettingsView (`views/settings/`)
- `SettingsView-Hours.tsx` — per-weekday open/close, closed toggle; booking rules (lead time,
  max advance, cancel cutoff).
- `SettingsView-Calendars.tsx` — blocking calendars (multi-select from `listCalendars()`),
  booking calendar, "sync now", last sync + last error.
- `SettingsView-Services.tsx` — Service and AddOn CRUD (name, price, duration, location,
  active, order). **Decision §11-E**: the public pricing page then reads from these tables and
  the Blob-JSON + `'6969'` password editing goes away.
- `SettingsView-Membership.tsx` — Stripe price id + tans included per period.

## 8. Accounts, nav, and Stripe subscriptions

- **Nav**: OWA's account icon → `AccountMenu` (sign in / sign up / guest / logged-in
  dropdown). `loggedIn.tsx` menus rewritten: customer → Appointments, Profile, Membership,
  Log out; admin → Calendar, Users, Insights, Settings, Log out. Google sign-in stays
  optional exactly as OWA does (provider only registered when `GOOGLE_CLIENT_ID/SECRET` set).
- **`/account`**: upcoming + past appointments, profile (persistent fields), membership.
- **Subscriptions** (net new; OWA has none): requires a full account (`isGuest=false`,
  email). `POST /api/stripe/checkout` → Checkout Session `mode: 'subscription'`, reusing/
  creating `stripeCustomerId`. `POST /api/stripe/portal` → Customer Portal (cancel, card).
  `POST /api/stripe/webhook` handles `checkout.session.completed`,
  `customer.subscription.created|updated|deleted`, `invoice.paid` (reset `tansUsedThisPeriod`),
  `invoice.payment_failed` → upsert `Subscription`. Booking step shows "Use membership visit
  (2 of 3 left)" when `status=ACTIVE` and credits remain → `paidWithSubscription=true`,
  increments usage inside the booking transaction.
  Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_MEMBERSHIP_PRICE_ID`. What the membership *includes* is open (§11-F).
- Pay-per-visit card payment at booking is **not** in scope (today's Google form takes no
  payment). Easy to add later with a PaymentIntent on the same booking transaction.

## 9. Phases (each ends with `next build` green and its tests passing)

Written task-by-task plans (TDD steps, exact code, verification commands):
- Phase 0 — `docs/superpowers/plans/2026-09-14-phase-0-foundations.md` (7 tasks)
- Phase 1 — `docs/superpowers/plans/2026-09-14-phase-1-availability-apple-calendar.md` (8 tasks)
- Phases 2–6 get their own plan documents, each written just before that phase starts, so
  they can absorb what the previous phase actually shipped.

| # | Phase | Deliverables | Tests |
|---|---|---|---|
| 0 | Foundations | Next 16 + HeroUI upgrade, single `next.config.ts`/`tailwind.config.ts`, CSS tokens, jest; Prisma schema + migrations (incl. SQL constraints), `lib/db.ts`, seed (services/add-ons from `pricingData.ts`, admin user, default settings); NextAuth + `proxy.ts` + user/guest services + APIs; providers, AccountMenu in nav, `/account` shell + skeleton; delete dead Google-API routes (the booking iframe stays until Phase 2) | phone, zod models, guestUserService, users route |
| 1 | Availability + Apple Calendar | spike (§5.4) → `appleCalendar/*`, `ExternalBusyBlock` sync, `computeSlots`, `GET /api/availability[/days]`, Settings model + hours/calendars settings API | availability, ical parser |
| 2 | Public booking | `/book` steps + `Book-Skeleton`, `POST /api/appointments` (guest/account/profile), mirror to iCloud, SendGrid confirmation + ics, `/appointment/[token]` (view/reschedule/cancel/claim) + `layout.tsx` OG metadata + `/api/og/appointment/[token]`, old URLs redirect | appointments route (conflict, buffer, claim 409s), buildIcs |
| 3 | Admin calendar | dashboard shell, CalendarView + DayList + Card, AppointmentModal (share link, reschedule, status, push), NewAppointmentModal (3-way customer), admin appointment APIs | — (manual via Playwright walk-through) |
| 4 | Users + Insights + Settings | UsersView split, details API, InsightsView + insights API, SettingsView (hours, calendars, services, membership) | insights range helpers |
| 5 | Stripe subscriptions | checkout, portal, webhook, `Subscription` upserts, membership credit in booking, `/account` membership | webhook (copy OWA test harness) |
| 6 | Cleanup | pricing page from DB, remove Blob/`'6969'` editing + `PasswordModal`, remove `GoogleBookingWidget`, CSP `frame-src` for Google, `SkinTypes` duplication | build |

Dependencies added: `prisma`, `@prisma/client`, `next-auth@4`, `bcryptjs`, `zod`,
`date-fns`, `date-fns-tz`, `tsdav`, `stripe`, `@stripe/stripe-js`, `recharts`, `sonner`,
`@heroui/react` (replacing `@nextui-org/react`). Removed: `googleapis`,
`@google-cloud/local-auth`, `nodemailer`, `@nextui-org/react`.

Env vars needed from Trevor: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`ICLOUD_APPLE_ID`, `ICLOUD_APP_PASSWORD`, `ICLOUD_BLOCKING_CALENDARS`,
`ICLOUD_BOOKING_CALENDAR`, `SENDGRID_API_KEY`, `BOOKING_FROM_EMAIL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed only),
`STRIPE_*` (Phase 5), optional `GOOGLE_CLIENT_ID/SECRET`.

## 10. File layout (new)

```
prisma/schema.prisma, prisma/migrations/, prisma/seed.ts
src/lib/db.ts · auth.ts · phone.ts · tokenGenerator.ts
src/lib/booking/availability.ts (+ .test.ts) · slots.ts (server: load hours/blocks → computeSlots)
src/lib/appleCalendar/client.ts · ical.ts (+ .test.ts) · sync.ts · mirror.ts · buildIcs.ts
src/lib/email/appointmentEmails.ts
src/lib/apiResponse.ts (OWA error reader: never blind .json() on a failed response)
src/lib/money.ts (parsePriceCents / formatCents)
src/components/ui/Skeleton.tsx · components/shared/skeletons/{TableSkeleton,CardGridSkeleton,FormSkeleton}.tsx
proxy.ts (Next 16 middleware: /admin → role ADMIN, /account → signed in)
src/lib/settings.ts (typed get/set for Setting keys)
src/models/user.ts · appointment.ts (zod)
src/services/userService.ts · guestUserService.ts · appointmentService.ts
src/types/next-auth.d.ts
src/contexts/AuthModalContext.tsx · ConfirmContext.tsx
src/components/accountMenu/* · GuestUserForm.tsx · PhoneInput.tsx · users/UserSearchSelect.tsx
src/components/booking/SlotPicker.tsx · SlotPicker-Month.tsx · SlotPicker-Times.tsx  (shared by /book, reschedule, admin)
src/app/book/{page,loading}.tsx + Book-*.tsx + Book-Skeleton.tsx
src/app/appointment/[token]/{page,layout,loading}.tsx · Appointment-Skeleton.tsx · api/og/appointment/[token]/route.tsx
src/app/account/{page,loading}.tsx (+ Account-*.tsx, Account-Skeleton.tsx)
src/app/admin/page.tsx · admin/dashboard/{layout,page,loading}.tsx · views/{calendar,users,insights,settings}/* (each view has a `*-Skeleton.tsx`)
src/app/api/auth/[...nextauth] · users/{route,guest,all,[id]/details,[id]} · services · availability[/days]
src/app/api/appointments/{route,[token],[token]/claim} · admin/appointments/[id]/{route,push-calendar}
src/app/api/admin/{insights,settings,calendars} · stripe/{checkout,portal,webhook}
```

## 11. DECISIONS NEEDED FROM TREVOR (plan assumes the first option unless told otherwise)

- **A. ADMIN ROLE ON `User` INSTEAD OF OWA'S `Employee` TABLE.** OWA keeps staff in a separate
  table because it has payroll/hours. Ritzy Mist has one owner; a `role` enum on `User`
  removes ~150 lines from `auth.ts`. This is a deviation from "reuse OWA exactly".
- **B. CALDAV (APPLE ID + APP PASSWORD) INSTEAD OF A PUBLISHED WEBCAL URL** — see §5.1.
  Requires Kayla to create an app-specific password at appleid.apple.com. If she'd rather only
  share published calendar links, blocking data can lag by hours and there is no write-back.
- **C1. UPGRADE THIS REPO FROM NEXT 15.3 TO NEXT 16.x IN PHASE 0.** onewitharts is on 16.3 and every
  ported file targets it (`proxy.ts`, async `params`, Turbopack dev). Staying on 15 means patching
  each port. See §12.
- **C2. PRISMA VERSION.** OWA is on Prisma 5.22. If your `prisma init` produces Prisma 7
  (`prisma.config.ts`, driver adapters), `db.ts` differs slightly; everything else in this plan
  is version-agnostic. Tell me which you created.
- **D. ALL-DAY EXTERNAL EVENTS BLOCK THE WHOLE DAY** (birthdays, "vacation"). Alternative: ignore
  all-day events entirely.
- **E. PRICING PAGE MOVES TO THE DB** (Phase 6) so services/prices exist once. Alternative:
  keep Blob JSON and duplicate prices into `Service` (violates the no-duplication rule).
- **F. WHAT A MEMBERSHIP INCLUDES** (e.g. 1 tan/month for $X, add-on discount?). Needed before
  Phase 5. Plan supports "N tans per billing period".
- **G. MOBILE SPRAY TANS: address required, no travel buffer** (per "no buffer after a spray
  tan"). If travel time should block the calendar, say how many minutes.
- **H. CANCELLATION CUTOFF** default 24 h, editable in Settings.
- **I. GROUP SPRAY TANS** stay contact-form only (not bookable online).
- **J. HEROUI (NEXTUI'S RENAME), NOT SHADCN.** The `nextjs-ui` skill is shadcn-first, but every
  onewitharts component we port (`Input`, `Autocomplete`, `Modal`, `Button`) is HeroUI, and this
  repo already runs NextUI. Switching to shadcn would mean rewriting each port. The rest of
  `nextjs-ui` (mobile, forms, skeletons, a11y, OG links) applies unchanged — see §12.

## 12. Platform and UI standards (apply to every phase)

Derived from the `ecc:nextjs-turbopack` and `nextjs-ui` skills, adapted to HeroUI + Tailwind 3.

### 12.1 Framework
- **Next 16.x** (decision C1). `next dev` uses Turbopack by default; do not add `--webpack`.
  `next build` must be green at the end of every task. Middleware file is `proxy.ts` at the
  repo root (Next 16 name), not `middleware.ts`.
- One config each: `next.config.ts` (delete `next.config.js`), `tailwind.config.ts` with the
  `heroui()` plugin (delete `tailwind.config.js`). `images.remotePatterns` replaces the
  deprecated `images.domains`.
- `export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }` and
  `export const metadata` in `app/layout.tsx` replace the hand-written `<meta>` tags. The
  `user-scalable=no` in today's viewport meta is dropped (accessibility).
- Heavy client code loads on demand: dashboard views via `next/dynamic`, recharts with
  `ssr: false` (OWA pattern). Server-only libraries (`tsdav`, `stripe`, `bcryptjs`, Prisma) are
  imported only from route handlers, `lib/`, and `services/`, never from components.
- Business logic in `lib/` and `services/` never imports `next/*` (framework at the edges).
- Tests: jest + ts-jest, OWA's `jest.config.js` copied (`testMatch` covers `src/lib`,
  `src/services`, `src/models`, `src/app/**/*.test.ts`; `@/` mapped to `src/`).

### 12.2 Theme
- Tailwind stays on 3.4 (matches OWA). Colors are CSS variables referenced as
  `bg-[var(--color-primary)]`; never raw palette classes in new code.
- Tokens in `globals.css` `:root` (the site is single-look dark; no `dark:` variants):
  `--color-primary: #d59586`, `--color-primary-hover: #c48576`, `--color-background: #000000`,
  `--color-surface: #18181b`, `--color-border: #3f3f46`, `--color-foreground: #ffffff`,
  `--color-muted: #a1a1aa`, `--color-danger: #f87171`, `--color-success: #4ade80`,
  `--color-warning: #fbbf24`. Existing `text-[#d59586]` literals migrate to the token as files
  are touched.
- No `.claude/rules/ui-theme.md` exists in this repo. Before Phase 2 UI work, either run
  `/ui-ux-pro-max` to generate one or accept the tokens above as the style guide.
- Z-index scale: `z-10` sticky, `z-20` dropdowns/popovers, `z-40` modals, `z-[100]` toasts.

### 12.3 Mobile (mobile-first, every component)
- `min-h-dvh` / `h-dvh`, never `h-screen`. Page containers `px-4 md:px-6 lg:px-8`.
- Tappable elements `min-h-11 touch-manipulation`; inputs `text-base` (Safari zoom); correct
  `type`/`inputMode`/`autoComplete` (`tel`, `email`, `given-name`, `family-name`,
  `current-password`, `new-password`).
- Modal footers with actions: `pb-[max(1rem,env(safe-area-inset-bottom))]`.
- No hover-only affordances (`sm:opacity-0 sm:group-hover:opacity-100` pattern if needed).
- No `overflow-hidden` on any ancestor of a form; inner `overflow-y-auto` only when the
  viewport is genuinely full (desktop dashboard columns).
- Tables: `<div className="w-full overflow-x-auto"><Table className="min-w-[Npx]">` with
  `whitespace-nowrap` cells; never wrap or truncate data.
- The 5-minute slot picker renders one row per hour (collapsed) → 12 chips; chips are
  `<button aria-pressed>` at `min-h-11`. Lists stay under 50 rendered nodes, so no
  virtualization is needed.

### 12.4 Modal-first
| Situation | Component |
|---|---|
| Appointment detail, new appointment (admin) | HeroUI `Modal` |
| Multi-field profile edit | HeroUI `Modal` (no Sheet in HeroUI; keep one modal component) |
| Destructive (cancel appointment, delete service) | ported `ConfirmContext` (`useConfirm()`), primary button `autoFocus` |
| Feedback | `sonner` toast (`theme="dark"`, OWA styling) |
| Card list → detail | card click opens the modal, never a new route |
Every overlay has an explicit background (`bg-[var(--color-surface)]` or `-background`).

### 12.5 Forms
- `<form onSubmit>` + `type="submit"`; pending state via `useTransition` with a Lucide
  `Loader2` spinner in the button; validate on blur; errors render below the field.
- Zod schema shared between the client form and the route handler (entry-point validation).

### 12.6 Loading
- `components/ui/Skeleton.tsx` primitive with a shimmer sweep and `motion-reduce:before:animate-none`
  (extend the existing `PricingTabs-Skeleton.tsx` pattern; fill `bg-[var(--color-border)]`).
- Every data-driven page/view has a colocated `{Container}-Skeleton.tsx` mirroring its layout,
  and every dynamic route a `loading.tsx` that renders it. Static chrome (dashboard sidebar,
  headings) renders instantly from `layout.tsx` and is never skeletoned. Independent data
  sources gate their own regions.
- Spinners only on action buttons.

### 12.7 Accessibility
- `aria-label` on icon-only buttons; `focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]`,
  never bare `outline-none`; one `h1` per page, no skipped levels; status = color + icon/text
  (booked/completed/cancelled/no-show never color-only); Lucide icons only, no emoji icons
  (service names in the DB keep their emoji as *content*, but UI chrome uses icons).
- Animations: `transform`/`opacity` only, 150–300 ms, `motion-reduce:transition-none`.

### 12.8 Shareable appointment link
- URL: `${origin}/appointment/${token}?name=${encodeURIComponent('Jane D · OG Mist')}`.
- `app/appointment/[token]/layout.tsx` exports `generateMetadata` (`force-dynamic`): title
  `Appointment — Jane D · OG Mist | The Ritzy Mist`, `openGraph` + `twitter: summary_large_image`,
  image `/api/og/appointment/[token]?v=${updatedAt.getTime()}`.
- `app/api/og/appointment/[token]/route.tsx` returns a 1200×630 `ImageResponse` (`next/og`),
  `Cache-Control: no-store`, fallback static image from `/public` when not found. Public data
  only (no admin notes, no phone).

### 12.9 Errors
- Client fetches read failures through the ported `lib/apiResponse.ts` `extractApiErrorMessage`
  (content-type aware; Vercel returns plain-text 413s).
- Route handlers: zod → 400 with `details`; auth → 401; ownership/conflict → 409 with a `code`
  (`PHONE_HAS_ACCOUNT`, `EMAIL_IN_USE`, `SLOT_TAKEN`, `OUTSIDE_HOURS`); unexpected → 500 after
  `console.error('DEBUG:', { …context })`.
