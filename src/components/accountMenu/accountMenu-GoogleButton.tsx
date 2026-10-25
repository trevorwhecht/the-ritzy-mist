'use client'

import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { getProviders, signIn } from 'next-auth/react'

/**
 * Renders nothing until NextAuth reports a configured Google provider. Without
 * GOOGLE_CLIENT_ID/SECRET the provider is not registered (src/lib/auth.ts), so the button would
 * otherwise post an empty client id and error. It appears on its own once the credentials exist —
 * no code change needed.
 */
export default function AccountMenuGoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProviders()
      .then((providers) => {
        if (!cancelled) setEnabled(Boolean(providers?.google))
      })
      .catch(() => {
        if (!cancelled) setEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!enabled) return null

  return (
    <Button
      variant="bordered"
      className="w-full min-h-11 touch-manipulation text-[var(--color-foreground)] border-[var(--color-border)]"
      onPress={() => signIn('google')}
    >
      {label}
    </Button>
  )
}
