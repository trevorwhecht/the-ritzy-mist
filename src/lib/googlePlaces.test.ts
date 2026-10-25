import { getGooglePlace } from './googlePlaces'

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
