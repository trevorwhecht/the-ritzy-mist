import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getSetting, setSetting, settingSchemas } from '@/lib/settings'
import { SETTING_DEFAULTS, type SettingKey } from '@/lib/settingsDefaults'

export const dynamic = 'force-dynamic'
const KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[]

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const entries = await Promise.all(KEYS.map(async (k) => [k, await getSetting(k)] as const))
    return NextResponse.json(Object.fromEntries(entries))
  } catch (error) {
    // Log the detail, return a generic message: a raw Prisma error can carry the connection
    // string and schema internals, and this response reaches the browser.
    console.error('DEBUG: GET /api/admin/settings', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => null)
    const key = body?.key as SettingKey
    if (!KEYS.includes(key)) return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 })
    const parsed = settingSchemas[key].safeParse(body.value)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    await setSetting(key, parsed.data as never)
    return NextResponse.json({ [key]: await getSetting(key) })
  } catch (error) {
    console.error('DEBUG: PUT /api/admin/settings', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}
