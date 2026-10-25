'use client'
import React, { useState } from 'react'
import { Button, Input, Link } from '@heroui/react'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import validator from 'validator'
import { toast } from 'sonner'
import PhoneInput from '@/components/PhoneInput'
import AccountMenuGoogleButton from './accountMenu-GoogleButton'
import LoadingSpinner from '@/components/LoadingSpinner'

interface SignUpProps {
  setViewState: (state: 'signin' | 'signup') => void
  /** Called after successful registration + sign-in; use to close the panel instead of showing the account menu. */
  onSuccess?: () => void
}

export default function SignUp({ setViewState, onSuccess }: SignUpProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!/^[a-zA-Z]+$/.test(firstName)) newErrors.firstName = 'First name can only contain letters'
    if (!/^[a-zA-Z]+$/.test(lastName)) newErrors.lastName = 'Last name can only contain letters'
    if (!/^\d{10}$/.test(phone)) newErrors.phone = 'Phone number must be 10 digits'
    if (!validator.isEmail(email)) newErrors.email = 'Invalid email address'
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}) as { error?: string; message?: string })
        // 409s (phone/email already on a real account) put the actionable text in `error`
        throw new Error(errorData.error || errorData.message || 'Failed to create account')
      }

      // Automatically sign in the user after successful registration
      const signInResult = await signIn('credentials', { email, password, redirect: false })
      if (signInResult?.error) throw new Error('Account created but failed to sign in automatically')

      toast.success('You have successfully created an account!', { position: 'bottom-center' })

      if (onSuccess) onSuccess()
      // No onSuccess: the new session makes the parent derive the account view on its own.
    } catch (error) {
      console.error('Error during sign-up:', error)
      setErrors({
        ...errors,
        general: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'firstName' | 'lastName') => {
    const value = e.target.value.replace(/[^a-zA-Z]/g, '')
    if (field === 'firstName') setFirstName(value)
    else setLastName(value)
  }

  const passwordToggle = (shown: boolean, toggle: () => void, label: string) => (
    <Button
      isIconOnly
      variant="light"
      aria-label={`${shown ? 'Hide' : 'Show'} ${label}`}
      className="min-h-11 touch-manipulation text-[var(--color-foreground)]"
      onPress={toggle}
    >
      {shown ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
    </Button>
  )

  return (
    <>
      <h2 className="text-xl font-bold text-[var(--color-foreground)] font-[AlegreyaSansSC]">Create Account</h2>
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Input
            type="text"
            label="First Name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => handleNameChange(e, 'firstName')}
            required
            className="text-base flex-1"
            errorMessage={errors.firstName}
            isInvalid={!!errors.firstName}
            variant="bordered"
          />
          <Input
            type="text"
            label="Last Name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => handleNameChange(e, 'lastName')}
            required
            className="text-base flex-1"
            errorMessage={errors.lastName}
            isInvalid={!!errors.lastName}
            variant="bordered"
          />
        </div>
        <PhoneInput value={phone} onChange={setPhone} isRequired errorMessage={errors.phone} isInvalid={!!errors.phone} />
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-base"
          errorMessage={errors.email}
          isInvalid={!!errors.email}
          variant="bordered"
        />
        <Input
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="text-base"
          errorMessage={errors.password}
          isInvalid={!!errors.password}
          variant="bordered"
          endContent={passwordToggle(showPassword, () => setShowPassword(!showPassword), 'password')}
        />
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="text-base"
          errorMessage={errors.confirmPassword}
          isInvalid={!!errors.confirmPassword}
          variant="bordered"
          endContent={passwordToggle(
            showConfirmPassword,
            () => setShowConfirmPassword(!showConfirmPassword),
            'password confirmation'
          )}
        />
        {errors.general && <p className="text-sm text-[var(--color-danger)]">{errors.general}</p>}
        <Button
          type="submit"
          color="default"
          className="w-full min-h-11 touch-manipulation bg-[var(--color-foreground)] text-[var(--color-background)]"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="xs" label={null} />
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
        <AccountMenuGoogleButton />
        <div className="w-full flex justify-center mt-2">
          <Link
            href="#"
            className="text-[var(--color-foreground)] text-xs underline min-h-11 flex items-center touch-manipulation"
            onPress={() => setViewState('signin')}
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </>
  )
}
