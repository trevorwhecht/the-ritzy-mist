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
