// src/ts/utils/logger.ts
import { moduleId } from "../constants";

/**
 * Utility for module logging with debug mode support
 */
export class ModuleLogger {
  /**
   * Check if debug mode is enabled
   */
  static debugLevel(): number {
    // Check if settings are available and the setting is registered
    try {
      return (game as Game).settings.get(moduleId, "logLevel") as number;
    } catch (error) {
      // Return default log level if setting isn't registered yet
      console.warn(`${moduleId} | Settings not ready, using default log level`);
      return 2; // Default to warning level
    }
  }

  /**
   * Log a debug message (only when debug mode is enabled)
   */
  static debug(message: string, ...args: any[]): void {
    if (this.debugLevel() < 1) {
      console.log(`${moduleId} | ${message}`, ...args);
    }
  }

  /**
   * Log info message (always shown)
   */
  static info(message: string, ...args: any[]): void {
    if (this.debugLevel() < 2) {
        console.log(`${moduleId} | ${message}`, ...args);
    }
  }

  /**
   * Log warning message (always shown)
   */
  static warn(message: string, ...args: any[]): void {
    if (this.debugLevel() < 3) {
      console.warn(`${moduleId} | ${message}`, ...args);
    }
  }

  /**
   * Log error message (always shown)
   */
  static error(message: string, ...args: any[]): void {
    if (this.debugLevel() < 4) {
        console.error(`${moduleId} | ${message}`, ...args);
    }
  }
}