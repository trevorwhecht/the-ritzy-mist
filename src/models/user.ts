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
