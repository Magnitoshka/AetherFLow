import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
varying vec2 v_texcoord;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  v_texcoord = uv;
}
`

const fragmentShader = `
varying vec2 v_texcoord;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_shapeSize;
uniform float u_roundness;
uniform float u_borderSize;
uniform float u_circleSize;
uniform float u_circleEdge;
uniform float u_frameInset;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TWO_PI
#define TWO_PI 6.2831853071795864769252867665590
#endif
#ifndef VAR
#define VAR 0
#endif

vec2 coord(in vec2 p) {
  p = p / u_resolution.xy;
  if (u_resolution.x > u_resolution.y) {
    p.x *= u_resolution.x / u_resolution.y;
    p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
  } else {
    p.y *= u_resolution.y / u_resolution.x;
    p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
  }
  p -= 0.5;
  p *= vec2(-1.0, 1.0);
  return p;
}

#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
float sdCircle(in vec2 st, in vec2 center) { return length(st - center) * 2.0; }
float sdPoly(in vec2 p, in float w, in int sides) {
  float a = atan(p.x, p.y) + PI;
  float r = TWO_PI / float(sides);
  float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p), 0.0));
  return d * 2.0 - w;
}
float aastep(float threshold, float value) {
  float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678;
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}
float fill(float x, float size, float edge) { return 1.0 - smoothstep(size - edge, size + edge, x); }
float strokeAA(float x, float size, float w, float edge) {
  float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
  float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
    - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
  return clamp(d, 0.0, 1.0);
}

void main() {
  vec2 st = st0 + 0.5;
  vec2 posMouse = mx * vec2(1.0, -1.0) + 0.5;
  float sdf;
  if (VAR == 0) {
    vec2 frameResolution = max(
      u_resolution.xy - vec2(2.0 * u_frameInset * u_pixelRatio),
      vec2(1.0)
    );
    vec2 frameCenter = u_resolution.xy * 0.5;
    vec2 framePoint = (gl_FragCoord.xy - frameCenter) / frameResolution.y;
    vec2 stFrame = framePoint * vec2(-1.0, 1.0) + 0.5;
    vec2 mousePoint = (u_mouse * u_pixelRatio - frameCenter) / frameResolution.y;
    vec2 mouseFrame = mousePoint * vec2(-1.0, -1.0) + 0.5;
    float sdfCircleFrame = fill(sdCircle(stFrame, mouseFrame), u_circleSize, u_circleEdge);
    float aspect = frameResolution.x / frameResolution.y;
    vec2 outerBounds = vec2(2.1 * aspect + u_roundness, 2.1 + u_roundness);
    vec2 shapeBounds = outerBounds * u_shapeSize;
    sdf = sdRoundRect(stFrame, shapeBounds, u_roundness);
    sdf = strokeAA(sdf, 0.0, u_borderSize, sdfCircleFrame) * 4.0;
  } else if (VAR == 1) {
    float sdfCircle = fill(sdCircle(st, posMouse), u_circleSize, u_circleEdge);
    sdf = fill(sdCircle(st, vec2(0.5)), 0.6, sdfCircle) * 1.2;
  } else if (VAR == 2) {
    float sdfCircle = fill(sdCircle(st, posMouse), u_circleSize, u_circleEdge);
    sdf = strokeAA(sdCircle(st, vec2(0.5)), 0.58, 0.02, sdfCircle) * 4.0;
  } else {
    float sdfCircle = fill(sdCircle(st, posMouse), u_circleSize, u_circleEdge);
    sdf = fill(sdPoly(st - vec2(0.5, 0.45), 0.3, 3), 0.05, sdfCircle) * 1.4;
  }
  gl_FragColor = vec4(vec3(1.0), sdf);
}
`

export default function ShapeBlur({
  className = '',
  variation = 0,
  pixelRatioProp = 2,
  shapeSize = 1.2,
  roundness = 0.4,
  borderSize = 0.05,
  circleSize = 0.3,
  circleEdge = 0.5,
  frameInset = 0,
  style,
  ...rest
}) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || typeof window.WebGLRenderingContext === 'undefined') return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    } catch {
      mount.dataset.shapeBlurFallback = 'true'
      return undefined
    }

    let active = true
    let animationFrameId
    let lastTime = 0
    const vMouse = new THREE.Vector2()
    const vMouseDamp = new THREE.Vector2()
    const vResolution = new THREE.Vector2()
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera()
    camera.position.z = 1
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_mouse: { value: vMouseDamp },
        u_resolution: { value: vResolution },
        u_pixelRatio: { value: pixelRatioProp },
        u_shapeSize: { value: shapeSize },
        u_roundness: { value: roundness },
        u_borderSize: { value: borderSize },
        u_circleSize: { value: circleSize },
        u_circleEdge: { value: circleEdge },
        u_frameInset: { value: frameInset },
      },
      defines: { VAR: variation },
      transparent: true,
    })
    const quad = new THREE.Mesh(geometry, material)
    scene.add(quad)

    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect()
      vMouse.set(event.clientX - rect.left, event.clientY - rect.top)
    }
    const resize = () => {
      if (!active) return
      const width = mount.clientWidth
      const height = mount.clientHeight
      const dpr = Math.min(pixelRatioProp || window.devicePixelRatio || 1, 2)
      renderer.setSize(width, height)
      renderer.setPixelRatio(dpr)
      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()
      quad.scale.set(width, height, 1)
      vResolution.set(width, height).multiplyScalar(dpr)
      material.uniforms.u_pixelRatio.value = dpr
      const cssFrameInset = Number.parseFloat(
        window.getComputedStyle(mount).getPropertyValue('--shape-blur-frame-inset')
      )
      material.uniforms.u_frameInset.value = Number.isFinite(cssFrameInset) ? cssFrameInset : frameInset
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    window.addEventListener('resize', resize)
    document.addEventListener('pointermove', onPointerMove)
    resize()

    const update = (time) => {
      if (!active) return
      const delta = Math.min((time - lastTime) * 0.001, 0.1)
      lastTime = time
      vMouseDamp.x = THREE.MathUtils.damp(vMouseDamp.x, vMouse.x, 8, delta)
      vMouseDamp.y = THREE.MathUtils.damp(vMouseDamp.y, vMouse.y, 8, delta)
      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(update)
    }
    animationFrameId = requestAnimationFrame(update)

    return () => {
      active = false
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('pointermove', onPointerMove)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [borderSize, circleEdge, circleSize, frameInset, pixelRatioProp, roundness, shapeSize, variation])

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ ...style, '--shape-blur-frame-inset-default': `${frameInset}px` }}
      {...rest}
    />
  )
}
