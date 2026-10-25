# Phase 0 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give The Ritzy Mist a database, accounts (with guests), an admin role, and the account menu, so every later phase builds on a working, tested base — without breaking the current Google-iframe booking.

**Architecture:** Port onewitharts' (OWA, `/Users/trevorhecht/Developer/repos/onewitharts`) auth/user/guest layer file-by-file onto a Prisma/Postgres schema designed for appointments. Business logic lives in `src/lib` and `src/services` (no `next/*` imports); Next.js stays at route handlers, `proxy.ts`, and pages.

**Tech Stack:** Next 16 (Turbopack dev), React 19, Tailwind 3.4, `@heroui/react` 2.7, Prisma 6 + Postgres, NextAuth 4 (JWT), bcryptjs, zod, jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-09-14-booking-platform-design.md` (§2 reuse table, §3 schema, §11 decisions, §12 standards).

## Global Constraints

- **No git write commands.** Trevor stages and commits himself. Each task ends with a "Ready to commit" note and a suggested message; never run `git add`/`commit`.
- Exact version pins in `package.json` for `next`, `react`, `react-dom`, `@heroui/react`, `prisma`, `@prisma/client` (no `^`).
- `npm run build` green and `npm test` green at the end of every task.
- `src/` only; `@/` → `src/`. Child components `{Container}-{Child}.tsx`. ~250 lines per file.
- Colors via CSS variables `bg-[var(--color-primary)]`; no raw palette classes in new code (spec §12.2).
- Mobile rules (spec §12.3): `min-h-dvh`, inputs `text-base`, buttons `min-h-11 touch-manipulation`, `inputMode`/`autoComplete` set.
- Business logic and services never import `next/*`.
- The current booking iframe (`GoogleBookingWidget`, `/services/spraytans*`) keeps working through this whole phase.
- Decisions assumed (spec §11): A (role on `User`), C1 (Next 16), C2 (Prisma 6), J (HeroUI).

> **STATUS 2026-09-15 — Phase 0 implemented.** Every task is done and verified except the two
> steps that require a live database (Task 2 Steps 7 and 11: `prisma migrate dev` and
> `prisma db seed`). Verification at time of writing: `npx tsc --noEmit` clean,
> `npx jest` 7 suites / 24 tests passing, `next build` succeeds, `npx eslint` clean across all
> new code. Nothing is committed — the working tree is left for Trevor to stage.
>
> Corrections made against this plan while implementing it are recorded in the tasks below and
> summarised at the bottom under "Implementation notes".

---

### Task 1: Toolchain — Next 16, HeroUI, jest, single configs, theme tokens

**Files:**
- Modify: `package.json`
- Delete: `next.config.js`, `tailwind.config.js`
- Modify: `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` (verify), `src/app/globals.css`, `src/app/layout.tsx`, `src/app/providers.tsx`, `src/components/Layout/NavBar.tsx`
- Create: `jest.config.js`, `src/lib/smoke.test.ts` (deleted again in Task 3)

**Interfaces:**
- Produces: `npm test` (jest), `npm run dev` (Turbopack), CSS tokens `--color-*` (spec §12.2).

- [x] **Step 1: Swap dependencies**

```bash
cd /Users/trevorhecht/Developer/repos/the-ritzy-mist-google
npm uninstall @nextui-org/react googleapis @google-cloud/local-auth nodemailer
npm install next@16 react@19 react-dom@19 @heroui/react@2 framer-motion@12 \
  next-auth@4 bcryptjs zod@3 date-fns@4 date-fns-tz@3 sonner@1 validator @prisma/client@6
npm install -D prisma@6 jest@29 ts-jest@29 @types/jest @types/bcryptjs @types/validator tsx eslint eslint-config-next@16
```

Then pin: open `package.json` and remove the `^` from `next`, `react`, `react-dom`, `@heroui/react`, `prisma`, `@prisma/client`. Add scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint .",
  "test": "jest",
  "postinstall": "prisma generate"
},
"prisma": { "seed": "tsx prisma/seed.ts" }
```

(`prisma generate` in `build`/`postinstall` will fail until Task 2 creates the schema — run `npm run build` at the end of Task 2 instead; in this task use `npx next build`.)

- [x] **Step 2: One Next config**

Delete `next.config.js`. Replace `next.config.ts` with:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'static.wixstatic.com' },
      { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '7njnoxrfmp9jlkvi.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    // Google booking iframe stays until Phase 2 replaces it with /book.
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: "frame-src 'self' calendar.google.com;" }] }]
  },
}

export default nextConfig
```

- [x] **Step 3: One Tailwind config with the HeroUI plugin**

Delete `tailwind.config.js`. Replace `tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'
import { heroui } from '@heroui/react'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  darkMode: 'class',
  plugins: [heroui()],
} satisfies Config
```

- [x] **Step 4: Theme tokens**

In `src/app/globals.css` replace the existing `:root` block and the `prefers-color-scheme` block with:

```css
:root {
  --color-primary: #d59586;
  --color-primary-hover: #c48576;
  --color-background: #000000;
  --color-surface: #18181b;
  --color-border: #3f3f46;
  --color-foreground: #ffffff;
  --color-muted: #a1a1aa;
  --color-danger: #f87171;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  /* legacy aliases used by existing pages */
  --background: var(--color-background);
  --foreground: var(--color-foreground);
  --hover-color: var(--color-primary);
}

@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
```

- [x] **Step 5: Layout — `viewport`/`metadata` exports, drop jQuery**

First confirm jQuery is unused: `grep -rn "jQuery\|\$(" src --include='*.tsx' --include='*.ts'` must return nothing. Then in `src/app/layout.tsx` delete the whole `<head>` block and the `<script src="https://code.jquery.com/...">` line, keep the Meta Pixel `<Script>` (move it inside `<body>` as the first child), and add above the component:

```tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'The Ritzy Mist',
  description: 'Professional mobile and in-studio spray tanning. Book your appointment today!',
  openGraph: {
    title: 'The Ritzy Mist - Mobile Spray Tanning',
    description: 'Professional mobile spray tanning services. Book your appointment today!',
    url: 'https://theritzymist.com',
    type: 'website',
    images: ['https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/Meta-data/RitzyMist-Landscape.jpg'],
  },
  twitter: { card: 'summary_large_image', title: 'The Ritzy Mist - Mobile Spray Tanning', images: ['https://7njnoxrfmp9jlkvi.public.blob.vercel-storage.com/Meta-data/RitzyMist-Landscape.jpg'] },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }
