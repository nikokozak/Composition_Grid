import * as Tone from 'tone';

export class SampleManager {
  constructor() {
    this.samples = new Map();
    this.sampleNames = [];
  }

  async loadSamples() {
    const sampleFiles = [
      'Hat-Espeeeeee.wav',
      'Synth-AuroraBoreal.wav',
      'Synth-AfterHours.wav',
      'Synth-BlocySquare3.wav',
      'Basedrum-Eightsnap.wav'
    ];

    for (const file of sampleFiles) {
      const player = new Tone.Player({
        url: `samples/${file}`,
        onload: () => console.log(`Loaded ${file}`),
      }).toDestination();

      const name = file.replace('.wav', '');
      this.samples.set(name, player);
      this.sampleNames.push(name);
    }

    await Tone.loaded();
  }

  getSampleNames() {
    return this.sampleNames;
  }

  playSample(name) {
    const player = this.samples.get(name);
    if (player) {
      player.start();
    }
  }
} 