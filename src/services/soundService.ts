import { ref } from 'vue'

/**
 * Short UI sounds synthesised with the Web Audio API (no audio files to load).
 *
 * Browsers only allow audio after the user has interacted with the page, so the audio
 * context is created/resumed on the first pointer or key press (see `installUnlock`).
 * Message sounds are rate-limited so a burst of messages plays a single chime, and they
 * can be muted per signed-in user (remembered in localStorage).
 */

const MIN_GAP_MS = 1500

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* storage unavailable */ }
}

class SoundService {
  /** Reactive so settings toggles re-render. */
  readonly muted = ref(false)
  private volume = 0.35
  private userKey = 'guest'
  private audioContext: AudioContext | null = null
  private unlockInstalled = false
  private lastPlayedAt = 0

  constructor() {
    const savedVolume = safeGet('soundVolume')
    if (savedVolume !== null && !Number.isNaN(parseFloat(savedVolume))) {
      this.volume = Math.max(0, Math.min(1, parseFloat(savedVolume)))
    }
    this.loadMuted()
  }

  private storageKey(): string {
    return `eg:sound-muted:${this.userKey}`
  }

  private loadMuted() {
    const saved = safeGet(this.storageKey())
    if (saved !== null) {
      this.muted.value = saved === '1'
    } else {
      // Older global preference (before it was per user).
      this.muted.value = safeGet('soundEnabled') === 'false'
    }
  }

  /** Scope the mute preference to the signed-in user. */
  setUser(userId: number | null) {
    this.userKey = userId ? String(userId) : 'guest'
    this.loadMuted()
  }

  setMuted(muted: boolean) {
    this.muted.value = muted
    safeSet(this.storageKey(), muted ? '1' : '0')
  }

  isMuted(): boolean {
    return this.muted.value
  }

  private context(): AudioContext | null {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    if (!this.audioContext) this.audioContext = new Ctor()
    return this.audioContext
  }

  /** Create/resume the audio context on the first user gesture so later sounds can play. */
  installUnlock() {
    if (this.unlockInstalled || typeof window === 'undefined') return
    this.unlockInstalled = true
    const events = ['pointerdown', 'keydown', 'touchstart']
    const unlock = () => {
      const ctx = this.context()
      if (!ctx) return
      const done = () => events.forEach(e => window.removeEventListener(e, unlock, true))
      if (ctx.state === 'running') { done(); return }
      ctx.resume().then(done).catch(() => { /* try again on the next gesture */ })
    }
    events.forEach(e => window.addEventListener(e, unlock, { capture: true, passive: true }))
  }

  /**
   * Gentle two-note chime for a new chat message. Returns true when a sound was started.
   * Skipped when muted, when audio has not been unlocked yet, or within the burst window.
   */
  playMessage(): boolean {
    return this.chime([[659.25, 0, 0.16], [987.77, 0.11, 0.3]])
  }

  /** Slightly softer chime for other notifications (bookings, reviews, ...). */
  playNotification(): boolean {
    return this.chime([[523.25, 0, 0.14], [659.25, 0.12, 0.24]])
  }

  /** notes: [frequency, offset seconds, duration seconds] */
  private chime(notes: [number, number, number][]): boolean {
    if (this.muted.value) return false
    const now = Date.now()
    if (now - this.lastPlayedAt < MIN_GAP_MS) return false

    try {
      const ctx = this.context()
      if (!ctx) return false
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
        // Still suspended (no user gesture yet): nothing would be heard.
        if ((ctx.state as string) !== 'running') return false
      }
      this.lastPlayedAt = now
      const t0 = ctx.currentTime + 0.01
      notes.forEach(([freq, offset, duration], i) => this.tone(ctx, freq, t0 + offset, duration, this.volume * (i === 0 ? 0.55 : 0.45)))
      return true
    } catch (error) {
      console.warn('Could not play sound:', error)
      return false
    }
  }

  private tone(ctx: AudioContext, frequency: number, start: number, duration: number, volume: number) {
    const osc = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const gain = ctx.createGain()
    const overtoneGain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, start)
    overtone.type = 'sine'
    overtone.frequency.setValueAtTime(frequency * 2, start)
    overtoneGain.gain.setValueAtTime(0.12, start)

    // Soft bell envelope: fast attack, exponential decay.
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    osc.connect(gain)
    overtone.connect(overtoneGain)
    overtoneGain.connect(gain)
    gain.connect(ctx.destination)

    osc.start(start)
    overtone.start(start)
    osc.stop(start + duration + 0.02)
    overtone.stop(start + duration + 0.02)
  }

  // Backwards-compatible helpers
  setEnabled(enabled: boolean) { this.setMuted(!enabled) }
  getEnabled(): boolean { return !this.muted.value }
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    safeSet('soundVolume', String(this.volume))
  }
  getVolume(): number { return this.volume }
}

export const soundService = new SoundService()
