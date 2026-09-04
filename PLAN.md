## Plan: WebGPU Shader Microlearning Demo (React + TS + Vite)

Greenfield project (empty workspace). Single full-viewport WebGPU "fluid/gradient field" shader as a full-page background, animated continuously, distorted by pointer movement and click "pulses". The same pointer/pulse state that drives shader uniforms is also mirrored to CSS custom properties so headline text and links visibly react (glow/color/magnetic pull) — this is how the shader "affects other elements" without needing DOM-to-texture capture. Built in ordered phases, each a separate implementation pass, to avoid context drift.

**Decisions**

- Stack: Vite `react-ts` template, npm, plain CSS/CSS Modules (no Tailwind).
- Tooling: ESLint + Prettier only. No Vitest, no deploy config (out of scope; can be added later).
- WebGPU only — no WebGL/Canvas2D fallback rendering; unsupported browsers get a static CSS gradient + message instead.
- No compute shaders / storage buffers for this iteration (fits "fluid field" visual); noted as a stretch idea, not required.
- Shared reactivity mechanism: one pointer/pulse state object updated per frame, feeding both the WGSL uniform buffer and `document.documentElement.style.setProperty` CSS vars. This is the deliberate answer to "affects text and links".
- Comments: short, structural/why-focused only (section headers, non-obvious API rationale, WGSL math intent). Never restate what a line does. Code should be self-documenting via naming.

**Aesthetic / Design direction** (applies to this and all future phases)

- Futuristic, clean, high-tech feel.
- Color scheme: blue / white / gray with tinges of teal. The shader gradient field and all UI accents draw from this palette (deep navy/blue base, white/light-gray text, teal highlights for interactive/pulse accents).
- Hero page: a single all-lowercase title **"shaded"**, large and centered, with the animated shader filling the entire background and the rest of the page. Content sits above the full-viewport canvas.
- Typography: modern sans-serif; generous letter-spacing on the title for a futuristic look.

**Architecture (target file layout)**

```
webgpu-shader-demo/
  index.html
  vite.config.ts
  tsconfig.json (+ types: ["@webgpu/types"])
  src/
    main.tsx
    App.tsx
    vite-env.d.ts          # declare module '*?raw' for WGSL imports
    webgpu/
      context.ts            # adapter/device/canvas context init + capability check
      renderer.ts            # Renderer class: owns pipeline, uniform buffer, RAF loop, resize, dispose()
      uniforms.ts            # uniform buffer layout constants + pack/write helpers
      shaders/
        fluidField.wgsl       # fullscreen-triangle vertex + fragment (noise, domain warp, pointer/pulse ripples)
    hooks/
      useWebGPUCanvas.ts      # mounts Renderer to a <canvas>, exposes pointer handlers, fallback state
      usePointerState.ts      # tracks pointer pos/velocity + click pulse ring buffer, frame-throttled
    components/
      ShaderBackground.tsx    # <canvas> + WebGPU-unsupported fallback UI
      ShaderBackground.module.css
      HeroContent.tsx         # headline + nav/links content sitting above canvas
      HeroContent.module.css  # uses CSS vars (--pointer-x/y, --pulse, --hue) for reactive styling
    styles/
      index.css               # global resets, root CSS custom properties, prefers-reduced-motion handling
  README.md                  # setup + architecture overview
  WEBGPU_CONCEPTS.md          # learning takeaways, mapped to files/functions
```

**Phases** (implement and verify each before moving to the next; treat as separate passes)

1. **Scaffold & tooling** — `npm create vite@latest . -- --template react-ts` in workspace root; install `@webgpu/types` as devDependency; add ESLint + Prettier (flat config, `eslint-plugin-react-hooks`); update tsconfig `compilerOptions.types` to include `@webgpu/types`; create the folder skeleton above with empty/stub files; add `vite-env.d.ts` module declaration for `*?raw` imports (used for WGSL source).
   - Verify: `npm run dev` serves default Vite page, `npm run lint` passes.

2. **WebGPU core engine** (_depends on 1_) — implement `webgpu/context.ts` (feature-detect `navigator.gpu`, request adapter/device, configure canvas context with preferred format via `navigator.gpu.getPreferredCanvasFormat()`); implement `webgpu/renderer.ts` as a class with `init()`, `resize()`, `frame(time)`, `dispose()`; wire a trivial fragment shader (blue/teal gradient clear) using the fullscreen-triangle-via-`@builtin(vertex_index)` trick (no vertex buffer) to prove the pipeline; handle canvas sizing via `ResizeObserver` + `devicePixelRatio`. Replace the default Vite `App` with a full-viewport `ShaderBackground` behind an all-lowercase "shaded" title.
   - Verify: canvas fills viewport and clears to a blue/teal gradient, resizes correctly, no console errors.

