import { GET } from './route'

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

const get = (name?: string) =>
  GET(new Request(`http://x/api/google-photo${name === undefined ? '' : `?name=${encodeURIComponent(name)}`}`))

test('rejects foreign or malformed names with 400', async () => {
  for (const name of [
    undefined,
    '',
    'places/OTHER/photos/abc',
    'places/ChIJabc/photos/',
    'places/ChIJabc/photos/abc/../../x',
    'places/ChIJabc/photos/abc?key=1',
    'places/ChIJabc/photos/abc/media',
    'https://evil.example/places/ChIJabc/photos/abc',
  ]) {
    const res = await get(name)
    expect([name, res.status]).toEqual([name, 400])
  }
  expect(fetchMock).not.toHaveBeenCalled()
})

test('404 when env missing', async () => {
  delete process.env.GOOGLE_PLACES_API_KEY
  expect((await get('places/ChIJabc/photos/abc')).status).toBe(404)
  process.env.GOOGLE_PLACES_API_KEY = 'test-key'
  process.env.GOOGLE_PLACE_ID = ''
  expect((await get('places/ChIJabc/photos/abc')).status).toBe(404)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('404 when Google returns non-ok', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) })
  expect((await get('places/ChIJabc/photos/abc')).status).toBe(404)
})

test('404 when Google returns malformed JSON or fetch rejects', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad') } })
  expect((await get('places/ChIJabc/photos/abc')).status).toBe(404)
  fetchMock.mockRejectedValueOnce(new Error('network down'))
  expect((await get('places/ChIJabc/photos/abc')).status).toBe(404)
})

test('redirects to photoUri', async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ photoUri: 'https://lh3.googleusercontent.com/p/abc=s800' }) })
  const res = await get('places/ChIJabc/photos/Ab_c-9')
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe('https://lh3.googleusercontent.com/p/abc=s800')
  expect(res.headers.get('cache-control')).toBe('public, s-maxage=86400')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://places.googleapis.com/v1/places/ChIJabc/photos/Ab_c-9/media?maxWidthPx=800&skipHttpRedirect=true')
  expect(init.headers).toEqual({ 'X-Goog-Api-Key': 'test-key' })
  expect(init.next).toEqual({ revalidate: 86400 })
})
