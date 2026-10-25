import { extractApiErrorMessage, ReadableResponse } from './apiResponse'

function mockResponse(opts: {
  status: number
  contentType?: string
  json?: unknown
  jsonThrows?: boolean
  text?: string
}): ReadableResponse {
  return {
    ok: false,
    status: opts.status,
    headers: { get: () => opts.contentType ?? null },
    json: async () => {
      if (opts.jsonThrows) throw new SyntaxError('Unexpected token')
      return opts.json
    },
    text: async () => opts.text ?? '',
  }
}

describe('extractApiErrorMessage', () => {
  it('prefers details, then error, from a JSON body', async () => {
    const res = mockResponse({
      status: 400,
      contentType: 'application/json',
      json: { error: 'e', details: 'the details' },
    })
    expect(await extractApiErrorMessage(res)).toBe('the details')
  })

  it('falls back to error when details is missing', async () => {
    const res = mockResponse({ status: 400, contentType: 'application/json', json: { error: 'just error' } })
    expect(await extractApiErrorMessage(res)).toBe('just error')
  })

  it('gives a friendly message for a plain-text 413 (the "Request En" bug)', async () => {
    const res = mockResponse({ status: 413, contentType: 'text/plain', text: 'Request Entity Too Large' })
    expect(await extractApiErrorMessage(res)).toMatch(/too large/i)
  })

  it('detects the truncated "Request En" body even without a 413 status', async () => {
    const res = mockResponse({ status: 500, contentType: 'text/html', text: 'Request En' })
    expect(await extractApiErrorMessage(res)).toMatch(/too large/i)
  })

  it('never throws even if json() throws on a mislabeled body', async () => {
    const res = mockResponse({ status: 500, contentType: 'application/json', jsonThrows: true })
    await expect(extractApiErrorMessage(res)).resolves.toContain('500')
  })

  it('returns a status-based message for an empty body', async () => {
    const res = mockResponse({ status: 502, contentType: 'text/plain', text: '' })
    expect(await extractApiErrorMessage(res)).toContain('502')
  })
})
