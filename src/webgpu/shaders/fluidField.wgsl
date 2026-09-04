// Fullscreen fluid/gradient field shader.
// Phase 3: animated value-noise fbm with domain warping, in a blue/teal palette.

struct Uniforms {
  resolution: vec2f,
  time: f32,
  _pad0: f32,
  pointer: vec2f,
  pointerVelocity: vec2f,
  pulses: array<vec4f, 8>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

// Fullscreen-triangle trick: three clip-space verts cover the viewport, no vertex buffer.
@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );

  let clip = positions[index];
  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  output.uv = clip * 0.5 + vec2f(0.5);
  return output;
}

// --- Noise ---

fn hash2(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn valueNoise(p: vec2f) -> f32 {
  let cell = floor(p);
  let f = fract(p);
  let a = hash2(cell);
  let b = hash2(cell + vec2f(1.0, 0.0));
  let c = hash2(cell + vec2f(0.0, 1.0));
  let d = hash2(cell + vec2f(1.0, 1.0));
  let w = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

// Fractal Brownian motion: stacked noise octaves for organic detail.
fn fbm(p: vec2f) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = p;
  for (var i = 0; i < 5; i = i + 1) {
    value = value + amplitude * valueNoise(frequency);
    frequency = frequency * 2.0;
    amplitude = amplitude * 0.5;
  }
  return value;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let aspect = u.resolution.x / max(u.resolution.y, 1.0);
  var p = input.uv;
  p.x = p.x * aspect;

  let t = u.time * 0.08;

  // Domain warp: displace the sample point by a second noise field so the pattern flows.
  let warp = vec2f(
    fbm(p * 3.0 + vec2f(0.0, t)),
    fbm(p * 3.0 + vec2f(t, 1.7)),
  );
  let field = fbm(p * 3.0 + warp * 1.5 + vec2f(t * 0.5));

  // Blue/teal palette ramp driven by the field value.
  let deep = vec3f(0.02, 0.05, 0.11);
  let blue = vec3f(0.12, 0.30, 0.62);
  let teal = vec3f(0.22, 0.72, 0.70);
  var color = mix(deep, blue, smoothstep(0.2, 0.6, field));
  color = mix(color, teal, smoothstep(0.55, 0.95, field));

  return vec4f(color, 1.0);
}