```

Wrap `<body>` children as today; change `<main className="pt-16 sm:pt-[65px]">` to `<main className="pt-16 sm:pt-[65px] min-h-dvh">`.

- [x] **Step 6: Rename NextUI imports**

`src/app/providers.tsx`: `import { HeroUIProvider } from '@heroui/react'` and render `<HeroUIProvider>`. `src/components/Layout/NavBar.tsx`: change `from "@nextui-org/react"` to `from "@heroui/react"`; rename the `NextUILink` alias to `HeroLink` (both import and JSX). Run `grep -rn "@nextui-org" src` — must be empty.

- [x] **Step 7: jest config + smoke test**

`jest.config.js` (OWA's, trimmed):

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/lib/**/*.test.ts', '<rootDir>/src/services/**/*.test.ts', '<rootDir>/src/models/**/*.test.ts', '<rootDir>/src/app/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', moduleResolution: 'node' } }] },
}
```

`src/lib/smoke.test.ts`: `test('jest runs', () => { expect(1 + 1).toBe(2) })`

- [x] **Step 8: Verify**

Run: `npm test` → 1 passed. Run: `npx next build` → completes. Run: `npm run dev` → banner says Turbopack; open `/`, `/pricing`, `/services/spraytans` and confirm the nav, pricing tabs, and Google iframe still render.

- [x] **Step 9: Ready to commit** — suggested message: `chore: upgrade to Next 16 + HeroUI, single configs, theme tokens, jest`

---

### Task 2: Prisma schema, migrations, client, seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`, `src/lib/money.ts`, `src/lib/money.test.ts`, `src/lib/settingsDefaults.ts`, `.env.example`
- Delete: `src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` from `.env`.
- Produces: `prisma` default export from `@/lib/db`; enums `Role`, `SkinTone`, `ServiceLocation`, `AppointmentStatus`, `SubscriptionStatus`; `parsePriceCents(s: string): number`, `formatCents(c: number): string`; `SETTING_DEFAULTS` (used by Phase 1 `lib/settings.ts`).

- [x] **Step 1: Failing test for money helpers**

`src/lib/money.test.ts`:

```ts
import { parsePriceCents, formatCents } from './money'

test('parsePriceCents reads dollar strings from pricingData', () => {
  expect(parsePriceCents('$55')).toBe(5500)
  expect(parsePriceCents('$7.50')).toBe(750)
  expect(parsePriceCents('  $100 ')).toBe(10000)
})
test('parsePriceCents throws on junk', () => {
  expect(() => parsePriceCents('free')).toThrow('Unparseable price')
})
test('formatCents', () => {
  expect(formatCents(5500)).toBe('$55')
  expect(formatCents(750)).toBe('$7.50')
})
```

- [x] **Step 2: Run** `npx jest src/lib/money` → FAIL (module not found).

- [x] **Step 3: Implement `src/lib/money.ts`**

```ts
export function parsePriceCents(input: string): number {
  const m = input.trim().match(/^\$?(\d+)(?:\.(\d{1,2}))?$/)
  if (!m) throw new Error(`Unparseable price: ${input}`)
  const cents = m[2] ? (m[2] + '0').slice(0, 2) : '00'
  return Number(m[1]) * 100 + Number(cents)
}

export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100)
  const rem = cents % 100
  return rem === 0 ? `$${dollars}` : `$${dollars}.${String(rem).padStart(2, '0')}`
}
```

- [x] **Step 4: Run** `npx jest src/lib/money` → PASS. Delete `src/lib/smoke.test.ts`.

- [x] **Step 5: Schema**

`prisma/schema.prisma` (spec §3, complete):

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role               { CUSTOMER ADMIN }
enum SkinTone           { PINK OLIVE }
enum ServiceLocation    { STUDIO MOBILE }
enum AppointmentStatus  { BOOKED COMPLETED CANCELLED NO_SHOW }
enum SubscriptionStatus { ACTIVE PAST_DUE CANCELLED INCOMPLETE }

model User {
  id               String   @id @default(cuid())
  firstName        String
  lastName         String
  /// Contact info + guest-matching heuristic. Deliberately NOT unique (unverified).
  phone            String?
  /// The account identifier.
  email            String?  @unique
  /// bcrypt; null for guests and Google sign-ins.
  password         String?
  /// The only guest test. Never infer from password === null.
  isGuest          Boolean  @default(false)
  role             Role     @default(CUSTOMER)
  /// 1–6 Fitzpatrick. Range enforced by CHECK constraint in migration SQL.
  skinType         Int?
  skinTone         SkinTone?
  instagram        String?
  adminNotes       String?
  stripeCustomerId String?  @unique
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  appointments     Appointment[]
  subscription     Subscription?
}

model Service {
  id           String          @id @default(cuid())
  slug         String          @unique
  name         String
  description  String
  priceCents   Int
  durationMin  Int             @default(45)
  location     ServiceLocation
  isActive     Boolean         @default(true)
  sortOrder    Int             @default(0)
  appointments Appointment[]
}

model AddOn {
  id           String  @id @default(cuid())
  name         String  @unique
  description  String?
  priceCents   Int
  isActive     Boolean @default(true)
  sortOrder    Int     @default(0)
  appointments AppointmentAddOn[]
}

model Appointment {
  id                   String            @id @default(cuid())
  /// Public share / claim link. 43-char base64url from lib/tokenGenerator.
  token                String            @unique
  /// null = "No Account Yet" (admin-created, claimable via the link).
  userId               String?
  serviceId            String
  startAt              DateTime
  endAt                DateTime
  status               AppointmentStatus @default(BOOKED)
  occasion             String?
  clientNotes          String?
  adminNotes           String?
  address              String?
  priceCents           Int
  paidWithSubscription Boolean           @default(false)
  createdByAdmin       Boolean           @default(false)
  icalUid              String?           @unique
  icalUrl              String?
  icalEtag             String?
  cancelledAt          DateTime?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  user    User?    @relation(fields: [userId], references: [id])
  service Service  @relation(fields: [serviceId], references: [id])
  addOns  AppointmentAddOn[]

  @@index([startAt])
  @@index([userId])
}

model AppointmentAddOn {
  appointmentId String
  addOnId       String
  priceCents    Int
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  addOn         AddOn       @relation(fields: [addOnId], references: [id])
  @@id([appointmentId, addOnId])
}

