import { gsap } from 'gsap'

interface HorizontalLoopConfig {
  repeat?: number
  paused?: boolean
  speed?: number
  snap?: number | false
  paddingRight?: number
  reversed?: boolean
}

interface HorizontalLoopTimeline extends gsap.core.Timeline {
  next: (vars?: gsap.TweenVars) => gsap.core.Tween
  previous: (vars?: gsap.TweenVars) => gsap.core.Tween
  toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween
  current: () => number
  times: number[]
}

/**
 * This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.
 */
export function horizontalLoop(
  items: Element[] | NodeListOf<Element> | string,
  config?: HorizontalLoopConfig
): HorizontalLoopTimeline {
  const elements = gsap.utils.toArray(items) as Element[]
  const cfg = config || {}

  let curIndex = 0
  const times: number[] = []
  const widths: number[] = []
  const xPercents: number[] = []

  const tl = gsap.timeline({
    repeat: cfg.repeat,
    paused: cfg.paused,
    defaults: { ease: 'none' },
    onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
  })

  const length = elements.length
  const startX = (elements[0] as HTMLElement).offsetLeft
  const pixelsPerSecond = (cfg.speed || 1) * 100
  const snap =
    cfg.snap === false
      ? (v: number) => v
      : gsap.utils.snap(cfg.snap || 1)

  // Convert "x" to "xPercent" to make things responsive
  gsap.set(elements, {
    xPercent: (i, el) => {
      const w = (widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px') as string))
      xPercents[i] = snap(
        parseFloat(gsap.getProperty(el, 'x', 'px') as string) / w * 100 +
          (gsap.getProperty(el, 'xPercent') as number)
      )
      return xPercents[i]
    },
  })

  gsap.set(elements, { x: 0 })

  const lastElement = elements[length - 1] as HTMLElement
  const totalWidth =
    lastElement.offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    lastElement.offsetWidth * (gsap.getProperty(lastElement, 'scaleX') as number) +
    (parseFloat(cfg.paddingRight as unknown as string) || 0)

  for (let i = 0; i < length; i++) {
    const item = elements[i] as HTMLElement
    const curX = (xPercents[i] / 100) * widths[i]
    const distanceToStart = item.offsetLeft + curX - startX
    const distanceToLoop = distanceToStart + widths[i] * (gsap.getProperty(item, 'scaleX') as number)

    tl.to(
      item,
      {
        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    )
      .fromTo(
        item,
        {
          xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100),
        },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
      .add(`label${i}`, distanceToStart / pixelsPerSecond)

    times[i] = distanceToStart / pixelsPerSecond
  }

  function toIndex(index: number, vars?: gsap.TweenVars): gsap.core.Tween {
    vars = vars || {}

    // Always go in the shortest direction
    if (Math.abs(index - curIndex) > length / 2) {
      index += index > curIndex ? -length : length
    }

    const newIndex = gsap.utils.wrap(0, length, index)
    let time = times[newIndex]

    // If we're wrapping the timeline's playhead, make the proper adjustments
    if ((time > tl.time()) !== (index > curIndex)) {
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) }
      time += tl.duration() * (index > curIndex ? 1 : -1)
    }

    curIndex = newIndex
    vars.overwrite = true
    return tl.tweenTo(time, vars)
  }

  // Add helper methods to timeline
  ;(tl as HorizontalLoopTimeline).next = (vars?: gsap.TweenVars) => toIndex(curIndex + 1, vars)
  ;(tl as HorizontalLoopTimeline).previous = (vars?: gsap.TweenVars) => toIndex(curIndex - 1, vars)
  ;(tl as HorizontalLoopTimeline).current = () => curIndex
  ;(tl as HorizontalLoopTimeline).toIndex = (index: number, vars?: gsap.TweenVars) => toIndex(index, vars)
  ;(tl as HorizontalLoopTimeline).times = times

  // Pre-render for performance
  tl.progress(1, true).progress(0, true)

  if (cfg.reversed) {
    tl.vars.onReverseComplete?.()
    tl.reverse()
  }

  return tl as HorizontalLoopTimeline
}

