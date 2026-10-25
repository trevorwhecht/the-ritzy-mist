import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/all
 * Get all users (admin only)
 */
export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isGuest: true,
        skinType: true,
        skinTone: true,
        instagram: true,
      },
      orderBy: [{ isGuest: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    // Log the detail, return a generic message: a raw Prisma error can carry the connection
    // string and schema internals, and this response reaches the browser.
    console.error('DEBUG: GET /api/users/all', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}