model Subscription {
  id                    String             @id @default(cuid())
  userId                String             @unique
  stripeSubscriptionId  String             @unique
  stripePriceId         String
  status                SubscriptionStatus
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean            @default(false)
  tansIncludedPerPeriod Int
  tansUsedThisPeriod    Int                @default(0)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

/// External (Apple Calendar) busy time, already expanded from recurrences. Cache, not truth.
model ExternalBusyBlock {
  id           String   @id @default(cuid())
  calendarName String
  uid          String
  summary      String?
  startAt      DateTime
  endAt        DateTime
  isAllDay     Boolean  @default(false)
  syncedAt     DateTime @default(now())
  @@index([startAt, endAt])
}

model Setting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}
```

- [x] **Step 6: `.env.example`**

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_FIRST_NAME=
ADMIN_LAST_NAME=
# Phase 1
ICLOUD_APPLE_ID=
ICLOUD_APP_PASSWORD=
# Phase 2
SENDGRID_API_KEY=
BOOKING_FROM_EMAIL=
# optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] (BLOCKED — needs DATABASE_URL) **Step 7: Migrate**

Run: `npx prisma migrate dev --name init` → migration created, applied. Then
`npx prisma migrate dev --create-only --name booking_constraints` and set the generated
`migration.sql` to:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (tstzrange("startAt", "endAt") WITH &&) WHERE (status = 'BOOKED');
ALTER TABLE "User" ADD CONSTRAINT user_skin_type_range
  CHECK ("skinType" IS NULL OR "skinType" BETWEEN 1 AND 6);
```

Run: `npx prisma migrate dev` → applied. If the host rejects `CREATE EXTENSION`, delete the
first two statements, keep the CHECK, and note in the spec that Phase 2's booking transaction
must use `SELECT pg_advisory_xact_lock(hashtext('appointments'))` before inserting.

- [x] **Step 8: Client singleton `src/lib/db.ts`** (OWA copy)

```ts
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export { prisma }
export default prisma
```

- [x] **Step 9: Settings defaults `src/lib/settingsDefaults.ts`** (pure; Phase 1 wraps it)

```ts
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
```

- [x] **Step 10: Seed `prisma/seed.ts`** (idempotent upserts)

```ts
import { PrismaClient, ServiceLocation } from '@prisma/client'
import { hash } from 'bcryptjs'
import { defaultPricingData } from '../src/lib/pricingData'
import { parsePriceCents } from '../src/lib/money'
import { SETTING_DEFAULTS } from '../src/lib/settingsDefaults'

const prisma = new PrismaClient()

async function main() {
  let sort = 0
  for (const [location, tab] of [[ServiceLocation.STUDIO, defaultPricingData.inStudio], [ServiceLocation.MOBILE, defaultPricingData.mobile]] as const) {
    for (const s of tab.services) {
      await prisma.service.upsert({
        where: { slug: s.id },
        update: { name: s.title, description: s.description, priceCents: parsePriceCents(s.price), location, sortOrder: sort++ },
        create: { slug: s.id, name: s.title, description: s.description, priceCents: parsePriceCents(s.price), location, sortOrder: sort },
      })
    }
  }
  const addOns = defaultPricingData.inStudio.addOns?.items ?? []
  for (const [i, a] of addOns.entries()) {
    if (!a.price) continue
    await prisma.addOn.upsert({
      where: { name: a.title },
      update: { description: a.description, priceCents: parsePriceCents(a.price), sortOrder: i },
      create: { name: a.title, description: a.description, priceCents: parsePriceCents(a.price), sortOrder: i },
    })
  }
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } })
  }
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME = 'Admin', ADMIN_LAST_NAME = 'User' } = process.env
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: { role: 'ADMIN' },
      create: { email: ADMIN_EMAIL.toLowerCase(), password: await hash(ADMIN_PASSWORD, 12), firstName: ADMIN_FIRST_NAME, lastName: ADMIN_LAST_NAME, role: 'ADMIN' },
    })
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set — no admin user seeded')
  }
}

main().finally(() => prisma.$disconnect())
```

- [ ] (BLOCKED — needs DATABASE_URL) **Step 11: Verify**

Run: `npx prisma db seed` → no errors. Run:
`npx tsx -e "import p from './src/lib/db'; p.service.count().then(n=>{console.log('services',n);return p.addOn.count()}).then(n=>{console.log('addOns',n);return p.user.count({where:{role:'ADMIN'}})}).then(n=>console.log('admins',n)).finally(()=>p.\$disconnect())"`
Expected: `services 9` (6 studio + 3 mobile), `addOns 3`, `admins 1`. Run `npm test` and `npm run build` → green.

- [x] **Step 12: Ready to commit** — `feat: prisma schema, migrations, seed, db client`

---

### Task 3: Phone and token utilities

**Files:**
- Create: `src/lib/phone.ts`, `src/lib/phone.test.ts`, `src/lib/tokenGenerator.ts`, `src/lib/tokenGenerator.test.ts`

**Interfaces:**
- Produces: `normalizePhone(input: string): string | null`, `toPhoneDigits(input: string): string`, `formatPhoneDisplay(input: string): string`, `generatePublicToken(): string`.

- [x] **Step 1: Failing tests**

`src/lib/phone.test.ts`:

```ts
import { normalizePhone, toPhoneDigits, formatPhoneDisplay } from './phone'

test('normalizePhone accepts 10 digits with any formatting', () => {
  expect(normalizePhone('(208) 555-0199')).toBe('2085550199')
  expect(normalizePhone('+1 208 555 0199')).toBe('2085550199')
})
test('normalizePhone rejects wrong lengths', () => {
  expect(normalizePhone('555-0199')).toBeNull()
  expect(normalizePhone('')).toBeNull()
})
test('toPhoneDigits caps at 10 and drops leading 1', () => {
  expect(toPhoneDigits('12085550199999')).toBe('2085550199')
})
test('formatPhoneDisplay is progressive', () => {
  expect(formatPhoneDisplay('208')).toBe('(208')
  expect(formatPhoneDisplay('2085')).toBe('(208) 5')
  expect(formatPhoneDisplay('2085550199')).toBe('(208) 555-0199')
})
```

`src/lib/tokenGenerator.test.ts`:

```ts
import { generatePublicToken } from './tokenGenerator'

test('token is 43 url-safe chars and unique', () => {
  const a = generatePublicToken(), b = generatePublicToken()
  expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(a).not.toBe(b)
})
```

