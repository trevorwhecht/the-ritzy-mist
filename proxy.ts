import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Next 16 renamed the middleware entrypoint from `middleware.ts` to `proxy.ts`.
 *
 * `/admin` is the login page and must stay reachable signed out; everything below it is
 * admin-only. Guarding the whole `/admin/*` subtree rather than just `/admin/dashboard`
 * means a future admin route is protected the day it is added, instead of the day someone
 * remembers to extend this list.
 */
export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl
    const isAdminArea = pathname.startsWith('/admin/') || pathname === '/admin/'
    if (isAdminArea && req.nextauth.token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      // The login page itself is public; every other matched path needs a session.
      authorized: ({ token, req }) => req.nextUrl.pathname === '/admin' || !!token,
    },
  }
)

export const config = { matcher: ['/admin', '/admin/:path*', '/account', '/account/:path*'] }
