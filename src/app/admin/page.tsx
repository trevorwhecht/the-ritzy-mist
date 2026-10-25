'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError('Invalid email or password')
      console.error(err)
    }
  }

  const fieldClass =
    'w-full min-h-11 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-base text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none'

  return (
    <div className="flex items-center justify-center min-h-dvh bg-[var(--color-background)] px-4 font-[AlegreyaSansSC]">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-8 pt-6 pb-8"
        >
          <h1 className="text-2xl font-bold mb-6 text-[var(--color-foreground)] text-center">Admin Login</h1>
          {error && <p className="text-[var(--color-danger)] text-sm mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block text-[var(--color-foreground)] text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className={fieldClass}
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-[var(--color-foreground)] text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className={fieldClass}
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full min-h-11 touch-manipulation rounded bg-[var(--color-primary)] text-[var(--color-background)] font-bold px-4 hover:bg-[var(--color-primary-hover)] transition-colors duration-200 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
