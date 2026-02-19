/**
 * Animation utilities for Svelte popups (PixiJS compatibility layer)
 */

export class PixiAnimations {
  /**
   * Bounce in animation
   */
  static async bounceIn(_element: any, duration: number = 600): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Fade out animation
   */
  static async fadeOut(_element: any, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Fade in animation
   */
  static async fadeIn(_element: any, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Slide in animation
   */
  static async slideIn(_element: any, duration: number = 400): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }
}
