// Fullscreen fluid/gradient field shader.
// Phase 2: a static blue -> teal gradient, drawn with a single oversized triangle.

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
  output.uv = clip * 0.5 + vec2f(0.5, 0.5);
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let deepBlue = vec3f(0.03, 0.06, 0.12);
  let teal = vec3f(0.16, 0.55, 0.60);
  let color = mix(deepBlue, teal, smoothstep(0.0, 1.0, input.uv.y));
  return vec4f(color, 1.0);
}
