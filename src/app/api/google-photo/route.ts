import { NextResponse } from 'next/server'
import { googleEnv, GOOGLE_REVALIDATE_SECONDS } from '@/lib/googlePlaces'

// Redirects to Google's keyless photoUri so the API key never reaches the browser.
// Only this place's photo names are accepted, so it cannot act as an open proxy.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') ?? ''
  const env = googleEnv()
  if (!env) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  const prefix = `places/${env.placeId}/photos/`
  if (!name.startsWith(prefix) || !/^[A-Za-z0-9_-]+$/.test(name.slice(prefix.length))) {
    return NextResponse.json({ error: 'Invalid photo name' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&skipHttpRedirect=true`, {
      headers: { 'X-Goog-Api-Key': env.key },
      next: { revalidate: GOOGLE_REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      console.error('Google photo media failed', res.status)
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    const { photoUri } = (await res.json()) as { photoUri?: unknown }
    if (typeof photoUri !== 'string' || !photoUri.startsWith('https://')) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }
    return new NextResponse(null, {
      status: 302,
      headers: { Location: photoUri, 'Cache-Control': `public, s-maxage=${GOOGLE_REVALIDATE_SECONDS}` },
    })
  } catch (error) {
    console.error('Google photo media failed', error)
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  }
}
