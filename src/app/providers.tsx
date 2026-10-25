'use client'
import { HeroUIProvider } from '@heroui/react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { ConfirmProvider } from '@/contexts/ConfirmContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <AuthModalProvider>
          <ConfirmProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-center"
              toastOptions={{
                style: {
                  background: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-border)',
                },
              }}
            />
          </ConfirmProvider>
        </AuthModalProvider>
      </HeroUIProvider>
    </SessionProvider>
  )
}
