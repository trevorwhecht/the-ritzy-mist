'use client'

import React, { useEffect, useRef, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'
import { horizontalLoop } from '@/lib/horizontalLoop'

const DESKTOP_QUERY = '(min-width: 768px)'
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(DESKTOP_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

// Endless display-only carousel, same loop setup as onewitharts PrintPortfolio.
export default function LoopCarousel({ children, itemClassName }: { children: React.ReactNode[]; itemClassName?: string }) {
  const railRef = useRef<HTMLDivElement>(null)
  // null on the server and during hydration, so the rail stays hidden until mounted.
  const isDesktop = useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches, () => null)
  const mounted = isDesktop !== null
  const count = children.length

  // Rebuilt when the breakpoint flips, because item widths change there.
  useEffect(() => {
    if (!mounted || count === 0) return
    let tl: gsap.core.Timeline | null = null
    let frame = 0
    let tries = 0
    const items = railRef.current?.querySelectorAll('.carousel-item')
    const init = () => {
      const first = items?.[0] as HTMLElement | undefined
      if (!items || !first?.offsetWidth) {
        if (++tries < 20) frame = requestAnimationFrame(init)
        return
      }
      tl = horizontalLoop(items, { repeat: -1, speed: 0.75, paddingRight: 0, paused: false })
    }
    frame = requestAnimationFrame(init)
    return () => {
      cancelAnimationFrame(frame)
      tl?.kill()
      if (items?.length) gsap.set(items, { clearProps: 'transform' })
    }
  }, [mounted, isDesktop, count])

  return (
    <div
      className="w-full overflow-hidden"
      style={{ pointerEvents: 'none', visibility: mounted ? 'visible' : 'hidden' }}
    >
      <div ref={railRef} className="rail flex">
        {/* Rendered twice so the loop never shows a gap at the seam */}
        {[...children, ...children].map((child, i) => (
          <div key={i} className={`carousel-item flex-shrink-0 ${itemClassName ?? ''}`} aria-hidden={i >= count || undefined}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