- [x] **Step 2: Run** `npx jest src/lib/phone src/lib/tokenGenerator` → FAIL.

- [x] **Step 3: Implement** — copy `/Users/trevorhecht/Developer/repos/onewitharts/src/lib/phone.ts` to `src/lib/phone.ts` verbatim (three functions; replace the doc comment's "unique on User … accepted as a sign-in identifier" with "NOT unique on User; email is the identifier"). Copy `onewitharts/src/utils/tokenGenerator.ts` to `src/lib/tokenGenerator.ts` verbatim.

- [x] **Step 4: Run** the two tests → PASS. `npm run build` → green.

- [x] **Step 5: Ready to commit** — `feat: phone normalization and public token utils`

---

### Task 4: User models and services (accounts + guests)

**Files:**
- Create: `src/models/user.ts`, `src/models/user.test.ts`, `src/services/userService.ts`, `src/services/guestUserService.ts`, `src/services/guestUserService.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/db`, `normalizePhone`.
- Produces:
  - zod: `userSignupSchema`, `userUpdateSchema`, `profileSchema`, `guestInfoSchema`; types `UserSignupInput`, `UserUpdateInput`, `ProfileInput`, `GuestInfo`.
  - `createUser(input: UserSignupInput): Promise<User>` (throws `Error('An account with this email already exists…')`)
  - `updateUser(id: string, input: UserUpdateInput): Promise<User>`
  - `getUserById(id: string): Promise<User | null>`
  - `findOrCreateGuestUser(info: GuestInfo): Promise<GuestResult>` with `GuestResult = { user } | { conflict: 'PHONE_HAS_ACCOUNT'; userId } | { conflict: 'EMAIL_IN_USE' }`

- [x] **Step 1: Failing schema tests** `src/models/user.test.ts`

```ts
import { guestInfoSchema, userSignupSchema, profileSchema } from './user'

test('guestInfoSchema: name + valid phone required, blank email → undefined', () => {
  const r = guestInfoSchema.safeParse({ firstName: ' Jane ', lastName: 'D', phone: '(208) 555-0199', email: '' })
  expect(r.success).toBe(true)
  if (r.success) { expect(r.data.firstName).toBe('Jane'); expect(r.data.email).toBeUndefined() }
  expect(guestInfoSchema.safeParse({ firstName: 'J', lastName: 'D', phone: '123' }).success).toBe(false)
})
test('userSignupSchema requires email + 6-char password', () => {
  expect(userSignupSchema.safeParse({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '12345' }).success).toBe(false)
  expect(userSignupSchema.safeParse({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '123456' }).success).toBe(true)
})
test('profileSchema bounds skinType 1–6 and skinTone enum', () => {
  expect(profileSchema.safeParse({ skinType: 7 }).success).toBe(false)
  expect(profileSchema.safeParse({ skinType: 3, skinTone: 'OLIVE', instagram: '@jane' }).success).toBe(true)
  expect(profileSchema.safeParse({ skinTone: 'GREEN' }).success).toBe(false)
})
```

- [x] **Step 2: Run** `npx jest src/models` → FAIL.

- [x] **Step 3: `src/models/user.ts`**

```ts
import { z } from 'zod'
import { normalizePhone } from '@/lib/phone'

const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)
const phoneField = z.string().refine((v) => normalizePhone(v) !== null, 'Enter a valid 10-digit phone number')

/** Persistent tan profile — the fields that stay the same visit to visit. */
export const profileSchema = z.object({
  skinType: z.number().int().min(1).max(6).nullable().optional(),
  skinTone: z.enum(['PINK', 'OLIVE']).nullable().optional(),
  instagram: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
})
export type ProfileInput = z.infer<typeof profileSchema>

export const userSignupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: phoneField,
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
export type UserSignupInput = z.infer<typeof userSignupSchema>

export const userUpdateSchema = profileSchema.extend({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: phoneField.optional(),
  adminNotes: z.string().max(2000).nullable().optional(),   // ignored unless caller is admin (route enforces)
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  currentPassword: z.string().optional(),
})
export type UserUpdateInput = z.infer<typeof userUpdateSchema>

/** Guest identity: name + phone required, email optional. No password ever. */
export const guestInfoSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: phoneField,
  email: z.preprocess(blankToUndefined, z.string().trim().email('Enter a valid email').optional()),
})
export type GuestInfo = z.infer<typeof guestInfoSchema>
```

- [x] **Step 4: Run** `npx jest src/models` → PASS.

- [x] **Step 5: Failing guest-service test** `src/services/guestUserService.test.ts`

```ts
jest.mock('@/lib/db', () => ({ __esModule: true, default: { user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn() } } }))
import prisma from '@/lib/db'
import { findOrCreateGuestUser } from './guestUserService'

const db = prisma as unknown as { user: Record<string, jest.Mock> }
const info = { firstName: 'Jane', lastName: 'D', phone: '(208) 555-0199' }
beforeEach(() => Object.values(db.user).forEach((m) => m.mockReset()))

test('phone on a full account → PHONE_HAS_ACCOUNT', async () => {
  db.user.findFirst.mockResolvedValue({ id: 'u1', isGuest: false })
  expect(await findOrCreateGuestUser(info)).toEqual({ conflict: 'PHONE_HAS_ACCOUNT', userId: 'u1' })
})
test('email owned by someone else → EMAIL_IN_USE', async () => {
  db.user.findFirst.mockResolvedValue(null)
  db.user.findUnique.mockResolvedValue({ id: 'u2' })
  expect(await findOrCreateGuestUser({ ...info, email: 'x@y.com' })).toEqual({ conflict: 'EMAIL_IN_USE' })
})
test('existing guest by phone is refreshed, not duplicated', async () => {
  db.user.findFirst.mockResolvedValue({ id: 'g1', isGuest: true })
  db.user.update.mockResolvedValue({ id: 'g1' })
  await findOrCreateGuestUser(info)
  expect(db.user.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { firstName: 'Jane', lastName: 'D' } })
  expect(db.user.create).not.toHaveBeenCalled()
})
test('no match → creates guest with normalized phone', async () => {
  db.user.findFirst.mockResolvedValue(null)
  db.user.create.mockResolvedValue({ id: 'g2' })
  await findOrCreateGuestUser(info)
  expect(db.user.create).toHaveBeenCalledWith({ data: { firstName: 'Jane', lastName: 'D', phone: '2085550199', email: null, isGuest: true } })
})
```

- [x] **Step 6: Run** `npx jest src/services/guestUserService` → FAIL.

- [x] **Step 7: `src/services/guestUserService.ts`** — copy OWA `src/services/guestUserService.ts`, then: import `GuestInfo` (not `GuestInfoSchemaType`); delete the `companyName` const and both `companyName` spreads; delete `referralLink: 'guest'`. Resulting `create` call:

```ts
  const user = await prisma.user.create({
    data: { firstName: info.firstName, lastName: info.lastName, phone, email, isGuest: true },
  })
```

- [x] **Step 8: Run** → PASS.

- [x] **Step 9: `src/services/userService.ts`**

```ts
import { hash, compare } from 'bcryptjs'
import prisma from '@/lib/db'
import { normalizePhone } from '@/lib/phone'
import type { UserSignupInput, UserUpdateInput } from '@/models/user'

export async function createUser(input: UserSignupInput) {
  const phone = normalizePhone(input.phone)
  if (!phone) throw new Error('Invalid phone number')
  const email = input.email.toLowerCase()
  // Email is the account identifier. A guest with this email upgrades in place (same id,
  // appointment history kept); a full account collides.
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && !existing.isGuest) throw new Error('An account with this email already exists. Try signing in instead.')
  const data = { firstName: input.firstName, lastName: input.lastName, email, phone, password: await hash(input.password, 12), isGuest: false }
  return existing ? prisma.user.update({ where: { id: existing.id }, data }) : prisma.user.create({ data })
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

/** Throws 'Current password is incorrect' / 'Current password is required' on password change. */
export async function updateUser(id: string, input: UserUpdateInput, opts: { isAdmin: boolean }) {
  const { password, currentPassword, adminNotes, phone, ...rest } = input
  const data: Record<string, unknown> = { ...rest }
  if (phone !== undefined) {
    const normalized = normalizePhone(phone)
    if (!normalized) throw new Error('Invalid phone number')
    data.phone = normalized
  }
  if (opts.isAdmin && adminNotes !== undefined) data.adminNotes = adminNotes
  if (password) {
    if (!currentPassword) throw new Error('Current password is required')
    const user = await prisma.user.findUnique({ where: { id }, select: { password: true } })
    if (!user?.password || !(await compare(currentPassword, user.password))) throw new Error('Current password is incorrect')
    data.password = await hash(password, 12)
  }
  return prisma.user.update({ where: { id }, data })
}
```

- [x] **Step 10: Verify** `npm test` all green, `npm run build` green.

- [x] **Step 11: Ready to commit** — `feat: user/guest models and services ported from onewitharts`

---

### Task 5: NextAuth, proxy, user API routes

**Files:**
- Create: `src/lib/auth.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `proxy.ts` (repo root), `src/app/api/users/route.ts`, `src/app/api/users/route.test.ts`, `src/app/api/users/guest/route.ts`, `src/app/api/users/all/route.ts`, `src/app/api/users/me/route.ts`, `src/lib/apiResponse.ts`, `src/lib/apiResponse.test.ts`

**Interfaces:**
- Produces: `authOptions`; `session.user = { id, email, firstName, lastName, role: 'customer' | 'admin', needsPhone }`; `requireAdmin(): Promise<Session | null>` helper in `auth.ts`; routes:
  - `POST /api/users` `{firstName,lastName,phone,email,password}` → 201 user (no password) | 400 | 409
  - `POST /api/users/guest` (admin) `{firstName,lastName,phone,email?}` → 201 `{user}` | 409 `{code,userId?}`
  - `GET /api/users/all` (admin) → `{ success, users: [{id,firstName,lastName,email,phone,isGuest,skinType,skinTone,instagram}] }`
  - `GET /api/users/me` → own profile (no password); `PATCH /api/users/me` body `userUpdateSchema` → updated profile
  - `extractApiErrorMessage(res, fallback?): Promise<string>`

- [x] **Step 1: `src/lib/auth.ts`** — start from OWA `src/lib/auth.ts` and reduce (role now lives on `User`):

```ts
import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import prisma from './db'

const toRole = (r: 'CUSTOMER' | 'ADMIN') => (r === 'ADMIN' ? 'admin' : 'customer') as const

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        // Guests have no password and can never authorize.
        const user = await prisma.user.findUnique({ where: { email: credentials.email.trim().toLowerCase() } })
        if (!user?.password || !(await compare(credentials.password, user.password))) return null
        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: toRole(user.role), firstName: user.firstName, lastName: user.lastName }
      },
    }),
    // Registered only when configured (OWA pattern) — otherwise the button posts an empty client id.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true
      const email = profile?.email?.toLowerCase()
      if (!email || (profile as { email_verified?: boolean }).email_verified !== true) return false
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        if (existing.isGuest) await prisma.user.update({ where: { id: existing.id }, data: { isGuest: false } })
        return true
      }
      const g = profile as { given_name?: string; family_name?: string; name?: string }
      await prisma.user.create({ data: { firstName: g.given_name || g.name || 'Google', lastName: g.family_name || 'User', email, phone: null, isGuest: false } })
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() } })
        if (dbUser) { token.sub = dbUser.id; token.role = toRole(dbUser.role); token.firstName = dbUser.firstName; token.lastName = dbUser.lastName; token.needsPhone = !dbUser.phone }
      }
      if (user && account?.provider !== 'google') { token.role = user.role; token.firstName = user.firstName; token.lastName = user.lastName; token.needsPhone = false }
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        if (dbUser) { token.needsPhone = !dbUser.phone; token.firstName = dbUser.firstName; token.lastName = dbUser.lastName }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as 'customer' | 'admin'
      session.user.firstName = token.firstName as string
      session.user.lastName = token.lastName as string
      session.user.needsPhone = Boolean(token.needsPhone)
      return session
    },
  },
}

