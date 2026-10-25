'use client'
import React, { useState } from 'react'
import { Button, Input } from '@heroui/react'
import validator from 'validator'
import { normalizePhone } from '@/lib/phone'
import PhoneInput from '@/components/PhoneInput'
import type { GuestInfo } from '@/models/user'
import LoadingSpinner from '@/components/LoadingSpinner'

interface GuestUserFormProps {
  onSubmit: (info: GuestInfo) => Promise<void> | void
  submitLabel?: string
}

/** Guest info capture: first/last/phone required, email optional. Shared by the auth
 *  panel and the admin user pickers. */
export default function GuestUserForm({ onSubmit, submitLabel = 'Continue as Guest' }: GuestUserFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: { [key: string]: string } = {}
    if (!firstName.trim()) next.firstName = 'First name is required'
    if (!lastName.trim()) next.lastName = 'Last name is required'
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) next.phone = 'Enter a valid 10-digit phone number'
    if (email.trim() && !validator.isEmail(email.trim())) next.email = 'Enter a valid email'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setIsLoading(true)
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: normalizedPhone!,
        email: email.trim() || undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} isRequired
        autoComplete="given-name" variant="bordered" className="text-base"
        errorMessage={errors.firstName} isInvalid={!!errors.firstName} />
      <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} isRequired
        autoComplete="family-name" variant="bordered" className="text-base"
        errorMessage={errors.lastName} isInvalid={!!errors.lastName} />
      <PhoneInput value={phone} onChange={setPhone} isRequired
        errorMessage={errors.phone} isInvalid={!!errors.phone} />
      <Input type="email" inputMode="email" autoComplete="email" label="Email (optional)"
        description="Add an email to get your confirmation and reminders"
        value={email} onChange={(e) => setEmail(e.target.value)}
        variant="bordered" className="text-base" errorMessage={errors.email} isInvalid={!!errors.email} />
      <Button type="submit" color="default"
        className="w-full min-h-11 touch-manipulation bg-[var(--color-foreground)] text-[var(--color-background)]"
        disabled={isLoading}>
        {isLoading ? <LoadingSpinner size="xs" label={null} /> : submitLabel}
      </Button>
    </form>
  )
}
