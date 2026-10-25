'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { GuestInfo } from '@/models/user';

/** Passed to `openAuthModal` to choose the entry view and offer guest checkout. */
export type AuthModalOpenOptions = {
  initialView?: 'signin' | 'signup';
  /** When set, the sign-in view offers "Continue as Guest"; info is handed back here. */
  guestCheckout?: { onContinue: (info: GuestInfo) => void };
};

export const AUTH_MODAL_OPEN_DEFAULT = Symbol('authModalOpenDefault');

export type AuthModalPendingOpen = AuthModalOpenOptions | typeof AUTH_MODAL_OPEN_DEFAULT | null;

interface AuthModalContextType {
  isAuthModalOpen: boolean;
  /** Pass options to open on Create Account or with guest checkout; omit for normal sign-in entry. */
  openAuthModal: (options?: AuthModalOpenOptions) => void;
  takePendingAuthOpen: () => AuthModalPendingOpen;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Held in a ref so opening the panel does not re-render every consumer of the options.
  const pendingOpenRef = useRef<AuthModalPendingOpen>(null);

  const openAuthModal = useCallback((options?: AuthModalOpenOptions) => {
    pendingOpenRef.current = options === undefined ? AUTH_MODAL_OPEN_DEFAULT : options;
    setIsAuthModalOpen(true);
  }, []);

  const takePendingAuthOpen = useCallback((): AuthModalPendingOpen => {
    const next = pendingOpenRef.current;
    pendingOpenRef.current = null;
    return next;
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingOpenRef.current = null;
  }, []);

  return (
    <AuthModalContext.Provider value={{ isAuthModalOpen, openAuthModal, takePendingAuthOpen, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
