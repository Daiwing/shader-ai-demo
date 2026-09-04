// Tracks pointer position/velocity and a fixed-size ring buffer of click pulses.

import { useEffect, useRef, type RefObject } from 'react'
import { PULSE_COUNT } from '../webgpu/uniforms'

const PULSE_STRIDE = 4
const VELOCITY_DECAY = 0.85
// Parked off-screen until the first move so the field isn't warped at startup.
const OFFSCREEN = -1

export class PointerState {
  x = OFFSCREEN
  y = OFFSCREEN
  velocityX = 0
  velocityY = 0
  // Flat vec4 ring buffer (x, y, startTime, strength) consumed directly by the shader.
  readonly pulses = new Float32Array(PULSE_COUNT * PULSE_STRIDE)

  private time = 0
  private lastX = OFFSCREEN
  private lastY = OFFSCREEN
  private hasSample = false
  private nextPulse = 0

  // Called once per frame by the renderer to advance the clock and bleed off velocity.
  update(time: number): void {
    this.time = time
    this.velocityX *= VELOCITY_DECAY
    this.velocityY *= VELOCITY_DECAY
  }

  moveTo(x: number, y: number): void {
    if (this.hasSample) {
      this.velocityX = x - this.lastX
      this.velocityY = y - this.lastY
    }
    this.x = x
    this.y = y
    this.lastX = x
    this.lastY = y
    this.hasSample = true
  }

  addPulse(x: number, y: number): void {
    const base = this.nextPulse * PULSE_STRIDE
    this.pulses[base] = x
    this.pulses[base + 1] = y
    this.pulses[base + 2] = this.time
    this.pulses[base + 3] = 1
    this.nextPulse = (this.nextPulse + 1) % PULSE_COUNT
  }
}

export function usePointerState(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef(new PointerState())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const state = stateRef.current

    // Convert client coordinates into shader UV space (origin bottom-left, 0..1).
    const toUv = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      }
    }

    const onMove = (event: PointerEvent) => {
      const { x, y } = toUv(event)
      state.moveTo(x, y)
    }
    const onDown = (event: PointerEvent) => {
      const { x, y } = toUv(event)
      state.moveTo(x, y)
      state.addPulse(x, y)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [canvasRef])

  return stateRef
}
