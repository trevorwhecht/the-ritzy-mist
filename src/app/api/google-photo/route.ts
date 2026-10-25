import { NextResponse } from 'next/server'
import { getGooglePlace, googleEnv, GOOGLE_REVALIDATE_SECONDS } from '@/lib/googlePlaces'

const NAME_FORMAT = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/
const notFound = () => NextResponse.json({ error: 'Photo not found' }, { status: 404 })
const invalid = () => NextResponse.json({ error: 'Invalid photo name' }, { status: 400 })

// Redirects to Google's keyless photoUri so the API key never reaches the browser.
// Only names in this place's own photo list are accepted, so it cannot act as an open proxy.
// The list (not GOOGLE_PLACE_ID) is the check because Google returns its canonical place id
// in photo names, which can differ from an alias id stored in the env.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name') ?? ''
  const env = googleEnv()
  if (!env) return notFound()
  if (!NAME_FORMAT.test(name)) return invalid()
  const place = await getGooglePlace() // same 24h-cached request the home page makes
  if (!place) return notFound()
  if (!place.photos.some((p) => p.name === name)) return invalid()

  try {
    const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&skipHttpRedirect=true`, {
      headers: { 'X-Goog-Api-Key': env.key },
      next: { revalidate: GOOGLE_REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      console.error('Google photo media failed', res.status)
      return notFound()
    }
    const { photoUri } = (await res.json()) as { photoUri?: unknown }
    if (typeof photoUri !== 'string' || !photoUri.startsWith('https://')) return notFound()
    return new NextResponse(null, {
      status: 302,
      headers: { Location: photoUri, 'Cache-Control': `public, s-maxage=${GOOGLE_REVALIDATE_SECONDS}` },
    })
  } catch (error) {
    console.error('Google photo media failed', error)
    return notFound()
  }
}
