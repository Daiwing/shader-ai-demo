// Uniform buffer layout matching the WGSL `Uniforms` struct, plus a write helper.
//
// WGSL uniform layout (std140-style, byte offsets):
//   resolution      vec2f   @ 0
//   time            f32     @ 8
//   _pad0           f32     @ 12   (aligns the following vec2f to 16)
//   pointer         vec2f   @ 16
//   pointerVelocity vec2f   @ 24
//   pulses          vec4f×8 @ 32   (each pulse: xy = position, z = start time, w = strength)

export const PULSE_COUNT = 8

const FLOAT32_BYTES = 4
export const UNIFORM_FLOAT_COUNT = 8 + PULSE_COUNT * 4
export const UNIFORM_BUFFER_SIZE = UNIFORM_FLOAT_COUNT * FLOAT32_BYTES

export interface UniformState {
  width: number
  height: number
  time: number
  pointerX: number
  pointerY: number
  pointerVelocityX: number
  pointerVelocityY: number
}

export class Uniforms {
  readonly buffer: GPUBuffer
  private readonly data = new Float32Array(UNIFORM_FLOAT_COUNT)

  constructor(device: GPUDevice) {
    this.buffer = device.createBuffer({
      size: UNIFORM_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  write(device: GPUDevice, state: UniformState): void {
    const d = this.data
    d[0] = state.width
    d[1] = state.height
    d[2] = state.time
    // d[3] is padding.
    d[4] = state.pointerX
    d[5] = state.pointerY
    d[6] = state.pointerVelocityX
    d[7] = state.pointerVelocityY
    // Pulse slots (indices 8+) stay zeroed until Phase 4 populates them.
    device.queue.writeBuffer(this.buffer, 0, d)
  }
}
