// Importing the module is what makes the `declare module` blocks below augment it
// rather than replace it. The binding itself is deliberately unused.
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      firstName?: string | null
      lastName?: string | null
      role: 'customer' | 'admin'
      /** Google first-timer with no phone yet — must complete the phone step (spec §5) */
      needsPhone?: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    firstName?: string | null
    lastName?: string | null
    role: 'customer' | 'admin'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName?: string | null
    lastName?: string | null
    role: 'customer' | 'admin'
    needsPhone?: boolean
  }
}
