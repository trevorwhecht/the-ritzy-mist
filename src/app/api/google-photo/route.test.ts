import { GET } from './route'

const fetchMock = jest.fn()
const env = { ...process.env }
const PHOTO = 'places/ChIJcanon/photos/Ab_c-9'
const details = { ok: true, status: 200, json: async () => ({ rating: 5, userRatingCount: 39, googleMapsUri: 'https://maps.google.com/x', photos: [{ name: PHOTO }] }) }
let media: unknown

beforeEach(() => {
  fetchMock.mockReset()
  media = { ok: true, status: 200, json: async () => ({ photoUri: 'https://lh3.googleusercontent.com/p/abc=s800' }) }
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith('/media?maxWidthPx=800&skipHttpRedirect=true')) {
      if (media instanceof Error) throw media
      return media
    }
    return details
  })
  global.fetch = fetchMock as unknown as typeof fetch
  process.env.GOOGLE_PLACES_API_KEY = 'test-key'
  // An alias id: Google answers details for it but names photos with its canonical id.
  process.env.GOOGLE_PLACE_ID = 'ChIJalias'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  process.env = { ...env }
  jest.restoreAllMocks()
})

const get = (name?: string) =>
  GET(new Request(`http://x/api/google-photo${name === undefined ? '' : `?name=${encodeURIComponent(name)}`}`))
const mediaCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/media'))

test('rejects foreign or malformed names with 400', async () => {
  for (const name of [
    undefined,
    '',
    'places/OTHER/photos/abc',
    'places/ChIJcanon/photos/',
    'places/ChIJcanon/photos/Ab_c-9/../../x',
    'places/ChIJcanon/photos/Ab_c-9?key=1',
    'places/ChIJcanon/photos/Ab_c-9/media',
    'https://evil.example/places/ChIJcanon/photos/Ab_c-9',
    'places/ChIJcanon/photos/notInList',
  ]) {
    const res = await get(name)
    expect([name, res.status]).toEqual([name, 400])
  }
  expect(mediaCalls()).toHaveLength(0)
})

test('404 when env missing', async () => {
  delete process.env.GOOGLE_PLACES_API_KEY
  expect((await get(PHOTO)).status).toBe(404)
  process.env.GOOGLE_PLACES_API_KEY = 'test-key'
  process.env.GOOGLE_PLACE_ID = ''
  expect((await get(PHOTO)).status).toBe(404)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('404 when Google returns non-ok', async () => {
  media = { ok: false, status: 403, json: async () => ({}) }
  expect((await get(PHOTO)).status).toBe(404)
})

test('404 when place details fail', async () => {
  fetchMock.mockImplementation(async () => ({ ok: false, status: 500, json: async () => ({}) }))
  expect((await get(PHOTO)).status).toBe(404)
  expect(mediaCalls()).toHaveLength(0)
})

test('404 when Google returns malformed JSON or fetch rejects', async () => {
  media = { ok: true, status: 200, json: async () => { throw new SyntaxError('bad') } }
  expect((await get(PHOTO)).status).toBe(404)
  media = new Error('network down')
  expect((await get(PHOTO)).status).toBe(404)
})

test('redirects to photoUri', async () => {
  const res = await get(PHOTO)
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('https://lh3.googleusercontent.com/p/abc=s800')
  expect(res.headers.get('cache-control')).toBe('public, s-maxage=86400')
  const [url, init] = mediaCalls()[0]
  expect(url).toBe('https://places.googleapis.com/v1/places/ChIJcanon/photos/Ab_c-9/media?maxWidthPx=800&skipHttpRedirect=true')
  expect(init.headers).toEqual({ 'X-Goog-Api-Key': 'test-key' })
  expect(init.next).toEqual({ revalidate: 86400 })
})
