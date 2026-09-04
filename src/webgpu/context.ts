// WebGPU adapter/device/context initialization and capability detection.

export interface GpuContext {
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
}

// Thrown when the browser/hardware cannot provide WebGPU, so callers can show a fallback.
export class WebGPUUnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebGPUUnsupportedError'
  }
}

export async function initWebGPU(canvas: HTMLCanvasElement): Promise<GpuContext> {
  if (!navigator.gpu) {
    throw new WebGPUUnsupportedError('WebGPU is not available in this browser.')
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new WebGPUUnsupportedError('No suitable GPU adapter was found.')
  }

  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu')
  if (!context) {
    throw new WebGPUUnsupportedError('Could not acquire a WebGPU canvas context.')
  }

  // Match the swap-chain format to the platform's preferred format for correct colors.
  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({ device, format, alphaMode: 'premultiplied' })

  return { device, context, format }
}
