import { state } from '../state/store.js';
import { StaticSquare } from '../objects/StaticSquare.js';
import { ArrangeMode } from './ArrangeMode.js';
import { TrimMode } from './TrimMode.js';
import { VolumeMode } from './VolumeMode.js';
import { PitchMode } from './PitchMode.js';
import { ArrangeRenderer } from '../rendering/ArrangeRenderer.js';
import { TrimRenderer } from '../rendering/TrimRenderer.js';
import { VolumeRenderer } from '../rendering/VolumeRenderer.js';
import { PitchRenderer } from '../rendering/PitchRenderer.js';

export const MODES = {
  ARRANGE: 'arrange',
  TRIM: 'trim',
  VOLUME: 'volume',
  PITCH: 'pitch'
};

export class ModeManager {
  constructor() {
    // Initialize modes
    this.modes = {
      arrange: new ArrangeMode(),
      trim: new TrimMode(),
      volume: new VolumeMode(),
      pitch: new PitchMode()
    };

    // Initialize renderers
    this.renderers = {
      arrange: new ArrangeRenderer(),
      trim: new TrimRenderer(),
      volume: new VolumeRenderer(),
      pitch: new PitchRenderer()
    };

    this.currentMode = this.modes.arrange;
    this.selectedSampleKey = null; // For trim mode: tracks which sample is being edited
  }

  update(deltaTime) {
    // Update current mode
    this.currentMode.update(deltaTime);
  }

  draw(grid) {
    // Get the renderer for the current mode
    const renderer = this.renderers[this.currentMode.name];
    if (!renderer) {
      console.error(`No renderer found for mode: ${this.currentMode.name}`);
      return;
    }

    // Draw using the mode's renderer
    renderer.draw(grid, state);
    this.drawStatusText();
  }

  handleKeyPress(key) {
    // Handle mode switching
    switch(key) {
      case 'q':
        this.switchMode('arrange');
        return true;
      case 't':
        this.switchMode('trim');
        return true;
      case 'v':
        this.switchMode('volume');
        return true;
      case 'p':
        this.switchMode('pitch');
        return true;
    }

    // If not a mode switch, let the current mode handle it
    return this.currentMode.handleKeyPress(key);
  }

  handleObjectCreation(key) {
    return this.currentMode.handleObjectCreation(key);
  }

  handleObjectDeletion() {
    if (!this.currentMode) {
      console.error('No current mode set');
      return false;
    }
    console.log('ModeManager handling deletion for mode:', this.currentMode.name);
    const result = this.currentMode.handleObjectDeletion();
    console.log('Deletion result:', result);
    return result;
  }

  switchMode(modeName) {
    if (!this.modes[modeName]) {
      console.error(`Invalid mode: ${modeName}`);
      return;
    }

    this.currentMode.onExit();
    this.currentMode = this.modes[modeName];
    this.currentMode.onEnter();
  }

  //=============================================================================
  // PLAYBACK CONTROL
  //=============================================================================

  togglePlayback() {
    if (state.timeManager.transport.state === 'started') {
      state.timeManager.stop();
    } else {
      state.timeManager.start();
    }
  }

  //=============================================================================
  // PRIVATE METHODS
  //=============================================================================

  drawStatusText() {
    push();
    textAlign(LEFT, BOTTOM);
    textSize(14);
    fill(0);
    noStroke();
    text(`${this.currentMode.getStatusText()} | q=arrange t=trim v=volume p=pitch`, 20, height - 20);
    pop();
  }
} 
 