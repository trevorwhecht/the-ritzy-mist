import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import prisma from './db'

const toRole = (r: 'CUSTOMER' | 'ADMIN'): 'admin' | 'customer' => (r === 'ADMIN' ? 'admin' : 'customer')

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        // Guests have no password and can never authorize.
        const user = await prisma.user.findUnique({ where: { email: credentials.email.trim().toLowerCase() } })
        if (!user?.password || !(await compare(credentials.password, user.password))) return null
        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: toRole(user.role), firstName: user.firstName, lastName: user.lastName }
      },
    }),
    // Registered only when configured (OWA pattern) — otherwise the button posts an empty client id.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true
      const email = profile?.email?.toLowerCase()
      if (!email || (profile as { email_verified?: boolean }).email_verified !== true) return false
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        if (existing.isGuest) await prisma.user.update({ where: { id: existing.id }, data: { isGuest: false } })
        return true
      }
      const g = profile as { given_name?: string; family_name?: string; name?: string }
      await prisma.user.create({ data: { firstName: g.given_name || g.name || 'Google', lastName: g.family_name || 'User', email, phone: null, isGuest: false } })
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() } })
        if (dbUser) { token.sub = dbUser.id; token.role = toRole(dbUser.role); token.firstName = dbUser.firstName; token.lastName = dbUser.lastName; token.needsPhone = !dbUser.phone }
      }
      if (user && account?.provider !== 'google') { token.role = user.role; token.firstName = user.firstName; token.lastName = user.lastName; token.needsPhone = false }
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
        if (dbUser) { token.needsPhone = !dbUser.phone; token.firstName = dbUser.firstName; token.lastName = dbUser.lastName }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as 'customer' | 'admin'
      session.user.firstName = token.firstName as string
      session.user.lastName = token.lastName as string
      session.user.needsPhone = Boolean(token.needsPhone)
      return session
    },
  },
}

/** Route-handler helper: the session if it is an admin, else null. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin' ? session : null
}
export const getSession = () => getServerSession(authOptions)
