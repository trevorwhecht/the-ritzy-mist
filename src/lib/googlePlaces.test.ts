import { getGooglePlace } from './googlePlaces'

jest.mock('next/cache', () => {
  const calls: { fn: () => Promise<unknown>; keys: string[]; options: unknown }[] = []
  return {
    calls,
    unstable_cache: (fn: () => Promise<unknown>, keys: string[], options: unknown) => {
      calls.push({ fn, keys, options })
      return fn
    },
  }
})

const fetchMock = jest.fn()
const env = { ...process.env }

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  process.env.GOOGLE_PLACES_API_KEY = 'test-key'
  process.env.GOOGLE_PLACE_ID = 'ChIJabc'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  process.env = { ...env }
  jest.restoreAllMocks()
})

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body })

const photo = (i: number) => ({
  name: `places/ChIJabc/photos/p${i}`,
  widthPx: 800,
  heightPx: 600,
  authorAttributions: [{ displayName: `Owner ${i}`, uri: `https://maps.google.com/u${i}` }],
})

test('requests place details with field mask and 24h revalidate', async () => {
  fetchMock.mockResolvedValue(okJson({ rating: 5, userRatingCount: 39, googleMapsUri: 'https://maps.google.com/x' }))
  await getGooglePlace()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://places.googleapis.com/v1/places/ChIJabc')
  expect(init.method ?? 'GET').toBe('GET')
  expect(init.headers).toEqual({
    'X-Goog-Api-Key': 'test-key',
    'X-Goog-FieldMask': 'rating,userRatingCount,reviews,photos,googleMapsUri',
  })
  expect(init.next).toEqual({ revalidate: 86400 })
})

test('maps reviews and caps photos at 10', async () => {
  fetchMock.mockResolvedValue(
    okJson({
      rating: 5,
      userRatingCount: 39,
      googleMapsUri: 'https://maps.google.com/x',
      reviews: [
        {
          rating: 5,
          relativePublishTimeDescription: '2 weeks ago',
          text: { text: '  Best tan ever!\nWill be back.  ', languageCode: 'en' },
          authorAttribution: { displayName: 'Jane D', uri: 'https://maps.google.com/jane', photoUri: 'https://lh3.googleusercontent.com/jane' },
        },
      ],
      photos: Array.from({ length: 12 }, (_, i) => photo(i)),
    })
  )
  const place = await getGooglePlace()
  expect(place).not.toBeNull()
  expect(place!.rating).toBe(5)
  expect(place!.userRatingCount).toBe(39)
  expect(place!.googleMapsUri).toBe('https://maps.google.com/x')
  expect(place!.reviews).toEqual([
    {
      authorName: 'Jane D',
      authorUri: 'https://maps.google.com/jane',
      authorPhotoUri: 'https://lh3.googleusercontent.com/jane',
      rating: 5,
      relativeTime: '2 weeks ago',
      text: '  Best tan ever!\nWill be back.  ',
    },
  ])
  expect(place!.photos).toHaveLength(10)
  expect(place!.photos[0]).toEqual({
    name: 'places/ChIJabc/photos/p0',
    width: 800,
    height: 600,
    attributions: [{ displayName: 'Owner 0', uri: 'https://maps.google.com/u0' }],
  })
  expect(place!.photos[9].name).toBe('places/ChIJabc/photos/p9')
})

test('returns empty lists when Google omits reviews and photos', async () => {
  fetchMock.mockResolvedValue(okJson({ rating: 4.6, userRatingCount: 3, googleMapsUri: 'https://maps.google.com/x' }))
  const place = await getGooglePlace()
  expect(place).toEqual({ rating: 4.6, userRatingCount: 3, googleMapsUri: 'https://maps.google.com/x', reviews: [], photos: [] })
})

describe('returns null when env missing / non-ok / throws', () => {
  test.each([
    ['key missing', 'GOOGLE_PLACES_API_KEY', undefined],
    ['key empty', 'GOOGLE_PLACES_API_KEY', ''],
    ['place id missing', 'GOOGLE_PLACE_ID', undefined],
    ['place id empty', 'GOOGLE_PLACE_ID', ''],
  ])('%s: no fetch', async (_label, name, value) => {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
    await expect(getGooglePlace()).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: {} }) })
    await expect(getGooglePlace()).resolves.toBeNull()
  })

  test('fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    await expect(getGooglePlace()).resolves.toBeNull()
  })

  test('malformed JSON', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <') } })
    await expect(getGooglePlace()).resolves.toBeNull()
  })
})

