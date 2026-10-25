jest.mock('@/services/userService', () => ({ createUser: jest.fn() }))
import { createUser } from '@/services/userService'
import { POST } from './route'

const post = (body: unknown) => POST(new Request('http://x/api/users', { method: 'POST', body: JSON.stringify(body) }))

test('400 on invalid body', async () => {
  const res = await post({ firstName: 'J' })
  expect(res.status).toBe(400)
})
test('409 when email already has an account', async () => {
  ;(createUser as jest.Mock).mockRejectedValue(new Error('An account with this email already exists. Try signing in instead.'))
  const res = await post({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '123456' })
  expect(res.status).toBe(409)
})
test('201 strips password', async () => {
  ;(createUser as jest.Mock).mockResolvedValue({ id: 'u1', email: 'j@x.com', password: 'hash' })
  const res = await post({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '123456' })
  expect(res.status).toBe(201)
  expect(await res.json()).toEqual({ id: 'u1', email: 'j@x.com' })
})
