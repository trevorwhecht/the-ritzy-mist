'use client'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import AccountSkeleton from './Account-Skeleton'

const VIEWS = ['appointments', 'profile', 'membership'] as const
type View = (typeof VIEWS)[number]

function AccountContent() {
  const { data: session, status } = useSession()
  const params = useSearchParams()
  const requested = params.get('view') ?? ''
  const view: View = (VIEWS as readonly string[]).includes(requested) ? (requested as View) : 'appointments'
  if (status === 'loading') return <AccountSkeleton />
  return (
    <div className="relative z-10 min-h-dvh px-4 md:px-6 lg:px-8 py-8 text-[var(--color-foreground)] font-[AlegreyaSansSC]">
      <h1 className="text-3xl mb-6">Hi {session?.user.firstName}</h1>
      <nav aria-label="Account sections" className="flex gap-2 mb-6">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/account?view=${v}`}
            aria-current={v === view ? 'page' : undefined}
            className={`min-h-11 touch-manipulation px-4 flex items-center rounded capitalize focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none ${
              v === view ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'bg-[var(--color-surface)]'
            }`}
          >
            {v}
          </Link>
        ))}
      </nav>
      <p className="text-[var(--color-muted)]">{view} — coming in the next phase.</p>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent />
    </Suspense>
  )
}
