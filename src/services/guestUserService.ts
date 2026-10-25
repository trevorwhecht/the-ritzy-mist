import prisma from '@/lib/db'
import { normalizePhone } from '@/lib/phone'
import type { GuestInfo } from '@/models/user'
import type { User } from '@prisma/client'

export type GuestResult =
  | { user: User }
  | { conflict: 'PHONE_HAS_ACCOUNT'; userId: string }
  | { conflict: 'EMAIL_IN_USE' }

/**
 * Find a reusable guest (isGuest === true) by phone, or create one.
 *
 * Never touches a full account:
 * - phone belongs to a non-guest -> PHONE_HAS_ACCOUNT, caller prompts sign-in
 *   (staff may then link the appointment to that account explicitly)
 * - email belongs to any other user -> EMAIL_IN_USE, caller may retry without email
 *
 * A matching guest has their name refreshed (and email filled in if newly
 * provided) so the most recent checkout details win.
 */
export async function findOrCreateGuestUser(info: GuestInfo): Promise<GuestResult> {
  const phone = normalizePhone(info.phone)
  if (!phone) throw new Error('Invalid phone number')
  const email = info.email?.trim() ? info.email.trim().toLowerCase() : null

  // Phone is not unique, so these are two separate questions and must be two queries.
  // Asking once with `orderBy: [{ isGuest: 'desc' }, ...]` returns a guest ahead of an
  // account (Postgres sorts true before false), so an account sharing the number was never
  // seen and the booking was silently merged into an unrelated guest profile instead.
  //
  // A full account owning this number always wins: report it and let the caller prompt a
  // sign-in. Never reuse or modify it.
  const accountOnPhone = await prisma.user.findFirst({
    where: { phone, isGuest: false },
    select: { id: true },
  })
  if (accountOnPhone) {
    return { conflict: 'PHONE_HAS_ACCOUNT', userId: accountOnPhone.id }
  }

  // No account owns it: reuse the most recent guest carrying this number, if any.
  const byPhone = await prisma.user.findFirst({
    where: { phone, isGuest: true },
    orderBy: { createdAt: 'desc' },
  })

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail && byEmail.id !== byPhone?.id) {
      return { conflict: 'EMAIL_IN_USE' }
    }
  }

  if (byPhone) {
    const user = await prisma.user.update({
      where: { id: byPhone.id },
      data: {
        firstName: info.firstName,
        lastName: info.lastName,
        ...(email ? { email } : {}),
      },
    })
    return { user }
  }

  const user = await prisma.user.create({
    data: { firstName: info.firstName, lastName: info.lastName, phone, email, isGuest: true },
  })
  return { user }
}
