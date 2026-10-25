'use client'

import React, { useEffect, useRef, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'
import { horizontalLoop } from '@/lib/horizontalLoop'
import { repeatToMin } from '@/lib/repeatToMin'

const DESKTOP_QUERY = '(min-width: 768px)'
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(DESKTOP_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

// Endless display-only carousel, same loop setup as onewitharts PrintPortfolio.
export default function LoopCarousel({
  children,
  itemClassName,
  speed = 0.75,
}: {
  children: React.ReactNode[]
  itemClassName?: string
  speed?: number
}) {
  const railRef = useRef<HTMLDivElement>(null)
  // null on the server and during hydration, so the rail stays hidden until mounted.
  const isDesktop = useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches, () => null)
  const mounted = isDesktop !== null
  const count = children.length
  const base = repeatToMin(children, 4)

  // Rebuilt when the breakpoint flips or the window width changes, because item widths change with it.
  useEffect(() => {
    if (!mounted || count === 0) return
    let tl: gsap.core.Timeline | null = null
    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let tries = 0
    let builtWidth = window.innerWidth
    const items = railRef.current?.querySelectorAll('.carousel-item')
    const init = () => {
      const first = items?.[0] as HTMLElement | undefined
      if (!items || !first?.offsetWidth) {
        if (++tries < 20) frame = requestAnimationFrame(init)
        return
      }
      tl = horizontalLoop(items, { repeat: -1, speed, paddingRight: 0, paused: false })
    }
    const teardown = () => {
      cancelAnimationFrame(frame)
      tl?.kill()
      tl = null
      if (items?.length) gsap.set(items, { clearProps: 'transform' })
    }
    // Height-only resizes (mobile URL bar) are ignored so the animation does not restart.
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (window.innerWidth === builtWidth) return
        builtWidth = window.innerWidth
        teardown()
        tries = 0
        frame = requestAnimationFrame(init)
      }, 200)
    }
    frame = requestAnimationFrame(init)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
      teardown()
    }
  }, [mounted, isDesktop, count, speed])

  return (
    <div
      className="w-full overflow-hidden"
      style={{ pointerEvents: 'none', visibility: mounted ? 'visible' : 'hidden' }}
    >
      <div ref={railRef} className="rail flex">
        {/* Short lists are repeated to 4, then rendered twice so the loop never shows a gap at the seam */}
        {[...base, ...base].map((child, i) => (
          <div key={i} className={`carousel-item flex-shrink-0 ${itemClassName ?? ''}`} aria-hidden={i >= count || undefined}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
