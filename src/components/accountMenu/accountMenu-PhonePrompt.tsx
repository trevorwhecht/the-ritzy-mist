'use client'
import { useState } from 'react'
import { Button } from '@heroui/react'
import { useSession } from 'next-auth/react'
import PhoneInput from '@/components/PhoneInput'
import LoadingSpinner from '@/components/LoadingSpinner'

/** Shown when session.user.needsPhone — Google first-timers must add a phone. */
export default function AccountMenuPhonePrompt() {
  const { update } = useSession()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Failed to save phone')
        return
      }
      await update() // refresh JWT so needsPhone clears
    } catch {
      setError('Failed to save phone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 border border-[var(--color-warning)] rounded-lg">
      <p className="text-[var(--color-warning)] text-sm">
        One last step — add your phone number so we can match your appointments.
      </p>
      <PhoneInput value={phone} onChange={setPhone} errorMessage={error} isInvalid={!!error} />
      <Button
        className="min-h-11 touch-manipulation bg-[var(--color-foreground)] text-[var(--color-background)]"
        onPress={save}
        disabled={loading}
      >
        {loading ? <LoadingSpinner size="xs" label={null} /> : 'Save Phone Number'}
      </Button>
    </div>
  )
}
