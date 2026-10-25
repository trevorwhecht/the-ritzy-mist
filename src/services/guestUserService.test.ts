jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn() } },
}))
import prisma from '@/lib/db'
import { findOrCreateGuestUser } from './guestUserService'

const db = prisma as unknown as { user: Record<string, jest.Mock> }
const info = { firstName: 'Jane', lastName: 'D', phone: '(208) 555-0199' }

/**
 * The service makes two distinct phone lookups: first for a full account, then for a reusable
 * guest. Route each by the `isGuest` value in the where clause so a test can say
 * "an account exists" and "a guest exists" independently — which is the case that matters.
 */
function onPhone({ account, guest }: { account?: unknown; guest?: unknown }) {
  db.user.findFirst.mockImplementation(({ where }: { where: { isGuest?: boolean } }) =>
    Promise.resolve(where.isGuest === false ? (account ?? null) : (guest ?? null))
  )
}

beforeEach(() => Object.values(db.user).forEach((m) => m.mockReset()))

test('phone on a full account → PHONE_HAS_ACCOUNT', async () => {
  onPhone({ account: { id: 'u1', isGuest: false } })
  expect(await findOrCreateGuestUser(info)).toEqual({ conflict: 'PHONE_HAS_ACCOUNT', userId: 'u1' })
})

test('a full account wins even when a guest shares the same phone', async () => {
  // Regression: a single query ordered by `isGuest: desc` returns the guest first (Postgres
  // sorts true before false), so the account was never seen and the booking was silently
  // merged into an unrelated guest profile.
  onPhone({ account: { id: 'u1', isGuest: false }, guest: { id: 'g1', isGuest: true } })
  expect(await findOrCreateGuestUser(info)).toEqual({ conflict: 'PHONE_HAS_ACCOUNT', userId: 'u1' })
  expect(db.user.update).not.toHaveBeenCalled()
  expect(db.user.create).not.toHaveBeenCalled()
})

test('email owned by someone else → EMAIL_IN_USE', async () => {
  onPhone({})
  db.user.findUnique.mockResolvedValue({ id: 'u2' })
  expect(await findOrCreateGuestUser({ ...info, email: 'x@y.com' })).toEqual({ conflict: 'EMAIL_IN_USE' })
})

test('existing guest by phone is refreshed, not duplicated', async () => {
  onPhone({ guest: { id: 'g1', isGuest: true } })
  db.user.update.mockResolvedValue({ id: 'g1' })
  await findOrCreateGuestUser(info)
  expect(db.user.update).toHaveBeenCalledWith({
    where: { id: 'g1' },
    data: { firstName: 'Jane', lastName: 'D' },
  })
  expect(db.user.create).not.toHaveBeenCalled()
})

test('no match → creates guest with normalized phone', async () => {
  onPhone({})
  db.user.create.mockResolvedValue({ id: 'g2' })
  await findOrCreateGuestUser(info)
  expect(db.user.create).toHaveBeenCalledWith({
    data: { firstName: 'Jane', lastName: 'D', phone: '2085550199', email: null, isGuest: true },
  })
})
