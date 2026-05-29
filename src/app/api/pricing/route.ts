import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { defaultPricingData } from '@/lib/pricingData'

const BLOB_FILENAME = 'pricing-data.json'
const EDIT_PASSWORD = process.env.PRICING_PASSWORD || '6969'

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME })
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url)
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (err) {
    console.error('Error loading pricing from blob:', err)
  }
  return NextResponse.json(defaultPricingData)
}

export async function POST(request: Request) {
  try {
    const { password, data } = await request.json()
    if (password !== EDIT_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await put(BLOB_FILENAME, JSON.stringify(data), {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error saving pricing to blob:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
