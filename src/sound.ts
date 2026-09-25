type SoundCue = 'card' | 'transition' | 'click'

class InterfaceSound {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private armed = false
  private lastPlayed: Record<SoundCue, number> = { card: -Infinity, transition: -Infinity, click: -Infinity }
  enabled = true

  get ready() { return this.enabled && this.armed && this.context?.state === 'running' }

  constructor() {
    try { this.enabled = localStorage.getItem('meituan-city-sound') !== 'off' } catch { /* Storage may be unavailable. */ }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (this.context && this.master) this.master.gain.setTargetAtTime(enabled ? 0.2 : 0, this.context.currentTime, 0.01)
    try { localStorage.setItem('meituan-city-sound', enabled ? 'on' : 'off') } catch { /* Keep the current session setting. */ }
  }

  async arm() {
    if (!this.enabled || document.hidden || !window.AudioContext) return false
    this.armed = true
    try {
      if (!this.context) {
        this.context = new AudioContext()
        this.master = this.context.createGain()
        this.master.gain.value = 0.2
        this.master.connect(this.context.destination)
      }
      if (this.context.state === 'suspended') await this.context.resume()
      return this.context.state === 'running'
    } catch { return false /* Unsupported or blocked audio leaves the page usable. */ }
  }

  play(cue: SoundCue) {
    const context = this.context
    if (!this.enabled || !this.armed || document.hidden || !context || !this.master) return
    if (context.state === 'suspended') { void this.arm().then(ready => { if (ready) this.play(cue) }); return }
    if (context.state !== 'running') return
    const now = performance.now()
    const cooldown = cue === 'transition' ? 1200 : cue === 'card' ? 110 : 45
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

    if (cue === 'card') tone(510, 710, 0.115, 0.09, 0, 'triangle')
    if (cue === 'click') tone(390, 225, 0.09, 0.12, 0, 'triangle')
    if (cue === 'transition') {
      tone(220, 430, 0.38, 0.32)
      tone(340, 560, 0.29, 0.18, 0.075, 'triangle')
    }
  }
}

export const interfaceSound = new InterfaceSound()
