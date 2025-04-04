import { ModuleLogger } from './utils/logger';
import { moduleId } from './constants';
import { WallManagementDialog } from './wall-management-dialog';

/**
 * Initialize the module
 */
Hooks.once('init', () => {
  // Register settings first before any other initialization
  registerSettings();
  ModuleLogger.info('Initializing module');
});

/**
 * Register module settings
 */
function registerSettings() {
  (game as Game).settings.register(moduleId, "logLevel", {
    name: "Log Level",
    hint: "Set the level of detail for module logging",
    scope: "world",
    config: true,
    type: Number,
    choices: {
      0: "debug",
      1: "info", 
      2: "warn",
      3: "error"
    } as any,
    default: 2
  });
}

/**
 * Setup module after initialization
 */
Hooks.once('ready', () => {
  ModuleLogger.info('Module ready');
  
  // Register module to the global window object for macro use - do this in ready hook
  (window as any).ModuleBundler = {
    importWallsFromClipboard: WallUtils.importWallsFromClipboard.bind(WallUtils),
    importWallsFromFile: WallUtils.importWallsFromFile.bind(WallUtils),
    exportWallsToClipboard: WallUtils.exportWallsToClipboard.bind(WallUtils),
    exportWallsToFile: WallUtils.exportWallsToFile.bind(WallUtils),
    copySceneImageUrl: WallUtils.copySceneImageUrl.bind(WallUtils)
  };
});

/**
 * Add buttons to the walls submenu using getSceneControlButtons
 */
Hooks.on('getSceneControlButtons', function (controls: any[]) {
  // Find the walls control group
  const wallsControl = controls.find(c => c.name === "walls");
  
  if (wallsControl && wallsControl.tools) {
    // Check if our buttons already exist to prevent duplicates
    const hasWallManagement = wallsControl.tools.some((t: { name: string }) => t.name === "wall-management");
    const hasCopyImage = wallsControl.tools.some((t: { name: string }) => t.name === "copy-scene-image");
    
    // Only add buttons if they don't already exist
    if (!hasWallManagement) {
      wallsControl.tools.push({
        name: "wall-management",
        title: "Wall Import/Export",
        icon: "fas fa-exchange-alt",
        onClick: () => {
          new WallManagementDialog().render(true);
        },
        button: true
      });
    }
    
    if (!hasCopyImage) {
      wallsControl.tools.push({
        name: "copy-scene-image",
        title: "Copy Scene Image URL",
        icon: "fas fa-image",
        onClick: () => {
          WallUtils.copySceneImageUrl();
        },
        button: true
      });
    }
  }
});

/**
 * Wall utility functions
 */
export class WallUtils {
  /**
   * Import walls from clipboard JSON
   */
  static async importWallsFromClipboard(): Promise<void> {
    try {
      // Show loading notification
      ui.notifications?.info("Reading wall data from clipboard...");

      // Read clipboard contents
      const text = await navigator.clipboard.readText();
      await this.processWallImport(text);
    } catch (error) {
      ui.notifications?.error("Failed to read clipboard: " + (error instanceof Error ? error.message : String(error)));
      console.error("Clipboard read error:", error);
    }
  }

  /**
   * Import walls from a JSON file
   */
  static importWallsFromFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        await this.processWallImport(text);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /**
   * Process wall data for import
   */
  static async processWallImport(text: string): Promise<void> {
    try {
      // Parse JSON data - should be an array of wall objects
      const walls = JSON.parse(text);

      if (!Array.isArray(walls)) {
        ui.notifications?.error("Invalid wall data format. Expected an array of walls.");
        return;
      }

      // Get the current scene
      const scene = (game as Game).scenes?.current;
      if (!scene) {
        ui.notifications?.error("No active scene");
        return;
      }
      
      // Check for non-zero padding
      if ((scene as any).padding !== 0) {
        const confirmImport = await this.showPaddingWarning("import");
        if (!confirmImport) return;
      }

      // Prepare wall data for creation - removing _id properties
      const wallData = walls.map(wall => {
        const { _id, ...wallData } = wall;
        return wallData;
      });

      // Create walls in batches to avoid performance issues
      const BATCH_SIZE = 100;
      const totalWalls = wallData.length;
      let createdCount = 0;

      ui.notifications?.info(`Creating ${totalWalls} walls...`);

      // Process walls in batches
      for (let i = 0; i < wallData.length; i += BATCH_SIZE) {
        const batch = wallData.slice(i, i + BATCH_SIZE);
        await scene.createEmbeddedDocuments("Wall", batch);

        createdCount += batch.length;

        // Update progress
        if (i + BATCH_SIZE < wallData.length) {
          ui.notifications?.info(`Created ${createdCount} of ${totalWalls} walls...`);
        }
      }

      ui.notifications?.info(`Successfully created ${createdCount} walls!`);
    } catch (error) {
      ui.notifications?.error("Error processing walls:" + (error instanceof Error ? error.message : String(error)));
      console.error("Wall import error:", error);
    }
  }

