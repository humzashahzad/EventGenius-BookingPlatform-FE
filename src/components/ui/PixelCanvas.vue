<template>
  <canvas
    ref="canvasRef"
    class="absolute inset-0 w-full h-full z-[2]"
    style="pointer-events: none"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  /** Size of each pixel cell in pixels */
  gap?: number
  /** Speed of the trailing decay (higher = faster fade) */
  speed?: number
  /** Array of colors for pixels — interpolates through them as trail fades */
  colors?: string[]
  /** Disable mouse tracking */
  noFocus?: boolean
  /** Variant style: default | trail | glow */
  variant?: 'default' | 'trail' | 'glow'
  /** Base opacity for the always-visible pixel grid background */
  baseOpacity?: number
}

const props = withDefaults(defineProps<Props>(), {
  gap: 15,
  speed: 0.02,
  colors: () => ['#34D399', '#6EE7B7', '#10B981', '#059669'],
  noFocus: false,
  variant: 'default',
  baseOpacity: 0.06,
})

interface Pixel {
  x: number
  y: number
  size: number
  intensity: number
  targetIntensity: number
  colorPhase: number
  colorOverride?: string
}

// --- Color helpers ---
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  if (!c1 || !c2) return color1

  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)

  return `rgb(${r}, ${g}, ${b})`
}

function getColorFromIntensity(intensity: number, phase: number): string {
  const colors = props.colors
  if (colors.length === 0) return '#ffffff'
  if (colors.length === 1) return colors[0]!

  const t = (phase + intensity) % 1
  const index = Math.floor(t * (colors.length - 1))
  const nextIndex = Math.min(index + 1, colors.length - 1)
  const localT = (t * (colors.length - 1)) % 1

  const color1 = colors[index]
  const color2 = colors[nextIndex]

  if (!color1) return '#ffffff'
  if (!color2) return color1!

  return lerpColor(color1, color2, localT)
}

// --- Refs ---
const canvasRef = ref<HTMLCanvasElement | null>(null)

let parentEl: HTMLElement | null = null
let pixels: Pixel[][] = []
let mouseX = -1000
let mouseY = -1000
let animId = 0
let lastTime = 0
let cols = 0
let rows = 0
let ctx: CanvasRenderingContext2D | null = null

// Offscreen canvas for performance optimization
let offscreenCanvas: HTMLCanvasElement | null = null
let offscreenCtx: CanvasRenderingContext2D | null = null

function initPixels() {
  const canvas = canvasRef.value
  if (!canvas || !parentEl) return

  const rect = parentEl.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const pixelSize = Math.max(props.gap, 4)

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  ctx = canvas.getContext('2d', { alpha: true })
  if (ctx) ctx.scale(dpr, dpr)

  cols = Math.ceil(rect.width / pixelSize)
  rows = Math.ceil(rect.height / pixelSize)

  const newPixels: Pixel[][] = []
  for (let i = 0; i < cols; i++) {
    const row: Pixel[] = []
    for (let j = 0; j < rows; j++) {
      const existing = pixels[i]?.[j]
      row.push({
        x: i * pixelSize,
        y: j * pixelSize,
        size: pixelSize - 1,
        intensity: existing?.intensity ?? 0,
        targetIntensity: 0,
        colorPhase: existing?.colorPhase ?? Math.random(),
      })
    }
    newPixels.push(row)
  }
  pixels = newPixels

  // Pre-render the base pixel grid to an offscreen canvas
  // This saves ~20,000 canvas API calls per frame, ensuring buttery smooth 60fps
  offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = canvas.width
  offscreenCanvas.height = canvas.height
  offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true })
  if (offscreenCtx) {
    offscreenCtx.scale(dpr, dpr)
    offscreenCtx.clearRect(0, 0, rect.width, rect.height)
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const p = pixels[i][j]
        const color = getColorFromIntensity(props.baseOpacity, p.colorPhase)
        offscreenCtx.globalAlpha = props.baseOpacity * 0.9
        offscreenCtx.fillStyle = color
        if (props.variant === 'trail') {
          const cornerRadius = p.size * 0.3
          offscreenCtx.beginPath()
          offscreenCtx.roundRect(p.x, p.y, p.size, p.size, cornerRadius)
          offscreenCtx.fill()
        } else {
          offscreenCtx.fillRect(p.x, p.y, p.size, p.size)
        }
      }
    }
  }
}

