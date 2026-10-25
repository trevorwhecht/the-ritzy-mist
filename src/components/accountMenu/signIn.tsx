'use client'
import React, { useState } from 'react'
import { Button, Input, Link } from '@heroui/react'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useAuthModal } from '@/contexts/AuthModalContext'
import AccountMenuGoogleButton from './accountMenu-GoogleButton'
import LoadingSpinner from '@/components/LoadingSpinner'

interface SignInProps {
  setViewState: (state: 'signin' | 'signup') => void
  /** When provided, a "Continue as Guest" button is offered at the top right. */
  onContinueAsGuest?: () => void
}

export default function SignIn({ setViewState, onContinueAsGuest }: SignInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const { closeAuthModal } = useAuthModal()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setErrors({ general: 'Failed to sign in. Please check your credentials.' })
      } else if (result?.ok) {
        closeAuthModal()
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Failed to sign in. Please check your credentials.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-foreground)] font-[AlegreyaSansSC]">Sign In</h2>
        {onContinueAsGuest && (
          <Button
            size="sm"
            variant="bordered"
            className="min-h-11 touch-manipulation text-[var(--color-foreground)] border-[var(--color-border)]"
            onPress={onContinueAsGuest}
          >
            Continue as Guest
          </Button>
        )}
      </div>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="text-base"
          errorMessage={errors.password}
          isInvalid={!!errors.password}
          variant="bordered"
          endContent={
            <Button
              isIconOnly
              variant="light"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="min-h-11 touch-manipulation text-[var(--color-foreground)]"
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
            </Button>
          }
        />
        {errors.general && <p className="text-sm text-[var(--color-danger)]">{errors.general}</p>}
        <Button
          type="submit"
          color="default"
          className="w-full min-h-11 touch-manipulation bg-[var(--color-foreground)] text-[var(--color-background)]"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="xs" label={null} /> : 'Sign In'}
        </Button>
        <AccountMenuGoogleButton />
        <div className="w-full flex justify-between items-center mt-2">
          <Link
            href="#"
            className="text-[var(--color-foreground)] text-xs underline min-h-11 flex items-center touch-manipulation"
            onPress={() => setViewState('signup')}
          >
            Create Account
          </Link>
        </div>
      </form>
    </>
  )
}
