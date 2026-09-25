type SoundCue = 'card' | 'transition' | 'click'

class InterfaceSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private armed = false
  private lastPlayed: Record<SoundCue, number> = { card: 0, transition: 0, click: 0 }
  enabled = true

  constructor() {
    try { this.enabled = localStorage.getItem('meituan-city-sound') !== 'off' } catch { /* Storage may be unavailable. */ }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (this.context && this.master) this.master.gain.setTargetAtTime(enabled ? 0.16 : 0, this.context.currentTime, 0.01)
    try { localStorage.setItem('meituan-city-sound', enabled ? 'on' : 'off') } catch { /* Keep the current session setting. */ }
    if (enabled) void this.arm()
  }

  async arm() {
    if (!this.enabled || document.hidden || !window.AudioContext) return
    this.armed = true
    try {
      if (!this.context) {
        this.context = new AudioContext()
        this.master = this.context.createGain()
        this.master.gain.value = 0.16
        this.master.connect(this.context.destination)
      }
      if (this.context.state === 'suspended') await this.context.resume()
    } catch { /* Unsupported or blocked audio leaves the page usable. */ }
  }

  play(cue: SoundCue) {
    const context = this.context
    if (!this.enabled || !this.armed || document.hidden || !context || context.state !== 'running' || !this.master) return
    const now = performance.now()
    const cooldown = cue === 'transition' ? 350 : cue === 'card' ? 110 : 45
    if (now - this.lastPlayed[cue] < cooldown) return
    this.lastPlayed[cue] = now

    const tone = (frequency: number, target: number, duration: number, gain: number, delay = 0, shape: OscillatorType = 'sine') => {
      const start = context.currentTime + delay
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      oscillator.type = shape
      oscillator.frequency.setValueAtTime(frequency, start)
      oscillator.frequency.exponentialRampToValueAtTime(target, start + duration)
      envelope.gain.setValueAtTime(0.0001, start)
      envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.018, duration / 3))
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      oscillator.connect(envelope).connect(this.master!)
      oscillator.start(start)
      oscillator.stop(start + duration + 0.01)
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
    }

    if (cue === 'card') tone(510, 710, 0.115, 0.12, 0, 'triangle')
    if (cue === 'click') tone(390, 225, 0.09, 0.15, 0, 'triangle')
    if (cue === 'transition') {
      tone(235, 420, 0.31, 0.13)
      tone(355, 520, 0.24, 0.075, 0.065, 'triangle')
    }
  }
}

export const interfaceSound = new InterfaceSound()
