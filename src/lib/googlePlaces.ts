// Server-only: the one place that knows the Google reviews/photos data source (Places API New).
// Swap this module for the Business Profile API later without touching the components.

export type GoogleReview = {
  authorName: string
  authorUri?: string
  authorPhotoUri?: string
  rating: number
  relativeTime: string
  text: string
}
export type GooglePhoto = { name: string; width: number; height: number; attributions: { displayName: string; uri?: string }[] }
export type GooglePlace = {
  rating: number
  userRatingCount: number
  googleMapsUri: string
  reviews: GoogleReview[]
  photos: GooglePhoto[]
}

type ApiReview = {
  rating?: number
  relativePublishTimeDescription?: string
  text?: { text?: string }
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
}
type ApiPhoto = { name?: string; widthPx?: number; heightPx?: number; authorAttributions?: { displayName?: string; uri?: string }[] }
type ApiPlace = { rating?: number; userRatingCount?: number; googleMapsUri?: string; reviews?: ApiReview[]; photos?: ApiPhoto[] }

const MAX_PHOTOS = 10
export const GOOGLE_REVALIDATE_SECONDS = 86400

/** Returns both env vars, or null when either is missing or empty. */
export function googleEnv(): { key: string; placeId: string } | null {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  return key && placeId ? { key, placeId } : null
}

export async function getGooglePlace(): Promise<GooglePlace | null> {
  const env = googleEnv()
  if (!env) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${env.placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.key,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,photos,googleMapsUri',
      },
      next: { revalidate: GOOGLE_REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      console.error('Google Places details failed', res.status)
      return null
    }
    const data = (await res.json()) as ApiPlace
    return {
      rating: data.rating ?? 0,
      userRatingCount: data.userRatingCount ?? 0,
      googleMapsUri: data.googleMapsUri ?? '',
      reviews: (data.reviews ?? []).map((r) => ({
        authorName: r.authorAttribution?.displayName ?? '',
        authorUri: r.authorAttribution?.uri,
        authorPhotoUri: r.authorAttribution?.photoUri,
        rating: r.rating ?? 0,
        relativeTime: r.relativePublishTimeDescription ?? '',
        text: r.text?.text ?? '',
      })),
      photos: (data.photos ?? [])
        .filter((p): p is ApiPhoto & { name: string } => typeof p.name === 'string')
        .slice(0, MAX_PHOTOS)
        .map((p) => ({
          name: p.name,
          width: p.widthPx ?? 0,
          height: p.heightPx ?? 0,
          attributions: (p.authorAttributions ?? []).map((a) => ({ displayName: a.displayName ?? '', uri: a.uri })),
        })),
    }
  } catch (error) {
    console.error('Google Places details failed', error)
    return null
  }
}
