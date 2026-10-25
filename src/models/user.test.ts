import { guestInfoSchema, userSignupSchema, profileSchema } from './user'

test('guestInfoSchema: name + valid phone required, blank email → undefined', () => {
  const r = guestInfoSchema.safeParse({ firstName: ' Jane ', lastName: 'D', phone: '(208) 555-0199', email: '' })
  expect(r.success).toBe(true)
  if (r.success) { expect(r.data.firstName).toBe('Jane'); expect(r.data.email).toBeUndefined() }
  expect(guestInfoSchema.safeParse({ firstName: 'J', lastName: 'D', phone: '123' }).success).toBe(false)
})
test('userSignupSchema requires email + 6-char password', () => {
  expect(userSignupSchema.safeParse({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '12345' }).success).toBe(false)
  expect(userSignupSchema.safeParse({ firstName: 'J', lastName: 'D', phone: '2085550199', email: 'j@x.com', password: '123456' }).success).toBe(true)
})
test('profileSchema bounds skinType 1–6 and skinTone enum', () => {
  expect(profileSchema.safeParse({ skinType: 7 }).success).toBe(false)
  expect(profileSchema.safeParse({ skinType: 3, skinTone: 'OLIVE', instagram: '@jane' }).success).toBe(true)
  expect(profileSchema.safeParse({ skinTone: 'GREEN' }).success).toBe(false)
})