function draw(timestamp: number) {
  if (!ctx || !parentEl) {
    animId = requestAnimationFrame(draw)
    return
  }

  const deltaTime = timestamp - lastTime
  lastTime = timestamp

  const rect = parentEl.getBoundingClientRect()
  ctx.clearRect(0, 0, rect.width, rect.height)

  // Ambient pulsing when cursor is idle
  if (mouseX < 0 && Math.random() < 0.05) {
    // Increased pulse radius to make ambient pulses much larger
    const pulseRadius = props.variant === 'glow' ? 12 : 8
    const centerCol = Math.floor(Math.random() * cols)
    const centerRow = Math.floor(Math.random() * rows)
    
    for (let dc = -pulseRadius; dc <= pulseRadius; dc++) {
      for (let dr = -pulseRadius; dr <= pulseRadius; dr++) {
        const c = centerCol + dc
        const r = centerRow + dr
        if (pixels[c] && pixels[c][r]) {
          const dist = Math.sqrt(dc * dc + dr * dr)
          if (dist <= pulseRadius) {
            const falloff = 1 - (dist / pulseRadius)
            pixels[c][r].intensity = Math.max(pixels[c][r].intensity, Math.pow(falloff, 1.5) * 1.0)
          }
        }
      }
    }
  }

  // Fast-render the base pixel grid from the offscreen layer
  if (offscreenCanvas) {
    ctx.globalAlpha = 1
    ctx.drawImage(offscreenCanvas, 0, 0, rect.width, rect.height)
  }

  // Increased target radius for a smoother trail feel
  const radius = props.variant === 'glow' ? 150 : 120
  const glowPasses = props.variant === 'glow' ? 2 : 1

  for (let i = 0; i < cols; i++) {
    const col = pixels[i]
    if (!col) continue

    for (let j = 0; j < rows; j++) {
      const pixel = col[j]
      if (!pixel) continue

      // Distance from mouse
      const centerX = pixel.x + pixel.size / 2
      const centerY = pixel.y + pixel.size / 2
      const dx = mouseX - centerX
      const dy = mouseY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Set target intensity based on distance
      if (distance < radius) {
        const falloff = 1 - distance / radius
        pixel.targetIntensity = Math.pow(falloff, 1.5)
      } else {
        pixel.targetIntensity = 0
      }

      // Smooth interpolation — 0.8 ensures extremely responsive/fast lighting, speed handles decay
      const lerpSpeed =
        pixel.targetIntensity > pixel.intensity ? 0.8 : props.speed
      pixel.intensity +=
        (pixel.targetIntensity - pixel.intensity) * lerpSpeed

      // Only re-draw the pixel if it is actively interacting/fading out
      if (pixel.intensity > 0.005) {
        // Shift color phase slowly for shimmer
        pixel.colorPhase = (pixel.colorPhase + 0.001 * (deltaTime / 16)) % 1

        let color = getColorFromIntensity(
          Math.max(pixel.intensity, props.baseOpacity),
          pixel.colorPhase,
        )
        if (pixel.colorOverride) {
          color = pixel.colorOverride
          if (pixel.intensity < 0.1) {
            pixel.colorOverride = undefined
          }
        }

        // Glow effect: draw larger blurred version first
        if (props.variant === 'glow' && pixel.intensity > 0.2) {
          for (let g = glowPasses; g > 0; g--) {
            const glowSize = pixel.size + g * 4
            const glowOffset = (glowSize - pixel.size) / 2
            ctx.globalAlpha = (pixel.intensity * 0.15) / g
            ctx.fillStyle = color
            ctx.fillRect(
              pixel.x - glowOffset,
              pixel.y - glowOffset,
              glowSize,
              glowSize,
            )
          }
        }

        // Main active pixel over the base grid
        ctx.globalAlpha = pixel.intensity * 0.9
        ctx.fillStyle = color

        if (props.variant === 'trail') {
          const cornerRadius = pixel.size * 0.3
          ctx.beginPath()
          ctx.roundRect(pixel.x, pixel.y, pixel.size, pixel.size, cornerRadius)
          ctx.fill()
        } else {
          ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
        }
      }
    }
  }

  ctx.globalAlpha = 1
  animId = requestAnimationFrame(draw)
}

// --- Event handlers (on parent so they work over text too) ---
function onMouseMove(e: MouseEvent) {
  if (!parentEl) return
  const rect = parentEl.getBoundingClientRect()
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top
}

function onMouseLeave() {
  mouseX = -1000
  mouseY = -1000
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length > 0 && parentEl) {
    const touch = e.touches[0]
    if (touch) {
      const rect = parentEl.getBoundingClientRect()
      mouseX = touch.clientX - rect.left
      mouseY = touch.clientY - rect.top
    }
  }
}

function onTouchEnd() {
  mouseX = -1000
  mouseY = -1000
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  // Use the parent element (the brand panel) for mouse events
  // so the pixel effect works even when hovering over text/content
  parentEl = canvas.parentElement
  if (!parentEl) return

  initPixels()
  lastTime = performance.now()
  animId = requestAnimationFrame(draw)

  // Resize observer instead of window resize for accuracy
  resizeObserver = new ResizeObserver(() => initPixels())
  resizeObserver.observe(parentEl)

  if (!props.noFocus) {
    parentEl.addEventListener('mousemove', onMouseMove)
    parentEl.addEventListener('mouseleave', onMouseLeave)
    parentEl.addEventListener('touchmove', onTouchMove, { passive: true })
    parentEl.addEventListener('touchend', onTouchEnd)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  if (resizeObserver) resizeObserver.disconnect()
  if (parentEl) {
    parentEl.removeEventListener('mousemove', onMouseMove)
    parentEl.removeEventListener('mouseleave', onMouseLeave)
    parentEl.removeEventListener('touchmove', onTouchMove)
    parentEl.removeEventListener('touchend', onTouchEnd)
  }
})
function triggerPulse(type: 'error' | 'warning' | 'success') {
  if (!cols || !rows) return
  let color = '#3b82f6' // success: blue
  if (type === 'error') color = '#ef4444' // error: red
  if (type === 'warning') color = '#f59e0b' // warning: orange

  const centerCol = Math.floor(Math.random() * cols)
  const centerRow = Math.floor(Math.random() * rows)
  const burstRadius = props.variant === 'glow' ? 20 : 12
  
  for (let dc = -burstRadius; dc <= burstRadius; dc++) {
    for (let dr = -burstRadius; dr <= burstRadius; dr++) {
      const c = centerCol + dc
      const r = centerRow + dr
      if (pixels[c] && pixels[c][r]) {
        const dist = Math.sqrt(dc * dc + dr * dr)
        if (dist <= burstRadius) {
          const falloff = 1 - (dist / burstRadius)
          pixels[c][r].intensity = Math.max(pixels[c][r].intensity, Math.pow(falloff, 1.5) * 3.0)
          pixels[c][r].colorOverride = color
        }
      }
    }
  }
}

defineExpose({
  triggerPulse,
})
</script>
