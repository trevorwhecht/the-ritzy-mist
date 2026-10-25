'use client'
import { Button } from '@heroui/react'
import { LogOut, CalendarDays, UserRound, Sparkles, Users, BarChart3, Settings } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const CUSTOMER = [
  { label: 'Appointments', href: '/account?view=appointments', Icon: CalendarDays },
  { label: 'Profile', href: '/account?view=profile', Icon: UserRound },
  { label: 'Membership', href: '/account?view=membership', Icon: Sparkles },
]
const ADMIN = [
  { label: 'Calendar', href: '/admin/dashboard?view=calendar', Icon: CalendarDays },
  { label: 'Users', href: '/admin/dashboard?view=users', Icon: Users },
  { label: 'Insights', href: '/admin/dashboard?view=insights', Icon: BarChart3 },
  { label: 'Settings', href: '/admin/dashboard?view=settings', Icon: Settings },
]

export default function LoggedIn({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const router = useRouter()
  const items = session?.user.role === 'admin' ? ADMIN : CUSTOMER
  const go = (href: string) => {
    onClose()
    router.push(href)
  }
  return (
    <nav aria-label="Account" className="flex flex-col gap-2 w-full font-[AlegreyaSansSC]">
      <h2 className="text-xl font-bold text-[var(--color-foreground)] text-right">
        Welcome {session?.user?.firstName || 'there'}
      </h2>
      {items.map(({ label, href, Icon }) => (
        <button
          key={href}
          onClick={() => go(href)}
          className="min-h-11 touch-manipulation w-full flex items-center justify-end gap-2 text-2xl text-[var(--color-foreground)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none rounded transition-colors duration-200 motion-reduce:transition-none"
        >
          <Icon className="w-5 h-5" aria-hidden /> <span>{label}</span>
        </button>
      ))}
      <div className="flex justify-end pt-2">
        <Button
          color="danger"
          variant="flat"
          className="min-h-11 touch-manipulation text-lg"
          onPress={async () => {
            await signOut({ callbackUrl: '/' })
            onClose()
          }}
        >
          <LogOut className="w-5 h-5 mr-2" aria-hidden /> Log Out
        </Button>
      </div>
    </nav>
  )
}
