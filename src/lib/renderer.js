// Rendu WebGL du dégradé. La rampe de couleurs est une texture 1D construite côté JS :
// - mode palettes : rampe à 5 couleurs, identique au shader d'origine ;
// - mode marque : une passe basse résolution mesure la répartition du champ, puis la rampe est
//   égalisée pour que chaque couleur couvre exactement la part de surface demandée.
import { RAMP_N, buildPaletteRamp, buildBrandBase, composeEqualized } from './ramp'

const PROBE_LONG_SIDE = 160

const VERT = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
const FRAG = [
  '#ifdef GL_FRAGMENT_PRECISION_HIGH',
  'precision highp float;',
  '#else',
  'precision mediump float;',
  '#endif',
  'uniform vec2 uRes;',
  'uniform float uSeed, uScale, uWarp, uContrast, uStreak, uAngle, uGrain;',
  'uniform sampler2D uRamp;',
  'uniform vec2 uRange;',
  'uniform float uPass;',
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
  '  float s = clamp((t - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0);',
  '  return texture2D(uRamp, vec2((s * ' + (RAMP_N - 1).toFixed(1) + ' + 0.5) / ' + RAMP_N.toFixed(1) + ', 0.5)).rgb;',
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
  '  float t = (f - 0.5) * uContrast + 0.5 + uv.y * 0.3;',
  '  if (uPass > 0.5) {',
  '    float e = clamp((t + 3.0) / 7.0, 0.0, 1.0) * 255.0;',
  '    gl_FragColor = vec4(floor(e) / 255.0, fract(e), 0.0, 1.0);',
  '    return;',
  '  }',
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

const UNIFORMS = ['uRes', 'uSeed', 'uScale', 'uWarp', 'uContrast', 'uStreak', 'uAngle', 'uGrain', 'uRamp', 'uRange', 'uPass']

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

  // Texture de la rampe (unité 0).
  const rampTex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, rampTex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, RAMP_N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.uniform1i(u.uRamp, 0)

  // Cible hors écran pour la passe de mesure.
  const probeTex = gl.createTexture()
  const fbo = gl.createFramebuffer()
  let probeW = 0, probeH = 0
  let probePixels = null

  let uploadedKey = null // clé de la rampe actuellement dans la texture (mode palettes)
  let brandKey = null
  let brandBase = null

  function uploadRamp(data) {
    gl.bindTexture(gl.TEXTURE_2D, rampTex)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RAMP_N, 1, gl.RGBA, gl.UNSIGNED_BYTE, data)
  }

  // Rend le champ brut en basse résolution et renvoie ses valeurs triées.
  function probe(w, h) {
    const k = PROBE_LONG_SIDE / Math.max(w, h)
    const pw = Math.max(8, Math.round(w * k)), ph = Math.max(8, Math.round(h * k))
    if (pw !== probeW || ph !== probeH) {
      probeW = pw; probeH = ph
      gl.bindTexture(gl.TEXTURE_2D, probeTex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pw, ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, probeTex, 0)
      probePixels = new Uint8Array(pw * ph * 4)
      gl.bindTexture(gl.TEXTURE_2D, rampTex)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.viewport(0, 0, pw, ph)
    // uRes garde le format final : seule la densité d'échantillonnage change.
    gl.uniform2f(u.uRes, pw, ph)
    gl.uniform1f(u.uPass, 1)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.readPixels(0, 0, pw, ph, gl.RGBA, gl.UNSIGNED_BYTE, probePixels)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.uniform1f(u.uPass, 0)
    const n = pw * ph
    const vals = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const e = (probePixels[i * 4] + probePixels[i * 4 + 1] / 255) / 255
      vals[i] = e * 7 - 3
    }
    vals.sort()
    return vals
  }

  return {
    canvas,
    draw(p, w, h) {
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      gl.uniform1f(u.uSeed, p.seed)
      gl.uniform1f(u.uScale, p.scale)
      gl.uniform1f(u.uWarp, p.warp)
      gl.uniform1f(u.uContrast, p.contrast)
      gl.uniform1f(u.uStreak, p.streak)
      gl.uniform1f(u.uAngle, p.angle * Math.PI / 180)
      gl.uniform1f(u.uGrain, p.grain)

      if (p.mode === 'brand') {
        const key = JSON.stringify(p.brand)
        if (key !== brandKey) { brandKey = key; brandBase = buildBrandBase(p.brand) }
        const eq = composeEqualized(brandBase, probe(w, h))
        uploadRamp(eq.data)
        uploadedKey = null
        gl.uniform2f(u.uRange, eq.min, eq.max)
      } else {
        const key = p.colors.join(',')
        if (key !== uploadedKey) { uploadedKey = key; uploadRamp(buildPaletteRamp(p.colors)) }
        gl.uniform2f(u.uRange, 0, 1)
      }

      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.uRes, w, h)
      gl.uniform1f(u.uPass, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
  }
}
