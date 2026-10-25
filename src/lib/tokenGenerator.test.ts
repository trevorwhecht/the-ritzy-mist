import { generatePublicToken } from './tokenGenerator'

test('token is 43 url-safe chars and unique', () => {
  const a = generatePublicToken(), b = generatePublicToken()
  expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(a).not.toBe(b)
})
