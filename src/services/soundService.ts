class SoundService {
  private enabled: boolean = true
  private volume: number = 0.15
  private audioContext: AudioContext | null = null

  constructor() {
    const savedEnabled = localStorage.getItem('soundEnabled')
    const savedVolume = localStorage.getItem('soundVolume')

    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true'
    }

    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume)
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    return this.audioContext
  }

  /**
   * Play a soft, gentle notification chime — two ascending sine tones.
   */
  playNotification() {
    if (!this.enabled) return

    try {
      const ctx = this.getAudioContext()
      const now = ctx.currentTime
      const vol = this.volume

      // Soft two-tone chime (C5 → E5)
      this.playTone(ctx, 523.25, now, 0.12, vol * 0.6)        // C5
      this.playTone(ctx, 659.25, now + 0.13, 0.18, vol * 0.5) // E5
    } catch (error) {
      console.warn('Error playing notification sound:', error)
    }
  }

  /**
   * Play a subtle message pop — single soft tone.
   */
  playMessage() {
    if (!this.enabled) return

    try {
      const ctx = this.getAudioContext()
      const now = ctx.currentTime
      const vol = this.volume

      // Single soft pop tone (G5)
      this.playTone(ctx, 783.99, now, 0.1, vol * 0.4)
    } catch (error) {
      console.warn('Error playing message sound:', error)
    }
  }

  private playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, volume: number) {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startTime)

    // Soft envelope: quick fade-in, gentle fade-out
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.01)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    localStorage.setItem('soundEnabled', String(enabled))
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('soundVolume', String(this.volume))
  }

  getEnabled(): boolean {
    return this.enabled
  }

  getVolume(): number {
    return this.volume
  }
}

export const soundService = new SoundService()
