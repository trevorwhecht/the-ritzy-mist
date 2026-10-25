import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { defaultPricingData } from '@/lib/pricingData'
import { defaultCareData } from '@/lib/careData'

const EDIT_PASSWORD = process.env.PRICING_PASSWORD || '6969'

// Add an entry here to make another page editable via ?isEditable=true
const CONTENT = {
  pricing: { file: 'pricing-data.json', defaults: defaultPricingData },
  care: { file: 'care-data.json', defaults: defaultCareData },
} as const

const resolve = (key: string) =>
  (CONTENT as Record<string, { file: string; defaults: unknown } | undefined>)[key]

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const entry = resolve(key)
  if (!entry) return NextResponse.json({ error: 'Unknown content key' }, { status: 404 })

  try {
    const { blobs } = await list({ prefix: entry.file })
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url)
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err) {
    console.error(`Error loading ${key} from blob:`, err)
  }
  return NextResponse.json(entry.defaults)
}

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const entry = resolve(key)
  if (!entry) return NextResponse.json({ error: 'Unknown content key' }, { status: 404 })

  try {
    const { password, data } = await request.json()
    if (password !== EDIT_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    await put(entry.file, JSON.stringify(data), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`Error saving ${key} to blob:`, err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