describe('Business Profile reviews', () => {
  const PLACES_URL = 'https://places.googleapis.com/v1/places/ChIJabc'
  const TOKEN_URL = 'https://oauth2.googleapis.com/token'
  const REVIEWS_URL = 'https://mybusiness.googleapis.com/v4/accounts/acc1/locations/loc1/reviews'
  const placesBody = {
    rating: 5,
    userRatingCount: 39,
    googleMapsUri: 'https://maps.google.com/x',
    reviews: [{ rating: 4, relativePublishTimeDescription: 'a week ago', text: { text: 'Places review' }, authorAttribution: { displayName: 'Places Pat' } }],
    photos: [photo(0)],
  }
  const placesReviews = [
    { authorName: 'Places Pat', authorUri: undefined, authorPhotoUri: undefined, rating: 4, relativeTime: 'a week ago', text: 'Places review' },
  ]
  const placesPhotos = [{ name: 'places/ChIJabc/photos/p0', width: 800, height: 600, attributions: [{ displayName: 'Owner 0', uri: 'https://maps.google.com/u0' }] }]
  const bpReview = (i: number) => ({
    reviewId: `r${i}`,
    reviewer: { displayName: `Reviewer ${i}`, profilePhotoUrl: `https://lh3.googleusercontent.com/r${i}` },
    starRating: 'FIVE',
    comment: `Comment ${i}`,
    createTime: '2020-01-01T00:00:00Z',
  })

  beforeEach(() => {
    process.env.GOOGLE_BUSINESS_CLIENT_ID = 'cid'
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET = 'csecret'
    process.env.GOOGLE_BUSINESS_REFRESH_TOKEN = 'rtoken'
    process.env.GOOGLE_BUSINESS_ACCOUNT_ID = 'acc1'
    process.env.GOOGLE_BUSINESS_LOCATION_ID = 'loc1'
  })

  /** Routes mocked fetch by URL; `pages` are the reviews pages served in order. */
  function route(pages: unknown[], token: unknown = okJson({ access_token: 'atoken', expires_in: 3599 })) {
    let page = 0
    fetchMock.mockImplementation(async (url: string) => {
      if (url === PLACES_URL) return okJson(placesBody)
      if (url === TOKEN_URL) return token
      if (url.startsWith(REVIEWS_URL)) return pages[page++]
      throw new Error(`unexpected fetch ${url}`)
    })
  }

  test('fetches all Business Profile review pages with the refreshed token', async () => {
    route([
      okJson({ reviews: Array.from({ length: 50 }, (_, i) => bpReview(i)), nextPageToken: 'page2', totalReviewCount: 51 }),
      okJson({ reviews: [bpReview(50)], totalReviewCount: 51 }),
    ])
    const place = await getGooglePlace()
    expect(fetchMock).toHaveBeenCalledTimes(4)

    const tokenCall = fetchMock.mock.calls.find(([url]) => url === TOKEN_URL)!
    expect(tokenCall[1].method).toBe('POST')
    expect(Object.fromEntries(new URLSearchParams(String(tokenCall[1].body)))).toEqual({
      grant_type: 'refresh_token',
      client_id: 'cid',
      client_secret: 'csecret',
      refresh_token: 'rtoken',
    })

    const reviewCalls = fetchMock.mock.calls.filter(([url]) => String(url).startsWith(REVIEWS_URL))
    expect(reviewCalls.map(([url]) => url)).toEqual([`${REVIEWS_URL}?pageSize=50`, `${REVIEWS_URL}?pageSize=50&pageToken=page2`])
    for (const [, init] of reviewCalls) expect(init.headers).toEqual({ Authorization: 'Bearer atoken' })
    const tokenIndex = fetchMock.mock.calls.indexOf(tokenCall)
    expect(fetchMock.mock.calls.indexOf(reviewCalls[0])).toBeGreaterThan(tokenIndex)

    expect(place!.reviews).toHaveLength(51)
    expect(place!.reviews[0].authorName).toBe('Reviewer 0')
    expect(place!.reviews[49].authorName).toBe('Reviewer 49')
    expect(place!.reviews[50].authorName).toBe('Reviewer 50')
    expect(place!.rating).toBe(5)
    expect(place!.userRatingCount).toBe(39)
    expect(place!.googleMapsUri).toBe('https://maps.google.com/x')
    expect(place!.photos).toEqual(placesPhotos)
  })

  test('maps Business Profile reviews to GoogleReview', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-25T12:00:00Z') })
    try {
      route([
        okJson({
          reviews: [
            { reviewer: { displayName: 'Jane D', profilePhotoUrl: 'https://lh3.googleusercontent.com/jane' }, starRating: 'FIVE', comment: 'Lovely tan', createTime: '2026-10-11T12:00:00Z' },
            { reviewer: { displayName: 'Hidden Name', isAnonymous: true }, starRating: 'ONE', comment: 'Meh', createTime: '2026-10-24T12:00:00Z' },
            { reviewer: {}, starRating: 'THREE', createTime: '2025-10-25T12:00:00Z' },
            { reviewer: { displayName: 'Two' }, starRating: 'TWO', comment: 'ok', createTime: '2026-10-25T11:00:00Z' },
            { reviewer: { displayName: 'Four' }, starRating: 'FOUR', comment: 'good', createTime: '2026-10-25T11:00:00Z' },
            { reviewer: { displayName: 'Odd' }, starRating: 'STAR_RATING_UNSPECIFIED', comment: 'x', createTime: '2026-10-25T11:00:00Z' },
          ],
        }),
      ])
      const place = await getGooglePlace()
      expect(place!.reviews).toEqual([
        { authorName: 'Jane D', authorPhotoUri: 'https://lh3.googleusercontent.com/jane', authorUri: undefined, rating: 5, text: 'Lovely tan', relativeTime: '14 days ago' },
        { authorName: 'A Google user', authorPhotoUri: undefined, authorUri: undefined, rating: 1, text: 'Meh', relativeTime: '1 day ago' },
        { authorName: 'A Google user', authorPhotoUri: undefined, authorUri: undefined, rating: 3, text: '', relativeTime: 'about 1 year ago' },
        { authorName: 'Two', authorPhotoUri: undefined, authorUri: undefined, rating: 2, text: 'ok', relativeTime: 'about 1 hour ago' },
        { authorName: 'Four', authorPhotoUri: undefined, authorUri: undefined, rating: 4, text: 'good', relativeTime: 'about 1 hour ago' },
        { authorName: 'Odd', authorPhotoUri: undefined, authorUri: undefined, rating: 0, text: 'x', relativeTime: 'about 1 hour ago' },
      ])
    } finally {
      jest.useRealTimers()
    }
  })

  test('falls back to Places reviews when the token call fails', async () => {
    route([], { ok: false, status: 401, json: async () => ({ error: 'invalid_grant' }) })
    const place = await getGooglePlace()
    expect(place!.reviews).toEqual(placesReviews)
    expect(console.error).toHaveBeenCalled()
  })

  test('falls back when a reviews page fails', async () => {
    route([okJson({ reviews: [bpReview(0)], nextPageToken: 'page2' }), { ok: false, status: 500, json: async () => ({}) }])
    const place = await getGooglePlace()
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(place!.reviews).toEqual(placesReviews)
    expect(console.error).toHaveBeenCalled()
  })

  test('falls back when the Business Profile fetch rejects', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === PLACES_URL) return okJson(placesBody)
      throw new Error('network down')
    })
    const place = await getGooglePlace()
    expect(place!.reviews).toEqual(placesReviews)
    expect(console.error).toHaveBeenCalled()
  })

  test('falls back when Business Profile returns no reviews', async () => {
    route([okJson({})])
    const place = await getGooglePlace()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(place!.reviews).toEqual(placesReviews)
    expect(console.error).toHaveBeenCalled()
  })

  test('skips Business Profile when its env is missing', async () => {
    process.env.GOOGLE_BUSINESS_REFRESH_TOKEN = ''
    route([])
    const place = await getGooglePlace()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(PLACES_URL)
    expect(place!.reviews).toEqual(placesReviews)
  })

  test('caches Business Profile reviews for 24h', async () => {
    const { calls } = jest.requireMock('next/cache') as { calls: { fn: () => Promise<unknown>; keys: string[]; options: unknown }[] }
    const entry = calls.find((c) => c.keys.includes('google-business-reviews'))!
    expect(entry.keys).toEqual(['google-business-reviews'])
    expect(entry.options).toEqual({ revalidate: 86400 })
    route([], { ok: false, status: 401, json: async () => ({}) })
    await expect(entry.fn()).rejects.toThrow()
  })
})
