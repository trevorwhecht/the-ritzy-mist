'use client'

import React from 'react'
import { Input } from '@heroui/react'
import { formatPhoneDisplay, toPhoneDigits } from '@/lib/phone'

interface PhoneInputProps {
  /** Raw digits, max 10 — never the formatted string. */
  value: string
  /** Receives raw digits, so callers never parse the display format. */
  onChange: (digits: string) => void
  label?: string
  description?: string
  errorMessage?: string
  isInvalid?: boolean
  isRequired?: boolean
  isDisabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * US phone field: fixed +1, digits only, hard-capped at 10, displayed as
 * (619) 886-0235 while typing. The single phone input for the whole app —
 * the value it emits is exactly what the API and Prisma expect.
 */
export default function PhoneInput({
  value,
  onChange,
  label = 'Phone Number',
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  className = 'text-base text-[var(--color-foreground)]',
  size,
}: PhoneInputProps) {
  return (
    <Input
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      label={label}
      description={description}
      // Typing, pasting and autofill all funnel through the same normalizer,
      // so the field can never hold anything but <=10 US digits.
      value={formatPhoneDisplay(value)}
      onChange={(e) => onChange(toPhoneDigits(e.target.value))}
      placeholder="(555) 123-4567"
      startContent={<span className="text-sm text-[var(--color-muted)]">+1</span>}
      variant="bordered"
      className={className}
      errorMessage={errorMessage}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      size={size}
    />
  )
}
