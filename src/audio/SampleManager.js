import { state } from '../state/store.js';

export class SampleManager {
  constructor() {
    this.players = new Map();
    this.sampleNames = new Map();
    this.keyMap = new Map(); // Maps keys to sample names
    this.middleRowKeys = ['a','s','d','f','g','h','j','k','l']; // Standard keyboard middle row
    this.trimPositions = new Map(); // Maps sample names to {start, end} grid positions
    this.volumes = new Map(); // Maps keys to volume values in dB
    this.pitchShifts = new Map(); // Now maps "key:column" to semitones
    
    // Create a shared gain node for all players
    this.mainGainNode = new Tone.Gain().toDestination();
    
    // Cache for computed values
    this.rateCache = new Map(); // Cache for pitch shift calculations
    this.trimCache = new Map(); // Cache for trim calculations
  }

  async loadSamples() {
    const samples = [
      { key: 'a', name: 'Hat-Espeeeeee', url: 'samples/Hat-Espeeeeee.wav' },
      { key: 's', name: 'Synth-AuroraBoreal', url: 'samples/Synth-AuroraBoreal.wav' },
      { key: 'd', name: 'Synth-AfterHours', url: 'samples/Synth-AfterHours.wav' },
      { key: 'f', name: 'Synth-BlocySquare3', url: 'samples/Synth-BlocySquare3.wav' },
      { key: 'g', name: 'Basedrum-Eightsnap', url: 'samples/Basedrum-Eightsnap.wav' }
    ];

    await Promise.all(
      samples.map(async sample => {
        await this.loadSample(sample.key, sample.name, sample.url);
      })
    );
  }

  async loadSample(key, name, url) {
    try {
      // Create player with optimized settings
      const player = new Tone.Player({
        url,
        onload: () => console.log(`Tone.Player loaded: ${name}`),
        fadeOut: 0.01, // Quick fade to prevent clicks
        fadeIn: 0.01,
        curve: 'linear' // Less CPU intensive than exponential
      }).connect(this.mainGainNode);

      while (!player.loaded) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.players.set(key, player);
      this.sampleNames.set(key, name);
      this.keyMap.set(key, name);
    } catch (error) {
      console.error(`Error loading sample ${name}:`, error);
    }
  }

  playSampleAtTime(key, time) {
    const player = this.players.get(key);
    if (!player) return;

    const currentColumn = state.timeManager.getCurrentColumn();
    
    // Use cached pitch rate if available
    const cacheKey = `${key}:${currentColumn}`;
    let rate = this.rateCache.get(cacheKey);
    if (rate === undefined) {
      const pitchShift = this.getPitchShift(key, currentColumn);
      rate = Math.pow(2, pitchShift/12);
      this.rateCache.set(cacheKey, rate);
    }
    player.playbackRate = rate;

    // Use cached trim positions
    const trimKey = this.getSampleForKey(key);
    let trimData = this.trimCache.get(trimKey);
    if (!trimData) {
      const trimPos = this.trimPositions.get(trimKey);
      if (trimPos) {
        trimData = {
          startTime: this.getTimeFromColumn(trimPos.start),
          endTime: trimPos.end ? this.getTimeFromColumn(trimPos.end) : player.buffer.duration
        };
        this.trimCache.set(trimKey, trimData);
      }
    }

    if (trimData) {
      player.start(time, trimData.startTime, trimData.endTime - trimData.startTime);
    } else {
      player.start(time);
    }
  }

  playSample(key) {
    this.playSampleAtTime(key, '+0');
  }

  getKeyMappings() {
    return Object.fromEntries(this.keyMap);
  }

  getSampleNames() {
    const names = new Set([
      ...Array.from(this.sampleNames.values()),
      ...Array.from(this.keyMap.values())
    ]);
    return Array.from(names);
  }

  getSampleForKey(key) {
    return this.sampleNames.get(key);
  }

  setTrimPositions(sampleName, startCol, endCol) {
    this.trimPositions.set(sampleName, { start: startCol, end: endCol });
    this.trimCache.delete(sampleName);
  }

  clearTrimPositions(sampleName) {
    this.trimPositions.delete(sampleName);
  }

  // Helper method to convert grid column to time
  getTimeFromColumn(col) {
    return col / 4; // Assuming 16th notes, convert to beats
  }

  // Get the audio buffer for waveform visualization
  getSampleBuffer(name) {
    // Find the key for this sample name
    const key = Array.from(this.keyMap.entries()).find(([k, n]) => n === name)?.[0];
    if (!key) return null;
    
    const player = this.players.get(key);
    if (!player) return null;
    return player.buffer;
  }

  // Get trim positions for a sample
  getTrimPositions(name) {
    return this.trimPositions.get(name);
  }

  setVolume(key, dbValue) {
    this.volumes.set(key, dbValue);
    const player = this.players.get(key);
    if (player) {
      // Convert dB to linear gain (0 dB = 1.0)
      const gain = dbValue === -Infinity ? 0 : Math.pow(10, dbValue / 20);
      player.volume.value = dbValue;
    }
  }

  getVolume(key) {
    return this.volumes.get(key) ?? 0; // Default to 0 dB
  }

  setPitchShift(key, semitones, column) {
    const pitchKey = `${key}:${column}`;
    this.pitchShifts.set(pitchKey, semitones);
    this.rateCache.delete(pitchKey);
  }

  getPitchShift(key, column) {
    const pitchKey = `${key}:${column}`;
    return this.pitchShifts.get(pitchKey) ?? 0;
  }

  clearPitchShift(key, column) {
    const pitchKey = `${key}:${column}`;
    this.pitchShifts.delete(pitchKey);
  }
} 