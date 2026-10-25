'use client'

import React, { useState, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import SignIn from './signIn'
import SignUp from './signUp'
import LoggedIn from './loggedIn'
import AccountMenuPhonePrompt from './accountMenu-PhonePrompt'
import { useAuthModal, AUTH_MODAL_OPEN_DEFAULT } from '@/contexts/AuthModalContext'
import type { AuthModalOpenOptions } from '@/contexts/AuthModalContext'
import { usePreventKeyboardScroll } from '@/hooks/usePreventKeyboardScroll'
import GuestUserForm from '@/components/GuestUserForm'

/** Views available while signed out. 'account' is derived from the session, never stored. */
export type AuthView = 'signin' | 'signup' | 'guest'
type ViewState = AuthView | 'account'

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountMenu({ isOpen, onClose }: AccountMenuProps) {
  const { data: session } = useSession()
  const { takePendingAuthOpen } = useAuthModal()
  const [authView, setAuthView] = useState<AuthView>('signin')
  const [guestCheckout, setGuestCheckout] = useState<AuthModalOpenOptions['guestCheckout'] | null>(null)

  // Derived, not stored. Holding 'account' in state meant an effect had to copy the session
  // into it, which renders once with the stale view before correcting itself.
  const viewState: ViewState = session ? 'account' : authView

  // Prevent scroll when the keyboard dismisses on mobile
  usePreventKeyboardScroll(isOpen)

  // Consumes a one-shot request staged in the context's ref by whoever opened the panel.
  // That ref is an external store, not derivable during render, so the read has to happen in
  // an effect; it is a layout effect so the correct view paints on the first frame.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (!isOpen || session) return
    const pending = takePendingAuthOpen()
    if (pending === null) return
    if (pending === AUTH_MODAL_OPEN_DEFAULT) {
      setGuestCheckout(null)
      setAuthView('signin')
      return
    }
    setGuestCheckout(pending.guestCheckout ?? null)
    if (pending.initialView === 'signup') setAuthView('signup')
  }, [isOpen, session, takePendingAuthOpen])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClose = () => {
    onClose()
    setGuestCheckout(null)
    setAuthView('signin')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 top-16 w-full sm:w-[400px] bg-[var(--color-background)] sm:border-t border-[var(--color-border)] z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex flex-col gap-6">
              {viewState === 'account' && session ? (
                <>
                  {session.user?.needsPhone && <AccountMenuPhonePrompt />}
                  <LoggedIn onClose={handleClose} />
                </>
              ) : viewState === 'signup' ? (
                <SignUp
                  setViewState={setAuthView}
                  onSuccess={handleClose}
                />
              ) : viewState === 'guest' && guestCheckout ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--color-foreground)] font-[AlegreyaSansSC]">
                      Continue as Guest
                    </h2>
                    <button
                      className="min-h-11 touch-manipulation text-[var(--color-foreground)] text-xs underline focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none rounded"
                      onClick={() => setAuthView('signin')}
                    >
                      Back to Sign In
                    </button>
                  </div>
                  <p className="text-[var(--color-muted)] text-sm">
                    No password needed — we just need a way to identify your appointment.
                  </p>
                  <GuestUserForm
                    onSubmit={(info) => {
                      guestCheckout.onContinue(info)
                      handleClose()
                    }}
                  />
                </>
              ) : (
                <SignIn
                  setViewState={setAuthView}
                  onContinueAsGuest={guestCheckout ? () => setAuthView('guest') : undefined}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
