import { useEffect, useRef } from 'react'

/**
 * Hook to prevent scroll when keyboard dismisses on mobile devices
 * This fixes the glitchy auto-scroll-to-top behavior when dismissing keyboard in modals
 */
export function usePreventKeyboardScroll(isOpen: boolean) {
  const scrollPositionsRef = useRef<{
    window: { x: number; y: number }
    elements: Map<HTMLElement, number>
  }>({
    window: { x: 0, y: 0 },
    elements: new Map()
  })
  const isPreventingScrollRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeInputRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      isPreventingScrollRef.current = false
      activeInputRef.current = null
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Only apply on mobile devices
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isMobile) return

    const handleInputFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      
      // Only handle inputs, textareas, and contenteditable elements
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        activeInputRef.current = target
        
        // Store current scroll positions when input is focused
        scrollPositionsRef.current.window = {
          x: window.scrollX || document.documentElement.scrollLeft,
          y: window.scrollY || document.documentElement.scrollTop
        }

        // Store scroll position of all scrollable parent containers
        scrollPositionsRef.current.elements.clear()
        let parent = target.parentElement
        while (parent) {
          const overflowY = window.getComputedStyle(parent).overflowY
          if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
            scrollPositionsRef.current.elements.set(parent, parent.scrollTop)
          }
          parent = parent.parentElement
        }
      }
    }

    const handleInputBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      
      // Only handle if this was the active input
      if (target !== activeInputRef.current) return
      
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Prevent scroll for a short period after blur
        isPreventingScrollRef.current = true

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Restore scroll positions after keyboard dismisses
        timeoutRef.current = setTimeout(() => {
          // Restore window scroll
          window.scrollTo({
            left: scrollPositionsRef.current.window.x,
            top: scrollPositionsRef.current.window.y,
            behavior: 'instant' as ScrollBehavior
          })

          // Restore scrollable parent containers
          scrollPositionsRef.current.elements.forEach((scrollTop, element) => {
            element.scrollTop = scrollTop
          })

          isPreventingScrollRef.current = false
          activeInputRef.current = null
          timeoutRef.current = null
        }, 150) // Delay to allow keyboard to fully dismiss
      }
    }

    const handleScroll = () => {
      if (isPreventingScrollRef.current) {
        // Restore window scroll position immediately
        window.scrollTo({
          left: scrollPositionsRef.current.window.x,
          top: scrollPositionsRef.current.window.y,
          behavior: 'instant' as ScrollBehavior
        })

        // Restore scrollable parent containers
        scrollPositionsRef.current.elements.forEach((scrollTop, element) => {
          element.scrollTop = scrollTop
        })
      }
    }

    // Listen for focus and blur events on inputs
    document.addEventListener('focusin', handleInputFocus, true)
    document.addEventListener('focusout', handleInputBlur, true)
    
    // Listen for scroll events to restore position
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    
    // Also listen for scroll events on document
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    return () => {
      document.removeEventListener('focusin', handleInputFocus, true)
      document.removeEventListener('focusout', handleInputBlur, true)
      window.removeEventListener('scroll', handleScroll, { capture: true })
      document.removeEventListener('scroll', handleScroll, { capture: true })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen])
}

