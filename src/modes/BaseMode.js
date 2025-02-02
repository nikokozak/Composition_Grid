/**
 * BaseMode - Abstract base class for all modes
 * Defines the interface that all modes must implement
 */
export class BaseMode {
  constructor(name) {
    this.name = name;
  }

  /**
   * Called when the mode becomes active
   */
  onEnter() {}

  /**
   * Called when the mode becomes inactive
   */
  onExit() {}

  /**
   * Update logic for the mode
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {}

  /**
   * Draw the mode's visual elements
   * @param {Grid} grid - The grid instance
   */
  draw(grid) {}

  /**
   * Handle key press events
   * @param {string} key - The key that was pressed
   * @returns {boolean} - True if the key was handled, false otherwise
   */
  handleKeyPress(key) {
    return false;
  }

  /**
   * Handle object creation at the current cursor position
   * @param {string} key - The key that triggered the creation
   * @returns {boolean} - True if an object was created, false otherwise
   */
  handleObjectCreation(key) {
    return false;
  }

  /**
   * Handle object deletion at the current cursor position
   * @returns {boolean} - True if an object was deleted, false otherwise
   */
  handleObjectDeletion() {
    return false;
  }

  /**
   * Get the status text for this mode
   * @returns {string} - The status text to display
   */
  getStatusText() {
    return `Mode: ${this.name}`;
  }
} 