  /**
   * Export walls to clipboard as JSON
   */
  static async exportWallsToClipboard(): Promise<void> {
    try {
      const json = await this.getWallsJson();
      await navigator.clipboard.writeText(json);
      ui.notifications?.info("Walls copied to clipboard successfully.");
    } catch (err) {
      console.error("Clipboard write error:", err);
      ui.notifications?.error("Failed to copy walls to clipboard.");
    }
  }

  /**
   * Export walls to JSON file
   */
  static async exportWallsToFile(): Promise<void> {
    try {
      const scene = (game as Game).scenes?.current;
      if (!scene || !scene.name) {
        ui.notifications?.error("No active scene found.");
        return;
      }
      
      const json = await this.getWallsJson();
      saveDataToFile(json, "application/json", `${scene.name.replace(/\s+/g, "_")}_walls.json`);
      ui.notifications?.info("Walls exported successfully.");
    } catch (err) {
      console.error("Wall export error:", err);
      ui.notifications?.error("Failed to export walls.");
    }
  }

  /**
   * Get walls JSON for the current scene
   */
  static async getWallsJson(): Promise<string> {
    const scene = (game as Game).scenes?.current;
    if (!scene) {
      throw new Error("No active scene found.");
    }

    // Check for non-zero padding
    if ((scene as any).padding !== 0) {
      const confirmExport = await this.showPaddingWarning("export");
      if (!confirmExport) throw new Error("Wall export cancelled.");
    }

    // Extract wall data
    const walls = scene.walls.map(wall => wall.toObject());

    // Convert to JSON
    return JSON.stringify(walls, null, 2);
  }

  /**
   * Show warning about non-zero padding
   * @param operation The operation being performed ("import" or "export")
   * @returns True if user confirms to continue, false otherwise
   */
  private static async showPaddingWarning(operation: string): Promise<boolean> {
    return new Promise((resolve) => {
      const d = new Dialog({
        title: "Scene Padding Warning",
        content: `
          <p>The current scene has non-zero padding. This can cause wall positions to be incorrect when ${operation}ing.</p>
          <p>It is recommended to set the scene padding to 0 before ${operation}ing walls.</p>
          <p>You can change the padding in the scene configuration settings.</p>
        `,
        buttons: {
          continue: {
            icon: '<i class="fas fa-exclamation-triangle"></i>',
            label: `Continue ${operation} anyway`,
            callback: () => resolve(true)
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(false)
          }
        },
        default: "cancel"
      });
      d.render(true);
    });
  }

  /**
   * Copy the current scene's background image URL to clipboard
   */
  static async copySceneImageUrl(): Promise<void> {
    try {
      const scene = (game as Game).scenes?.viewed;
      if (!scene) {
        ui.notifications?.warn("No scene is currently viewed.");
        return;
      }

      const imageUrl = (scene as any).background?.src;
      if (!imageUrl) {
        ui.notifications?.warn("The current scene has no background image.");
        return;
      }

      // Prepend Foundry's base URL
      const baseUrl = window.location.origin;
      const fullImageUrl = new URL(imageUrl, baseUrl).href;

      await navigator.clipboard.writeText(fullImageUrl);
      ui.notifications?.info(`Copied scene background URL: ${fullImageUrl}`);
    } catch (error) {
      console.error("Error copying scene image URL:", error);
      ui.notifications?.error("Error copying image URL:" + (error instanceof Error ? error.message : String(error)));
    }
  }
}

/**
 * Register the module in the game
 */
export default {
  id: moduleId
};
