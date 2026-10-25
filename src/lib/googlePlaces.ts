// Server-only: the one place that knows the Google reviews/photos data sources.
// Places API (New) gives rating, count, Maps link, photos and up to 5 reviews; the Business
// Profile API, when its owner OAuth env is set, replaces the review list with every review.
import { unstable_cache } from 'next/cache'
import { formatDistanceToNow } from 'date-fns'

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

type BusinessReview = {
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean }
  starRating?: string
  comment?: string
  createTime?: string
}
type BusinessReviewsPage = { reviews?: BusinessReview[]; nextPageToken?: string }

const STAR_RATINGS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }
const MAX_PHOTOS = 10
export const GOOGLE_REVALIDATE_SECONDS = 86400

/** Returns both env vars, or null when either is missing or empty. */
export function googleEnv(): { key: string; placeId: string } | null {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  return key && placeId ? { key, placeId } : null
}

/** Returns the 5 Business Profile OAuth vars, or null when any is missing or empty. */
export function googleBusinessEnv(): { clientId: string; clientSecret: string; refreshToken: string; accountId: string; locationId: string } | null {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID
  return clientId && clientSecret && refreshToken && accountId && locationId
    ? { clientId, clientSecret, refreshToken, accountId, locationId }
    : null
}

function mapBusinessReview(r: BusinessReview): GoogleReview {
  return {
    authorName: (!r.reviewer?.isAnonymous && r.reviewer?.displayName) || 'A Google user',
    authorPhotoUri: r.reviewer?.profilePhotoUrl,
    authorUri: undefined,
    rating: STAR_RATINGS[r.starRating ?? ''] ?? 0,
    text: r.comment ?? '',
    relativeTime: r.createTime ? formatDistanceToNow(new Date(r.createTime), { addSuffix: true }) : '',
  }
}

/** Every Business Profile review, in API order. Throws on any failure so nothing bad is cached. */
async function fetchBusinessReviews(): Promise<BusinessReview[]> {
  // Env is read here, not passed in: unstable_cache folds arguments into its cache key.
  const env = googleBusinessEnv()
  if (!env) throw new Error('Google Business Profile env missing')
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.clientId,
      client_secret: env.clientSecret,
      refresh_token: env.refreshToken,
    }).toString(),
  })
  if (!tokenRes.ok) throw new Error(`Google Business token refresh failed ${tokenRes.status}`)
  const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string }
  if (!accessToken) throw new Error('Google Business token refresh returned no access_token')

  const base = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(env.accountId)}/locations/${encodeURIComponent(env.locationId)}/reviews`
  const reviews: BusinessReview[] = []
  let pageToken: string | undefined
  do {
    const query = new URLSearchParams({ pageSize: '50' })
    if (pageToken) query.set('pageToken', pageToken)
    const res = await fetch(`${base}?${query}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) throw new Error(`Google Business reviews page failed ${res.status}`)
    const page = (await res.json()) as BusinessReviewsPage
    reviews.push(...(page.reviews ?? []))
    pageToken = page.nextPageToken
  } while (pageToken)
  if (reviews.length === 0) throw new Error('Google Business Profile returned no reviews')
  return reviews
}

// Raw API reviews are cached (plain JSON); relativeTime is computed at render so it stays current.
const cachedBusinessReviews = unstable_cache(fetchBusinessReviews, ['google-business-reviews'], {
  revalidate: GOOGLE_REVALIDATE_SECONDS,
})

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
    const place: GooglePlace = {
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
    if (googleBusinessEnv()) {
      try {
        place.reviews = (await cachedBusinessReviews()).map(mapBusinessReview)
      } catch (error) {
        console.error('Google Business Profile reviews failed; using Places reviews', error)
      }
    }
    return place
  } catch (error) {
    console.error('Google Places details failed', error)
    return null
  }
}
