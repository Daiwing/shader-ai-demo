/// <reference types="vite/client" />

// WGSL shader sources are imported as raw strings via Vite's `?raw` suffix.
declare module '*.wgsl?raw' {
  const source: string
  export default source
}
