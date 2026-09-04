// Bridges pointer/pulse state into CSS custom properties so DOM elements can react.

import { useEffect, type RefObject } from 'react'
import type { PointerState } from './usePointerState'

const PULSE_DECAY = 0.94

export function useReactiveCssVars(pointerRef: RefObject<PointerState>) {
  useEffect(() => {
    const root = document.documentElement
    let rafId = 0
    let pulseIntensity = 0
    let lastPulseCount = pointerRef.current.pulseCount

    const tick = () => {
      const pointer = pointerRef.current

      // Bump to full on each new click, then ease back down.
      if (pointer.pulseCount !== lastPulseCount) {
        pulseIntensity = 1
        lastPulseCount = pointer.pulseCount
      }
      pulseIntensity *= PULSE_DECAY

      // Fall back to center before the first pointer move.
      const x = pointer.x < 0 ? 0.5 : pointer.x
      const y = pointer.y < 0 ? 0.5 : pointer.y

      root.style.setProperty('--pointer-x', x.toFixed(4))
      root.style.setProperty('--pointer-y', (1 - y).toFixed(4))
      root.style.setProperty('--pulse', pulseIntensity.toFixed(4))
      root.style.setProperty('--hue', (185 + x * 35).toFixed(1))

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [pointerRef])
}
