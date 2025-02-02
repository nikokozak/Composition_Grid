import { state } from '../state/store.js';

export class SampleManager {
  constructor() {
    this.players = new Map();
    this.sampleNames = new Map();
    this.keyMap = new Map(); // Maps keys to sample names
    this.middleRowKeys = ['a','s','d','f','g','h','j','k','l']; // Standard keyboard middle row
    this.trimPositions = new Map(); // Maps sample names to {start, end} grid positions
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
      const player = new Tone.Player({
        url,
        onload: () => console.log(`Tone.Player loaded: ${name}`),
      }).toDestination();

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

    // Apply trim positions if they exist
    const trimPos = this.trimPositions.get(this.getSampleForKey(key));
    if (trimPos) {
      const startTime = this.getTimeFromColumn(trimPos.start);
      const endTime = trimPos.end ? this.getTimeFromColumn(trimPos.end) : player.buffer.duration;
      player.start(time, startTime, endTime - startTime);
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
} 