3. **Animated shader** (_depends on 2_) — write `shaders/fluidField.wgsl`: WGSL value/simplex-style noise function + domain warping for a flowing gradient field; add `webgpu/uniforms.ts` defining a `Uniforms` struct (resolution: vec2f, time: f32, padding, pointer: vec2f, pointerVelocity: vec2f, pulses: array<vec4f, 8>) respecting WGSL 16-byte alignment rules; single bind group (binding 0 = uniform buffer); RAF loop advances `time` and writes buffer via `device.queue.writeBuffer`.
   - Verify: shader animates continuously and fills viewport with no interactivity yet.

4. **Pointer & click interactivity** (_depends on 3_) — `hooks/usePointerState.ts`: track normalized pointer position + smoothed velocity from `pointermove`; on `pointerdown`, push a pulse `{x, y, startTime}` into a fixed-size ring buffer (8 slots) overwriting the oldest; `hooks/useWebGPUCanvas.ts` feeds this state into the renderer each frame; extend WGSL fragment shader to distort the noise field near the pointer and render expanding/fading ripple rings per active pulse (age-based falloff, no JS-side removal needed).
   - Verify: moving the mouse visibly warps the field; clicking spawns a ripple that fades over ~1–2s; rapid clicks reuse ring buffer without errors.

5. **Page content & CSS reactivity** (_depends on 4_) — build `components/HeroContent.tsx` (headline + a few nav/links) layered above the canvas (`ShaderBackground` behind via CSS stacking, `mix-blend-mode` on canvas or overlay content for visual cohesion); in the same per-frame update from step 4, also call `setProperty('--pointer-x', ...)` etc. on `document.documentElement` (throttle if needed, but per-frame is fine); style links/headline in `HeroContent.module.css` to react — e.g., link glow/underline intensity based on distance to `--pointer-x/-y`, headline hue/text-shadow tied to `--hue`/`--pulse`.
   - Verify: hovering/moving near links visibly changes their styling in sync with the shader; no layout shift; content remains readable/accessible.

6. **Polish & fallback** (_depends on 5_) — add unsupported-browser branch in `useWebGPUCanvas` (checks `!('gpu' in navigator)` or failed adapter request) rendering a static CSS gradient + short message instead of canvas; respect `prefers-reduced-motion` (pause/slow animation, skip velocity-based distortion); ensure `Renderer.dispose()` is called on unmount (destroy buffers/device references, cancel RAF); confirm resize/DPR correctness on window resize and browser zoom.
   - Verify: manually test in a WebGPU-unsupported browser (or via disabling flag) for graceful fallback; toggle OS reduced-motion setting; resize window repeatedly with no leaks/errors in console.

7. **Documentation** (_depends on 6_) — write `README.md` (Node version requirement, `npm install`/`npm run dev`, browser requirement note — Chrome/Edge 113+ or equivalent WebGPU-enabled browser, project structure summary, quick "how it works" pointer into `WEBGPU_CONCEPTS.md`); write `WEBGPU_CONCEPTS.md` covering, per concept, a short explanation + exact file/function reference: adapter & device request, canvas context configuration, WGSL shader modules, render pipeline creation, fullscreen-triangle vertex trick, uniform buffer layout & alignment rules, bind groups, render pass encoding & command submission, per-frame buffer writes vs. static data, resize/DPR handling, and how CSS variables were used to bridge shader state into the DOM; do a final pass over inline comments in `.ts`/`.wgsl` files to ensure they're short, structural, and non-redundant (trim anything that restates code).
   - Verify: read through both docs standalone (no code needed) and confirm each concept links to a real, current file/function.

**Relevant files** (all new)

- `src/webgpu/context.ts`, `src/webgpu/renderer.ts`, `src/webgpu/uniforms.ts`, `src/webgpu/shaders/fluidField.wgsl` — core engine, built in phases 2–4.
- `src/hooks/useWebGPUCanvas.ts`, `src/hooks/usePointerState.ts` — React/DOM glue, phase 4.
- `src/components/ShaderBackground.tsx`, `src/components/HeroContent.tsx` (+ `.module.css` pairs) — UI, phases 5–6.
- `src/styles/index.css` — global CSS vars + reduced-motion, phase 5–6.
- `README.md`, `WEBGPU_CONCEPTS.md` — phase 7.

**Verification (overall)**

- `npm run lint` and `npm run build` clean at the end of every phase.
- Manual browser check in a current Chrome/Edge (WebGPU-enabled) after phases 2, 3, 4, 5, 6.
- Fallback-path check (phase 6) in a non-WebGPU browser or via `navigator.gpu` stub.

**Further Considerations**

1. Compute shaders / storage buffers aren't used (fluid field is fragment-shader-only). Could be a future stretch phase (e.g., GPU particle swarm) if deeper compute-pipeline learning is wanted later — not in current scope.
2. Deployment (GitHub Pages/Vercel) and automated tests (Vitest) were explicitly excluded per your answers; flag if you want them added as an additional phase later.
