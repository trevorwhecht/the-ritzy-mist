'use client'

import React from 'react'

export type LoadingSpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<LoadingSpinnerSize, { ring: string; text: string; gap: string }> = {
  xs: { ring: 'w-4 h-4 border-2', text: 'text-sm', gap: 'gap-2' },
  sm: { ring: 'w-6 h-6 border-2', text: 'text-lg', gap: 'gap-2' },
  md: { ring: 'w-8 h-8 border-[3px]', text: 'text-xl', gap: 'gap-3' },
  lg: { ring: 'w-12 h-12 border-4', text: 'text-2xl', gap: 'gap-4' },
  xl: { ring: 'w-16 h-16 border-4', text: 'text-3xl', gap: 'gap-4' },
}

interface LoadingSpinnerProps {
  /** Caption beside the ring. Pass null for a bare ring (inside buttons, or next to your own text). */
  label?: string | null
  size?: LoadingSpinnerSize
  className?: string
}

/**
 * The one spinner. Every loading state in the app renders this — do not hand-roll
 * a ring, and do not import HeroUI's <Spinner>. The ring and caption inherit the
 * parent's text color, so it works on any surface without props.
 */
export default function LoadingSpinner({
  label = 'LOADING',
  size = 'lg',
  className = '',
}: LoadingSpinnerProps) {
  const s = SIZES[size]

  return (
    <div
      role="status"
      aria-label={label ?? 'Loading'}
      className={`inline-flex items-center justify-center ${s.gap} ${className}`}
    >
      <div
        className={`${s.ring} border-current border-t-transparent rounded-full animate-spin motion-reduce:animate-none shrink-0`}
      />
      {label ? <span className={`font-[AlegreyaSansSC] ${s.text} leading-none`}>{label}</span> : null}
    </div>
  )
}
