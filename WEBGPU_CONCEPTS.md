# WebGPU concepts in this project

A guided tour of the WebGPU concepts used by `shaded`, each with a short explanation and a
pointer to where it lives in the code. Read top-to-bottom: it follows the path a frame takes,
from device setup to pixels on screen.

If you want the single best file to read first, start with
[`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) — it ties every concept together.

---

## 1. Adapter and device

WebGPU is accessed through `navigator.gpu`. You request an **adapter** (a handle to a physical
GPU) and then a **device** (the logical connection you issue commands to). Both requests are
async and can fail — which is how we detect unsupported browsers.

- Where: [`src/webgpu/context.ts`](src/webgpu/context.ts) → `initWebGPU()`
- Note: failures throw `WebGPUUnsupportedError`, which the UI turns into a fallback.

## 2. Canvas context configuration

To draw to a canvas you get a `'webgpu'` context and `configure()` it with the device and a
texture **format**. `navigator.gpu.getPreferredCanvasFormat()` returns the format the platform
renders most efficiently, avoiding an extra color conversion.

- Where: [`src/webgpu/context.ts`](src/webgpu/context.ts) → `initWebGPU()` (`context.configure(...)`)

## 3. WGSL shader modules

Shaders are written in **WGSL** and compiled into a shader module with
`device.createShaderModule()`. Here the WGSL source is imported as a raw string via Vite's
`?raw` suffix, so the shader lives in its own `.wgsl` file with proper syntax.

- Where: [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `init()` (`createShaderModule`)
- Shader source: [`src/webgpu/shaders/fluidField.wgsl`](src/webgpu/shaders/fluidField.wgsl)
- Raw import typing: [`src/vite-env.d.ts`](src/vite-env.d.ts)

## 4. Render pipeline

A **render pipeline** bundles the vertex + fragment stages, the target format, and primitive
settings into one immutable object. `layout: 'auto'` lets WebGPU infer the bind group layout
from the shader instead of declaring it by hand.

- Where: [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `init()` (`createRenderPipeline`)

## 5. The fullscreen-triangle trick

This demo has no meshes. Instead the vertex shader generates a single oversized triangle from
`@builtin(vertex_index)` (values 0, 1, 2) that fully covers the viewport — so `draw(3)` with no
vertex buffer is enough. The fragment shader then colors every pixel.

- Where (WGSL): [`src/webgpu/shaders/fluidField.wgsl`](src/webgpu/shaders/fluidField.wgsl) → `vs_main`
- Where (draw call): [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `frame()` (`pass.draw(3)`)

## 6. Uniform buffers and memory layout

To send per-frame data (resolution, time, pointer, pulses) to the shader we use a **uniform
buffer**. The trickiest part is **alignment**: WGSL follows std140-like rules (a `vec2f` aligns
to 8 bytes, a `vec4f`/array to 16), so the JS side must write floats at exactly the offsets the
WGSL struct expects — including a padding float.

- Layout + write helper: [`src/webgpu/uniforms.ts`](src/webgpu/uniforms.ts) → `Uniforms`
- Matching WGSL struct: [`src/webgpu/shaders/fluidField.wgsl`](src/webgpu/shaders/fluidField.wgsl) → `struct Uniforms`
- Read the byte-offset table in the comment at the top of `uniforms.ts`.

## 7. Bind groups

A **bind group** connects buffers/textures to the `@group/@binding` slots declared in WGSL.
Here one bind group binds the uniform buffer to `@group(0) @binding(0)`.

- Where (create): [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `init()` (`createBindGroup`)
- Where (bind): [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `frame()` (`pass.setBindGroup`)
- Where (WGSL slot): [`src/webgpu/shaders/fluidField.wgsl`](src/webgpu/shaders/fluidField.wgsl) (`@group(0) @binding(0)`)

## 8. Render pass encoding and command submission

WebGPU records work into a **command encoder**, opens a **render pass** (with a color
attachment that says clear-then-store), issues pipeline/bind/draw calls, ends the pass, then
**submits** the finished command buffer to the device queue. This is the core of every frame.

- Where: [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `frame()`
  (`createCommandEncoder` → `beginRenderPass` → `draw` → `end` → `queue.submit`)

## 9. Per-frame writes vs. static data

The uniform buffer is created once but its contents are rewritten every frame with
`queue.writeBuffer()`. That's the difference between static GPU data (allocated once) and
dynamic data (updated each frame) — the animation loop lives here.

- Where (loop): [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `loop` / `frame()`
- Where (write): [`src/webgpu/uniforms.ts`](src/webgpu/uniforms.ts) → `Uniforms.write()`

## 10. Resize and device-pixel-ratio

For crisp output the canvas backing store is sized in **physical pixels**
(`clientWidth * devicePixelRatio`, capped at 2×). A `ResizeObserver` handles layout changes and
a `window` resize listener catches DPR changes from browser zoom.

- Where: [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `resize` + its listeners in `init()`

## 11. Interactivity → uniforms

Pointer position, a smoothed velocity, and a ring buffer of click "pulses" are tracked on the
CPU and packed into the uniform buffer. The shader reads them to warp the field near the
cursor, add a halo, and draw age-based expanding ripple rings (which expire on their own — no
CPU-side cleanup).

- Where (CPU state): [`src/hooks/usePointerState.ts`](src/hooks/usePointerState.ts) → `PointerState`
- Where (shader use): [`src/webgpu/shaders/fluidField.wgsl`](src/webgpu/shaders/fluidField.wgsl) → `fs_main`

## 12. Bridging shader state into the DOM

The same pointer/pulse state is written to CSS custom properties (`--pointer-x/-y`, `--pulse`,
`--hue`) on `document.documentElement`. Plain CSS then reacts: a cursor-following spotlight, a
title glow that flares on click, and hue-shifting links. This is how the shader "affects other
elements" without reading pixels back from the GPU.

- Where (JS → CSS vars): [`src/hooks/useReactiveCssVars.ts`](src/hooks/useReactiveCssVars.ts)
- Where (CSS reactions): [`src/App.module.css`](src/App.module.css) (spotlight) and
  [`src/components/HeroContent.module.css`](src/components/HeroContent.module.css) (title/links)

---

## Lifecycle and safety

- **Capability detection & fallback:** [`src/hooks/useWebGPUCanvas.ts`](src/hooks/useWebGPUCanvas.ts)
  catches `WebGPUUnsupportedError` and reports a status;
  [`src/components/ShaderBackground.tsx`](src/components/ShaderBackground.tsx) shows the gradient fallback.
- **Reduced motion:** [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `frame()` freezes time
  and drops velocity/ripples when `prefers-reduced-motion: reduce` is set.
- **Cleanup:** [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) → `dispose()` cancels the RAF
  loop, disconnects observers/listeners, and destroys the device on unmount.

## Suggested reading order

1. [`src/webgpu/context.ts`](src/webgpu/context.ts) — get a device and canvas context.
2. [`src/webgpu/shaders/fluidField.wgsl`](src/webgpu/shaders/fluidField.wgsl) — what actually draws.
3. [`src/webgpu/uniforms.ts`](src/webgpu/uniforms.ts) — how CPU data reaches the shader.
4. [`src/webgpu/renderer.ts`](src/webgpu/renderer.ts) — the frame loop that ties it together.
5. [`src/hooks/usePointerState.ts`](src/hooks/usePointerState.ts) and
   [`src/hooks/useReactiveCssVars.ts`](src/hooks/useReactiveCssVars.ts) — interactivity and the DOM bridge.
