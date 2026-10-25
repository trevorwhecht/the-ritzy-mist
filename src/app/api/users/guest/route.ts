import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { guestInfoSchema } from '@/models/user'
import { findOrCreateGuestUser } from '@/services/guestUserService'

export const dynamic = 'force-dynamic'

/**
 * POST /api/users/guest
 * Staff creates (or reuses, by phone) a guest user.
 * 201 { user } | 409 { error, code: 'PHONE_HAS_ACCOUNT'|'EMAIL_IN_USE', userId? } | 400
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = guestInfoSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid guest info', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await findOrCreateGuestUser(parsed.data)
    if ('conflict' in result) {
      return NextResponse.json(
        {
          error:
            result.conflict === 'PHONE_HAS_ACCOUNT'
              ? 'This phone number belongs to an existing account'
              : 'This email is already in use by another account',
          code: result.conflict,
          userId: result.conflict === 'PHONE_HAS_ACCOUNT' ? result.userId : null,
        },
        { status: 409 }
      )
    }

    const { password: _password, ...safeUser } = result.user
    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (error) {
    console.error('DEBUG: POST /api/users/guest', error)
    return NextResponse.json(
      // Generic message only: this is an admin route, but a raw Prisma error still carries
      // connection and schema detail that has no business reaching a browser.
      { error: 'Failed to create guest user' },
      { status: 500 }
    )
  }
}
