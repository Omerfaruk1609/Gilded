/**
 * Web Audio API Ambient Nature & Zen Sound Engine
 * Instant, procedural soundscapes with zero external network audio files.
 */

class AmbientSoundEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.nodes = []
    this.currentType = null
    this.volume = 0.7
    this.isPlaying = false
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  stop() {
    this.isPlaying = false
    this.currentType = null

    if (this.nodes.length > 0) {
      this.nodes.forEach((node) => {
        try {
          if (node.stop) node.stop()
          if (node.disconnect) node.disconnect()
        } catch {
          // Ignore
        }
      })
      this.nodes = []
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect()
      } catch {
        // Ignore
      }
      this.masterGain = null
    }
  }

  play(type) {
    this.ensureContext()
    this.stop()

    this.isPlaying = true
    this.currentType = type

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    this.masterGain.connect(this.ctx.destination)

    switch (type) {
      case 'rain':
        this.buildRainSound()
        break
      case 'ocean':
        this.buildOceanSound()
        break
      case 'forest':
        this.buildForestSound()
        break
      case 'zen':
      default:
        this.buildZenSound()
        break
    }
  }

  // 🌧️ 1. YAĞMUR SESİ (Pink Noise + Lowpass Filter)
  buildRainSound() {
    const sampleRate = this.ctx.sampleRate || 44100
    const bufferSize = Math.floor(sampleRate * 2)
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    const output = noiseBuffer.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12
      b6 = white * 0.115926
    }

    const rainSource = this.ctx.createBufferSource()
    rainSource.buffer = noiseBuffer
    rainSource.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime)

    rainSource.connect(filter)
    filter.connect(this.masterGain)

    rainSource.start(0)
    this.nodes.push(rainSource, filter)
  }

  // 🌊 2. OKYANUS DALGALARI (Brown Noise + 0.1Hz Swell)
  buildOceanSound() {
    const sampleRate = this.ctx.sampleRate || 44100
    const bufferSize = Math.floor(sampleRate * 3)
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    const output = noiseBuffer.getChannelData(0)

    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = output[i]
      output[i] *= 3.5
    }

    const oceanSource = this.ctx.createBufferSource()
    oceanSource.buffer = noiseBuffer
    oceanSource.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, this.ctx.currentTime)

    const lfo = this.ctx.createOscillator()
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime)
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.setValueAtTime(400, this.ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    oceanSource.connect(filter)
    filter.connect(this.masterGain)

    oceanSource.start(0)
    lfo.start(0)
    this.nodes.push(oceanSource, filter, lfo, lfoGain)
  }

  // 🌲 3. ORMAN RÜZGARI (Bandpass Breeze)
  buildForestSound() {
    const sampleRate = this.ctx.sampleRate || 44100
    const bufferSize = Math.floor(sampleRate * 2)
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    const output = noiseBuffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5
    }

    const windSource = this.ctx.createBufferSource()
    windSource.buffer = noiseBuffer
    windSource.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(650, this.ctx.currentTime)
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime)

    const lfo = this.ctx.createOscillator()
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime)
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.setValueAtTime(320, this.ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    windSource.connect(filter)
    filter.connect(this.masterGain)

    windSource.start(0)
    lfo.start(0)
    this.nodes.push(windSource, filter, lfo, lfoGain)
  }

  // 🧘 4. ZEN & TİBET ÇANI (432 Hz Healing Harmony)
  buildZenSound() {
    const freqs = [108, 216, 432, 648]
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

      const oscGain = this.ctx.createGain()
      oscGain.gain.setValueAtTime(0.22 / (idx + 1), this.ctx.currentTime)

      const lfo = this.ctx.createOscillator()
      lfo.frequency.setValueAtTime(0.08 * (idx + 1), this.ctx.currentTime)
      const lfoGain = this.ctx.createGain()
      lfoGain.gain.setValueAtTime(0.05, this.ctx.currentTime)

      lfo.connect(lfoGain)
      lfoGain.connect(oscGain.gain)

      osc.connect(oscGain)
      oscGain.connect(this.masterGain)

      osc.start(0)
      lfo.start(0)
      this.nodes.push(osc, oscGain, lfo, lfoGain)
    })
  }
}

export const ambientAudio = new AmbientSoundEngine()
