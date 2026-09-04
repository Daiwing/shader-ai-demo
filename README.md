# shaded — a WebGPU shader microlearning demo

An interactive, full-viewport WebGPU shader built with React + TypeScript + Vite. A flowing
blue/teal noise field animates continuously, warps and glows under the cursor, ripples on
click, and drives CSS variables so the page's title and links react in sync.

This project is also a **learning artifact**: see [WEBGPU_CONCEPTS.md](WEBGPU_CONCEPTS.md) for a
guided tour of every WebGPU concept it uses, mapped to the exact file and function.

## Requirements

- **Node.js 20+** (developed on Node 24).
- A **WebGPU-enabled browser** — Chrome or Edge 113+, or another current browser with WebGPU.
  Browsers without WebGPU show a static gradient fallback instead of the animated shader.

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build    # type-check (tsc -b) and build for production
npm run preview  # preview the production build
npm run lint     # run ESLint
npm run format   # format with Prettier
```

## How it works

- A single fullscreen shader is drawn every frame (no 3D geometry — one oversized triangle).
- Pointer position, velocity, and click "pulses" are packed into a uniform buffer the shader reads.
- The same pointer/pulse state is mirrored into CSS custom properties, so the DOM reacts too.

For the full explanation, read [WEBGPU_CONCEPTS.md](WEBGPU_CONCEPTS.md).

## Project structure

```
src/
  App.tsx                     hero stage: shader background + content + cursor spotlight
  main.tsx                    React entry
  styles/index.css            global palette + reactive CSS variable defaults
  webgpu/
    context.ts                adapter/device/canvas-context init + capability check
    renderer.ts               render pipeline, RAF loop, uniforms, resize, disposal
    uniforms.ts               uniform buffer layout + per-frame write helper
    shaders/fluidField.wgsl   the shader: noise, domain warp, pointer drag, ripples
  hooks/
    usePointerState.ts        pointer position/velocity + click pulse ring buffer
    useWebGPUCanvas.ts         mounts the renderer to a canvas, exposes status
    useReactiveCssVars.ts      writes pointer/pulse state into CSS variables
  components/
    ShaderBackground.tsx      canvas host + WebGPU-unsupported fallback UI
    HeroContent.tsx           title, tagline, and links that react to the shader state
```

## Tech stack

React 19, TypeScript, Vite, WebGPU (WGSL). Styling is plain CSS / CSS Modules.
