// Renderer: owns the render pipeline, RAF loop, resize and disposal.

import shaderSource from './shaders/fluidField.wgsl?raw'
import { initWebGPU, type GpuContext } from './context'
import { Uniforms } from './uniforms'

// Cap device-pixel-ratio so high-DPI displays don't render an oversized target.
const MAX_PIXEL_RATIO = 2

export class Renderer {
  private readonly canvas: HTMLCanvasElement
  private gpu: GpuContext | null = null
  private pipeline: GPURenderPipeline | null = null
  private uniforms: Uniforms | null = null
  private bindGroup: GPUBindGroup | null = null
  private resizeObserver: ResizeObserver | null = null
  private rafId = 0
  private startTime = 0
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

    this.uniforms = new Uniforms(gpu.device)
    this.bindGroup = gpu.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniforms.buffer } }],
    })

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.canvas)
    this.resize()

    this.startTime = performance.now()
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

  private readonly loop = (now: number): void => {
    this.frame((now - this.startTime) / 1000)
    this.rafId = requestAnimationFrame(this.loop)
  }

  private frame(time: number): void {
    if (!this.gpu || !this.pipeline || !this.uniforms || !this.bindGroup) return
    const { device, context } = this.gpu

    this.uniforms.write(device, {
      width: this.canvas.width,
      height: this.canvas.height,
      time,
      pointerX: 0,
      pointerY: 0,
      pointerVelocityX: 0,
      pointerVelocityY: 0,
    })

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
    pass.setBindGroup(0, this.bindGroup)
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
    this.uniforms = null
    this.bindGroup = null
  }
}
