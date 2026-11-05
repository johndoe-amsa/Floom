// Rendu WebGL du dégradé (shader identique à la version HTML d'origine).

const VERT = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
const FRAG = [
  '#ifdef GL_FRAGMENT_PRECISION_HIGH',
  'precision highp float;',
  '#else',
  'precision mediump float;',
  '#endif',
  'uniform vec2 uRes;',
  'uniform float uSeed, uScale, uWarp, uContrast, uStreak, uAngle, uGrain;',
  'uniform vec3 uC0, uC1, uC2, uC3, uC4;',
  'float hash(vec2 p){',
  '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
  '  p3 += dot(p3, p3.yzx + 33.33);',
  '  return fract((p3.x + p3.y) * p3.z);',
  '}',
  'float vnoise(vec2 p){',
  '  vec2 i = floor(p); vec2 f = fract(p);',
  '  vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);',
  '  float a = hash(i); float b = hash(i + vec2(1.0,0.0));',
  '  float c = hash(i + vec2(0.0,1.0)); float d = hash(i + vec2(1.0,1.0));',
  '  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);',
  '}',
  'float fbm(vec2 p){',
  '  float v = 0.0; float a = 0.5;',
  '  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);',
  '  for (int i = 0; i < 2; i++){ v += a * vnoise(p); p = m * p * 1.9 + 17.0; a *= 0.3; }',
  '  return v / 0.65;',
  '}',
  'vec3 ramp(float t){',
  '  t = clamp(t, 0.0, 0.9999) * 4.0;',
  '  float x = fract(t); x = x*x*(3.0 - 2.0*x);',
  '  if (t < 1.0) return mix(uC0, uC1, x);',
  '  if (t < 2.0) return mix(uC1, uC2, x);',
  '  if (t < 3.0) return mix(uC2, uC3, x);',
  '  return mix(uC3, uC4, x);',
  '}',
  'void main(){',
  '  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  '  float ca = cos(uAngle); float sa = sin(uAngle);',
  '  uv = mat2(ca, -sa, sa, ca) * uv;',
  '  vec2 off = vec2(hash(vec2(uSeed, 1.0)), hash(vec2(uSeed, 2.0))) * 80.0;',
  '  vec2 p = uv * vec2(0.55, 1.0) * uScale * 2.0 + off;',
  '  vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));',
  '  vec2 r = vec2(fbm(p + uWarp * q + vec2(1.7, 9.2)), fbm(p + uWarp * q + vec2(8.3, 2.8)));',
  '  float f = fbm(p + uWarp * r);',
  '  float t = clamp((f - 0.5) * uContrast + 0.5 + uv.y * 0.3, 0.0, 1.0);',
  '  vec3 col = ramp(t);',
  '  vec2 dir = normalize(vec2(1.0, -0.4));',
  '  float ph = dot(p, dir) * 0.7 + (q.x + r.y) * 1.6;',
  '  float s = 0.5 + 0.5 * sin(ph * 3.14159265);',
  '  float band = smoothstep(0.35, 1.0, s);',
  '  col = mix(col, vec3(1.0), band * uStreak * 0.75);',
  '  float n = hash(gl_FragCoord.xy + uSeed);',
  '  col += (n - 0.5) * (uGrain * 0.14 + 1.0 / 255.0);',
  '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
  '}',
].join('\n')

const UNIFORMS = ['uRes', 'uSeed', 'uScale', 'uWarp', 'uContrast', 'uStreak', 'uAngle', 'uGrain', 'uC0', 'uC1', 'uC2', 'uC3', 'uC4']

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// Renvoie { canvas, draw(params, w, h) } ou null si WebGL n'est pas disponible.
export function makeRenderer(canvas) {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false })
  if (!gl) return null

  function compile(type, src) {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh))
      return null
    }
    return sh
  }

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog))
    return null
  }
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u = {}
  UNIFORMS.forEach((k) => { u[k] = gl.getUniformLocation(prog, k) })

  return {
    canvas,
    draw(p, w, h) {
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.uRes, w, h)
      gl.uniform1f(u.uSeed, p.seed)
      gl.uniform1f(u.uScale, p.scale)
      gl.uniform1f(u.uWarp, p.warp)
      gl.uniform1f(u.uContrast, p.contrast)
      gl.uniform1f(u.uStreak, p.streak)
      gl.uniform1f(u.uAngle, p.angle * Math.PI / 180)
      gl.uniform1f(u.uGrain, p.grain)
      for (let i = 0; i < 5; i++) {
        const c = hexToRgb(p.colors[i])
        gl.uniform3f(u['uC' + i], c[0], c[1], c[2])
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
}
