/**
 * BaseRenderer - Abstract base class for all renderers
 * Defines the interface that all renderers must implement
 */
export class BaseRenderer {
  constructor() {}

  /**
   * Draw the mode's visual elements
   * @param {Grid} grid - The grid instance
   * @param {object} state - The current state
   */
  draw(grid, state) {
    throw new Error('draw() must be implemented by subclass');
  }

  /**
   * Draw debug information (optional)
   * @param {Grid} grid - The grid instance
   * @param {object} state - The current state
   */
  drawDebug(grid, state) {}
} 