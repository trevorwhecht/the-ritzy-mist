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