/** Route-handler helper: the session if it is an admin, else null. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin' ? session : null
}
export const getSession = () => getServerSession(authOptions)
```

- [x] **Step 2: `src/types/next-auth.d.ts`** — copy OWA's file and change every `'customer' | 'employee' | 'admin'` to `'customer' | 'admin'`.

- [x] **Step 3: `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [x] **Step 4: `proxy.ts`** (repo root, Next 16 middleware name)

```ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function proxy(req) {
    const role = req.nextauth.token?.role
    if (req.nextUrl.pathname.startsWith('/admin/dashboard') && role !== 'admin') return NextResponse.redirect(new URL('/admin', req.url))
    return NextResponse.next()
  },
  { callbacks: { authorized: ({ token, req }) => (req.nextUrl.pathname === '/admin' ? true : !!token) } }
)
export const config = { matcher: ['/admin', '/admin/:path*', '/account', '/account/:path*'] }
```

- [x] **Step 5: Failing route test** `src/app/api/users/route.test.ts`

```ts
jest.mock('@/services/userService', () => ({ createUser: jest.fn() }))
import { createUser } from '@/services/userService'
import { POST } from './route'

const post = (body: unknown) => POST(new Request('http://x/api/users', { method: 'POST', body: JSON.stringify(body) }))

test('400 on invalid body', async () => {
  const res = await post({ firstName: 'J' })
  expect(res.status).toBe(400)
})
test('409 when email already has an account', async () => {
  ;(createUser as jest.Mock).mockRejectedValue(new Error('An account with this email already exists. Try signing in instead.'))
  const res = await post({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '123456' })
  expect(res.status).toBe(409)
})
test('201 strips password', async () => {
  ;(createUser as jest.Mock).mockResolvedValue({ id: 'u1', email: 'j@x.com', password: 'hash' })
  const res = await post({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '123456' })
  expect(res.status).toBe(201)
  expect(await res.json()).toEqual({ id: 'u1', email: 'j@x.com' })
})
```

- [x] **Step 6: Run** `npx jest src/app/api/users/route` → FAIL.

- [x] **Step 7: `src/app/api/users/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { userSignupSchema } from '@/models/user'
import { createUser } from '@/services/userService'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await createUser(userSignupSchema.parse(await req.json()))
    const { password: _pw, ...safe } = user
    return NextResponse.json(safe, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    if (error instanceof Error && error.message.includes('already exists')) return NextResponse.json({ error: error.message }, { status: 409 })
    console.error('DEBUG: POST /api/users', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
```

- [x] **Step 8: Run** → PASS.

- [x] **Step 9: `src/app/api/users/guest/route.ts`** — copy OWA's file; replace the role check with `if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`; import `requireAdmin` from `@/lib/auth`; keep the 409 mapping verbatim.

- [x] **Step 10: `src/app/api/users/all/route.ts`** — copy OWA's file; use `requireAdmin()`; `select: { id, firstName, lastName, email, phone, isGuest, skinType, skinTone, instagram }` all `true`; `orderBy: [{ isGuest: 'asc' }, { firstName: 'asc' }]`.

- [x] **Step 11: `src/app/api/users/me/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { userUpdateSchema } from '@/models/user'
import { updateUser } from '@/services/userService'

export const dynamic = 'force-dynamic'
const PUBLIC = { id: true, firstName: true, lastName: true, email: true, phone: true, isGuest: true, role: true, skinType: true, skinTone: true, instagram: true } as const

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: PUBLIC })
  return user ? NextResponse.json(user) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const input = userUpdateSchema.parse(await req.json())
    const updated = await updateUser(session.user.id, input, { isAdmin: false })
    const { password: _pw, adminNotes: _n, ...safe } = updated
    return NextResponse.json(safe)
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    if (error instanceof Error && /password/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 400 })
    console.error('DEBUG: PATCH /api/users/me', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
```

- [x] **Step 12: `src/lib/apiResponse.ts` + test** — copy OWA `src/lib/apiResponse.ts` and `src/lib/apiResponse.test.ts` verbatim.

- [x] **Step 13: Verify** `npm test` green; `npm run build` green; with `.env` set, `npm run dev` then `curl -X POST localhost:3000/api/users -H 'content-type: application/json' -d '{"firstName":"T","lastName":"H","phone":"2085550199","email":"t@example.com","password":"123456"}'` → 201; repeat → 409.

- [x] **Step 14: Ready to commit** — `feat: NextAuth with admin role, proxy, user API routes`

---

### Task 6: Providers, account menu, nav, admin login, account page

**Files:**
- Create: `src/contexts/AuthModalContext.tsx`, `src/contexts/ConfirmContext.tsx`, `src/components/LoadingSpinner.tsx`, `src/components/PhoneInput.tsx`, `src/components/GuestUserForm.tsx`, `src/components/users/UserSearchSelect.tsx`, `src/components/accountMenu/{accountMenu,signIn,signUp,loggedIn,accountMenu-PhonePrompt,accountMenu-GoogleButton}.tsx`, `src/hooks/usePreventKeyboardScroll.ts`, `src/components/ui/Skeleton.tsx`, `src/app/admin/page.tsx`, `src/app/account/{page,loading}.tsx`, `src/app/account/Account-Skeleton.tsx`
- Modify: `src/app/providers.tsx`, `src/components/Layout/NavBar.tsx`

**Interfaces:**
- Consumes: `useSession`, `/api/users`, `/api/users/me`, `/api/users/guest`, `/api/users/all`.
- Produces: `useAuthModal()` (`openAuthModal({ initialView?, guestCheckout? })`), `useConfirm()`, `<AccountMenu isOpen onClose />`, `<GuestUserForm onSubmit submitLabel? />`, `<UserSearchSelect onSelect users? />`, `<Skeleton className />`, `<PhoneInput value onChange … />`.

- [x] **Step 1: Copy verbatim from OWA** (`cp` each; paths relative to each repo's `src/`): `contexts/AuthModalContext.tsx`, `contexts/ConfirmContext.tsx`, `components/LoadingSpinner.tsx`, `components/PhoneInput.tsx`, `components/users/UserSearchSelect.tsx`, `hooks/usePreventKeyboardScroll.ts`, `components/accountMenu/accountMenu-PhonePrompt.tsx`, `components/accountMenu/accountMenu-GoogleButton.tsx`, `app/admin/page.tsx`. Then `grep -n "companyName\|employee\|heart\|Heart" <each>` and remove what is flagged (company field in `UserSearchSelect` textValue, the `wasOpenedFromHeartButton` state in `AuthModalContext` and its two exports).

- [x] **Step 2: `GuestUserForm.tsx`** — copy OWA's, delete the `companyName` state, `<Input label="Company (optional)">`, and the `companyName` key in `onSubmit`; description text on email: `"Add an email to get your confirmation and reminders"`; add `inputMode="email" autoComplete="email"` on email, `autoComplete="given-name"`/`"family-name"` on names, `className="text-base"` on all inputs; submit button `className="w-full min-h-11 touch-manipulation bg-[var(--color-foreground)] text-[var(--color-background)]"`.

- [x] **Step 3: `signIn.tsx`, `signUp.tsx`** — copy OWA's. In `signIn.tsx` delete the `wasOpenedFromHeartButton` prop and its usage. In `signUp.tsx` delete the `inviteToken` prop, the `/api/signup-invite/inspect` effect, and the company input; POST body is exactly `{ firstName, lastName, phone, email, password }`; on 201 call `signIn('credentials', { email, password, redirect: false })` then `onSuccess()`. Add `autoComplete="new-password"` / `"current-password"`, `text-base`, `min-h-11`.

- [x] **Step 4: `accountMenu.tsx`** — copy OWA's; delete the `/api/settings/universal` fetch and `guestCheckoutEnabled` state (guest option is shown whenever `guestCheckout` is passed); delete `wasOpenedFromHeartButton`; keep `usePreventKeyboardScroll`. Panel classes: `fixed right-0 top-16 w-full sm:w-[400px] bg-[var(--color-background)] sm:border-t border-[var(--color-border)] z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto`.

- [x] **Step 5: `loggedIn.tsx`** (rewrite, ~60 lines)

```tsx
'use client'
import { Button } from '@heroui/react'
import { LogOut, CalendarDays, UserRound, Sparkles, Users, BarChart3, Settings } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const CUSTOMER = [
  { label: 'Appointments', href: '/account?view=appointments', Icon: CalendarDays },
  { label: 'Profile', href: '/account?view=profile', Icon: UserRound },
  { label: 'Membership', href: '/account?view=membership', Icon: Sparkles },
]
const ADMIN = [
  { label: 'Calendar', href: '/admin/dashboard?view=calendar', Icon: CalendarDays },
  { label: 'Users', href: '/admin/dashboard?view=users', Icon: Users },
  { label: 'Insights', href: '/admin/dashboard?view=insights', Icon: BarChart3 },
  { label: 'Settings', href: '/admin/dashboard?view=settings', Icon: Settings },
]

export default function LoggedIn({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const items = session?.user.role === 'admin' ? ADMIN : CUSTOMER
  const go = (href: string) => { onClose(); router.push(href) }
  return (
    <nav aria-label="Account" className="flex flex-col gap-2 w-full font-[AlegreyaSansSC]">
      <h2 className="text-xl font-bold text-[var(--color-foreground)] text-right">Welcome {session?.user?.firstName || 'there'}</h2>
      {items.map(({ label, href, Icon }) => (
        <button key={href} onClick={() => go(href)}
          className="min-h-11 touch-manipulation w-full flex items-center justify-end gap-2 text-2xl text-[var(--color-foreground)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none rounded transition-colors duration-200 motion-reduce:transition-none">
          <Icon className="w-5 h-5" aria-hidden /> <span>{label}</span>
        </button>
      ))}
      <div className="flex justify-end pt-2">
        <Button color="danger" variant="flat" className="min-h-11 touch-manipulation text-lg" onPress={async () => { await signOut({ callbackUrl: '/' }); onClose() }}>
          <LogOut className="w-5 h-5 mr-2" aria-hidden /> Log Out
        </Button>
      </div>
    </nav>
  )
}
```

- [x] **Step 6: `providers.tsx`**

```tsx
'use client'
import { HeroUIProvider } from '@heroui/react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { ConfirmProvider } from '@/contexts/ConfirmContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <AuthModalProvider>
          <ConfirmProvider>
            {children}
            <Toaster theme="dark" position="bottom-center" toastOptions={{ style: { background: 'var(--color-background)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)' } }} />
          </ConfirmProvider>
        </AuthModalProvider>
      </HeroUIProvider>
    </SessionProvider>
  )
}
```

- [x] **Step 7: Nav account button** — in `NavBar.tsx` add `import { UserRound, X } from 'lucide-react'`, `import { useAuthModal } from '@/contexts/AuthModalContext'`, `import AccountMenu from '@/components/accountMenu/accountMenu'`. Inside the component: `const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthModal()`. Add this button in the mobile right column (before the menu toggle) and in the desktop `justify="end"` content (before Instagram):

```tsx
<button
  aria-label={isAuthModalOpen ? 'Close account menu' : 'Open account menu'}
  onClick={() => (isAuthModalOpen ? closeAuthModal() : openAuthModal())}
  className="min-w-11 min-h-11 touch-manipulation flex items-center justify-center text-[var(--color-foreground)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none rounded"
>
  {isAuthModalOpen ? <X className="w-6 h-6" aria-hidden /> : <UserRound className="w-6 h-6" aria-hidden />}
</button>
```

Render `<AccountMenu isOpen={isAuthModalOpen} onClose={closeAuthModal} />` as the last child of `<Navbar>`.

- [x] **Step 8: Skeleton primitive `src/components/ui/Skeleton.tsx`**

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`relative overflow-hidden rounded bg-[var(--color-border)] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent motion-reduce:before:animate-none ${className}`} />
  )
}
```

- [x] **Step 9: `/account` shell**

`src/app/account/Account-Skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/Skeleton'
export default function AccountSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )
}
```

`src/app/account/loading.tsx`: `import AccountSkeleton from './Account-Skeleton'; export default function Loading() { return <div className="px-4 md:px-6 lg:px-8 py-8"><AccountSkeleton /></div> }`

`src/app/account/page.tsx` (client; sections filled in Phases 2 and 5):

```tsx
'use client'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import AccountSkeleton from './Account-Skeleton'

const VIEWS = ['appointments', 'profile', 'membership'] as const
type View = (typeof VIEWS)[number]

function AccountContent() {
  const { data: session, status } = useSession()
  const params = useSearchParams()
  const view = (VIEWS as readonly string[]).includes(params.get('view') ?? '') ? (params.get('view') as View) : 'appointments'
  if (status === 'loading') return <AccountSkeleton />
  return (
    <div className="relative z-10 min-h-dvh px-4 md:px-6 lg:px-8 py-8 text-[var(--color-foreground)] font-[AlegreyaSansSC]">
      <h1 className="text-3xl mb-6">Hi {session?.user.firstName}</h1>
      <nav aria-label="Account sections" className="flex gap-2 mb-6">
        {VIEWS.map((v) => (
          <a key={v} href={`/account?view=${v}`} aria-current={v === view ? 'page' : undefined}
            className={`min-h-11 touch-manipulation px-4 flex items-center rounded capitalize ${v === view ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'bg-[var(--color-surface)]'}`}>{v}</a>
        ))}
      </nav>
      <p className="text-[var(--color-muted)]">{view} — coming in the next phase.</p>
    </div>
  )
}

export default function AccountPage() {
  return <Suspense fallback={<AccountSkeleton />}><AccountContent /></Suspense>
}
```

- [x] **Step 10: Verify** — `npm run build` green; `npm test` green; manual walk-through in `npm run dev`: account icon opens the panel; Create Account with a new email → panel shows Welcome + customer menu; Log Out; Sign in with the seeded admin → admin menu; `/admin/dashboard` (404 for now) redirects to `/admin` when logged out; `/account` redirects to `/` when logged out; on a 390px-wide viewport the panel scrolls and inputs don't zoom.

- [x] **Step 11: Ready to commit** — `feat: account menu, auth modal, admin login, account shell`

---

### Task 7: Remove dead Google-API code

**Files:**
- Delete: `src/app/api/book-appointment/route.ts`, `src/app/api/auth/google/route.ts`, `src/app/api/auth/callback/google/route.ts`
- KEEP `src/app/api/gmail/route.ts`. Despite the name it has nothing to do with the Google API:
  it is the live contact form, sending through SendGrid, and `src/app/contact/page.tsx:66` posts to it.
- Keep: `GoogleBookingWidget.tsx` and the `/services/*` pages (replaced in Phase 2).
- Deleting `api/auth/google` and `api/auth/callback` is also required for NextAuth: a static
  `api/auth/callback/google` route shadows the catch-all `api/auth/[...nextauth]`, so Google
  sign-in could never complete while it existed.

- [x] **Step 1:** `grep -rn "googleapis\|google-cloud\|book-appointment\|api/gmail" src` → only the four files above. Delete them (`rm -r src/app/api/gmail src/app/api/book-appointment src/app/api/auth/google src/app/api/auth/callback`).
- [x] **Step 2:** `npm run build` green; `npm test` green; `/services/spraytans` still shows the Google iframe.
- [x] **Step 3: Ready to commit** — `chore: remove unused Google API routes`

---

## Self-review against the spec

- §2 reuse table: db ✔ (T2), auth ✔ (T5), zod ✔ (T4), services ✔ (T4), phone ✔ (T3), user APIs ✔ (T5), account menu + pickers ✔ (T6), token ✔ (T3), providers ✔ (T6), settings model ✔ (T2, wrapper in Phase 1). Dashboard shell, calendar, insights, iCal parser, Stripe → Phases 1–5.
- §3 schema ✔ complete in T2 including SQL constraints and the advisory-lock fallback.
- §11 A/C1/C2/J assumed and stated; B/D/E/F/G/H/I do not affect this phase.
- §12: Next 16 + Turbopack ✔ T1, single configs ✔ T1, tokens ✔ T1, viewport ✔ T1, proxy.ts ✔ T5, skeleton primitive + `/account` loading ✔ T6, forms a11y/mobile attributes ✔ T6, apiResponse ✔ T5, jest ✔ T1.
- Type consistency: `GuestInfo` (T4) is what `findOrCreateGuestUser` and `GuestUserForm` use; `requireAdmin`/`getSession` (T5) are the only session helpers; `SETTING_DEFAULTS`/`SettingKey` (T2) are consumed by Phase 1.


---

## Implementation notes (written after execution, 2026-09-15)

1. **`src/app/api/gmail/route.ts` must NOT be deleted.** Task 7 originally listed it. Despite the
   name it is the live contact form, sending through SendGrid, and `src/app/contact/page.tsx`
   posts to it. Only the three `googleapis`-dependent routes were removed.
2. **`@heroui/react` is pinned to 2.7.11, not 2.8.** 2.8 bundles Tailwind 4 and its plugin type
   is incompatible with this project's Tailwind 3.4, which produced the only remaining type
   error. 2.7.11 is the version onewitharts runs against Tailwind 3.4.1.
3. **`@db.Timestamptz(3)` added to `Appointment.startAt/endAt` and `ExternalBusyBlock.startAt/endAt`.**
   Prisma maps `DateTime` to `timestamp(3)` without a time zone, so `tstzrange(...)` in the
   exclusion constraint would have failed at migration time.
4. **`eslint.config.mjs` added.** Next 16 removed the `next lint` command, so ESLint runs
   directly and needs a flat config; the repo had none.
5. **`AccountMenu` derives the account view** from the session rather than syncing it in an
   effect, which React 19's `react-hooks/set-state-in-effect` rule rejects. `SignIn`/`SignUp`
   can now only select an auth view; `'account'` is the parent's to derive.
6. **`ConfirmContext` renders the existing `src/components/ConfirmDialog.tsx`** instead of
   porting a second dialog from onewitharts, per the no-duplication rule. `ConfirmDialog`'s
   `message` prop was widened to `ReactNode`.
7. **`toPhoneDigits` differs from the onewitharts original**, stripping a leading `1` from any
   over-length input rather than only from exactly 11 digits.
8. **`proxy.ts` guards the whole `/admin/*` subtree**, not just `/admin/dashboard`, so a future
   admin route is protected the day it is added.
9. **The seed exits non-zero on failure** and prints the row counts it created. As written it
   exited 0 even when seeding threw.
10. **Seed count is 9 services**, not the 10 the plan predicted: `pricingData.ts` holds 6 studio
    and 3 mobile services.
11. **`findOrCreateGuestUser` matches phones with two queries, not one.** The onewitharts
    original uses a single `findFirst` ordered by `isGuest: 'desc'`, which returns a guest
    ahead of a full account because Postgres sorts `true` before `false`. When a phone was on
    BOTH an account and a stray guest row, the `PHONE_HAS_ACCOUNT` conflict never fired and
    the booking was silently merged into the unrelated guest profile — contradicting the
    function's own docstring. It now checks for a non-guest on the number first. Covered by
    the regression test "a full account wins even when a guest shares the same phone".
    **This bug is present in onewitharts today and is worth fixing there too.**
12. **`tsconfig.json` was rewritten by Next 16's build** — `jsx` moved to `react-jsx` and
    `.next/dev/types` was added to `include`. That edit is the framework's, not hand-made.
