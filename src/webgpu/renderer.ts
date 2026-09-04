// Renderer: owns the render pipeline, RAF loop, resize and disposal.

import shaderSource from './shaders/fluidField.wgsl?raw'
import { initWebGPU, type GpuContext } from './context'

// Cap device-pixel-ratio so high-DPI displays don't render an oversized target.
const MAX_PIXEL_RATIO = 2

export class Renderer {
  private readonly canvas: HTMLCanvasElement
  private gpu: GpuContext | null = null
  private pipeline: GPURenderPipeline | null = null
  private resizeObserver: ResizeObserver | null = null
  private rafId = 0
  private disposed = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init(): Promise<void> {
    const gpu = await initWebGPU(this.canvas)
    if (this.disposed) {
      gpu.device.destroy()
      return
    }
    this.gpu = gpu

    const module = gpu.device.createShaderModule({ code: shaderSource })
    this.pipeline = gpu.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs_main' },
      fragment: { module, entryPoint: 'fs_main', targets: [{ format: gpu.format }] },
      primitive: { topology: 'triangle-list' },
    })

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.canvas)
    this.resize()

    this.rafId = requestAnimationFrame(this.loop)
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr))
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  private readonly loop = (): void => {
    this.frame()
    this.rafId = requestAnimationFrame(this.loop)
  }

  private frame(): void {
    if (!this.gpu || !this.pipeline) return
    const { device, context } = this.gpu

    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })
    pass.setPipeline(this.pipeline)
    pass.draw(3)
    pass.end()

    device.queue.submit([encoder.finish()])
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.resizeObserver?.disconnect()
    this.gpu?.device.destroy()
    this.gpu = null
    this.pipeline = null
  }
}
