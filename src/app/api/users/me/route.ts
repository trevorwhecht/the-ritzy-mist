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
