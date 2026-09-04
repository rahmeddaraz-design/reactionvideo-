/**
 * Web Audio Engine for Ahmed Reaction Studio
 * Manages multi-track mixing, per-layer gains, master output,
 * real-time VU analysis, and recording stream integration.
 */

class StudioAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private recordDestination: MediaStreamAudioDestinationNode | null = null;
  
  // Cache MediaElementSourceNodes so an element is never wrapped twice (which would throw)
  private elementSources = new Map<HTMLMediaElement, MediaElementAudioSourceNode>();
  private layerGains = new Map<string, GainNode>();
  private layerAnalysers = new Map<string, AnalyserNode>();

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      
      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 128;
      this.masterAnalyser.smoothingTimeConstant = 0.8;
      
      this.recordDestination = this.ctx.createMediaStreamDestination();
      
      // Connect master gain -> analyser -> destination (and speakers)
      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.recordDestination);
      this.masterAnalyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public async resume(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public attachMediaElement(layerId: string, element: HTMLMediaElement, volume: number = 1.0, muted: boolean = false): void {
    const ctx = this.getContext();
    if (!this.masterGain) return;

    let sourceNode = this.elementSources.get(element);
    if (!sourceNode) {
      try {
        sourceNode = ctx.createMediaElementSource(element);
        this.elementSources.set(element, sourceNode);
      } catch (e) {
        // Element might already be attached or cross-origin restricted
        console.warn('Could not create MediaElementSource', e);
        return;
      }
    }

    // Per-layer gain node
    let gainNode = this.layerGains.get(layerId);
    if (!gainNode) {
      gainNode = ctx.createGain();
      this.layerGains.set(layerId, gainNode);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      this.layerAnalysers.set(layerId, analyser);

      gainNode.connect(analyser);
      analyser.connect(this.masterGain);
    }

    // Set gain using equal power curve (sine taper)
    const effectiveGain = muted ? 0 : Math.sin((volume * Math.PI) / 2);
    gainNode.gain.setValueAtTime(effectiveGain, ctx.currentTime);

    try {
      sourceNode.disconnect();
      sourceNode.connect(gainNode);
    } catch {}
  }

  public attachMediaStream(layerId: string, stream: MediaStream, volume: number = 1.0, muted: boolean = false): void {
    if (stream.getAudioTracks().length === 0) return;
    const ctx = this.getContext();
    if (!this.masterGain) return;

    try {
      const source = ctx.createMediaStreamSource(stream);
      let gainNode = this.layerGains.get(layerId);
      if (!gainNode) {
        gainNode = ctx.createGain();
        this.layerGains.set(layerId, gainNode);
        gainNode.connect(this.masterGain);
      }
      const effectiveGain = muted ? 0 : Math.sin((volume * Math.PI) / 2);
      gainNode.gain.setValueAtTime(effectiveGain, ctx.currentTime);
      source.connect(gainNode);
    } catch (e) {
      console.warn('Could not attach MediaStream audio', e);
    }
  }

  public setLayerVolume(layerId: string, volume: number, muted: boolean = false): void {
    const gainNode = this.layerGains.get(layerId);
    if (gainNode && this.ctx) {
      const effectiveGain = muted ? 0 : Math.sin((volume * Math.PI) / 2);
      gainNode.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.03);
    }
  }

  public setMasterVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      const effectiveGain = Math.sin((volume * Math.PI) / 2);
      this.masterGain.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.03);
    }
  }

  public detachLayer(layerId: string): void {
    const gainNode = this.layerGains.get(layerId);
    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch {}
      this.layerGains.delete(layerId);
    }

    const analyser = this.layerAnalysers.get(layerId);
    if (analyser) {
      try {
        analyser.disconnect();
      } catch {}
      this.layerAnalysers.delete(layerId);
    }
  }

  public getMasterLevel(): { rms: number; peak: number; clipping: boolean } {
    if (!this.masterAnalyser) return { rms: 0, peak: 0, clipping: false };
    
    const bufferLength = this.masterAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.masterAnalyser.getByteTimeDomainData(dataArray);

    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < bufferLength; i++) {
      const norm = (dataArray[i] - 128) / 128; // -1.0 to 1.0
      const absVal = Math.abs(norm);
      if (absVal > peak) peak = absVal;
      sumSquares += norm * norm;
    }

    const rms = Math.sqrt(sumSquares / bufferLength);
    return {
      rms: Math.min(1.0, rms * 1.6),
      peak: Math.min(1.0, peak),
      clipping: peak >= 0.98
    };
  }

  public getRecordDestinationStream(): MediaStream | null {
    return this.recordDestination ? this.recordDestination.stream : null;
  }
}

export const studioAudio = new StudioAudioManager();
