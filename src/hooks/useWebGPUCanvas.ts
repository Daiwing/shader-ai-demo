// Mounts the Renderer to a canvas and exposes its lifecycle status for the UI.

import { useEffect, useRef, useState } from 'react'
import { Renderer } from '../webgpu/renderer'
import { WebGPUUnsupportedError } from '../webgpu/context'

export type CanvasStatus = 'initializing' | 'running' | 'unsupported' | 'error'

export function useWebGPUCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<CanvasStatus>('initializing')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new Renderer(canvas)
    let active = true

    renderer
      .init()
      .then(() => {
        if (active) setStatus('running')
      })
      .catch((error: unknown) => {
        if (!active) return
        setStatus(error instanceof WebGPUUnsupportedError ? 'unsupported' : 'error')
        console.error(error)
      })

    return () => {
      active = false
      renderer.dispose()
    }
  }, [])

  return { canvasRef, status }
}
