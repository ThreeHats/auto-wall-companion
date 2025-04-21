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
  (window as any).AutoWallCompanion = {
    importWallsFromClipboard: WallUtils.importWallsFromClipboard.bind(WallUtils),
    importWallsFromFile: WallUtils.importWallsFromFile.bind(WallUtils),
    exportWallsToClipboard: WallUtils.exportWallsToClipboard.bind(WallUtils),
    exportWallsToFile: WallUtils.exportWallsToFile.bind(WallUtils),
    copySceneImageUrl: WallUtils.copySceneImageUrl.bind(WallUtils),
    exportSceneTilesAsImage: WallUtils.exportSceneTilesAsImage.bind(WallUtils)
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
    
    // Add the export tiles button
    const hasExportTiles = wallsControl.tools.some((t: { name: string }) => t.name === "export-tiles");
    if (!hasExportTiles) {
      wallsControl.tools.push({
        name: "export-tiles",
        title: "Export Tiles as Image",
        icon: "fas fa-th-large",
        onClick: () => {
          WallUtils.exportSceneTilesAsImage();
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

  /**
   * Export all tiles in the current scene as a single image
   */
  static async exportSceneTilesAsImage(): Promise<void> {
    try {
      // Get the current scene
      const scene = (game as Game).scenes?.current;
      if (!scene) {
        ui.notifications?.error("No active scene found.");
        return;
      }

      // Check if there are any tiles
      const tiles = scene.tiles.contents;
      if (!tiles || tiles.length === 0) {
        ui.notifications?.warn("The current scene has no tiles to export.");
        return;
      }

      // Create a canvas to combine all tiles
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        ui.notifications?.error("Unable to create canvas context for tile export.");
        return;
      }

      // Show progress notification
      ui.notifications?.info(`Preparing to export ${tiles.length} tiles...`);

      // Calculate the bounds of all tiles to determine canvas size
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      // First pass: determine canvas size based on all tile positions and dimensions
      for (const tile of tiles) {
        const tileData = (tile as any);
        // Access properties safely with fallbacks
        const tileWidth = tileData.width || tileData.document?.width || 0;
        const tileHeight = tileData.height || tileData.document?.height || 0;
        const tileX = tileData.x || tileData.document?.x || 0;
        const tileY = tileData.y || tileData.document?.y || 0;
        
        minX = Math.min(minX, tileX);
        minY = Math.min(minY, tileY);
        maxX = Math.max(maxX, tileX + tileWidth);
        maxY = Math.max(maxY, tileY + tileHeight);
      }

      // Ensure we have valid dimensions (add 1px padding if needed)
      if (maxX <= minX) maxX = minX + 1;
      if (maxY <= minY) maxY = minY + 1;
      
      // Set canvas dimensions to contain all tiles
      const canvasWidth = Math.ceil(maxX - minX);
      const canvasHeight = Math.ceil(maxY - minY);
      
      // Check for excessively large canvas dimensions
      const MAX_DIMENSION = 16384; // Most browsers' maximum canvas size
      if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION) {
        ui.notifications?.error(`Canvas size too large (${canvasWidth}x${canvasHeight}). Maximum supported dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION}.`);
        return;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Fill with transparent background
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Load and draw all tiles - using a more reliable approach
      let loadedCount = 0;
      let failedCount = 0;
      
      ui.notifications?.info(`Loading tile images...`);
      
      // Process tiles in sequence to ensure proper rendering order
      for (const tile of tiles) {
        try {
          const tileData = (tile as any);
          // Access key properties with fallbacks
          const tileWidth = tileData.width || tileData.document?.width || 0;
          const tileHeight = tileData.height || tileData.document?.height || 0;
          const tileX = tileData.x || tileData.document?.x || 0;
          const tileY = tileData.y || tileData.document?.y || 0;
          
          // Find the texture path
          let textureSrc = null;
          if (tileData.texture?.src) {
            textureSrc = tileData.texture.src;
          } else if (tileData.document?.texture?.src) {
            textureSrc = tileData.document.texture.src;
          } else if (tileData.img) {
            textureSrc = tileData.img;
          } else if (tileData.document?.img) {
            textureSrc = tileData.document.img;
          }
          
          if (!textureSrc) {
            ModuleLogger.warn(`Tile doesn't have a valid texture source`);
            failedCount++;
            continue;
          }
          
          // Load the image
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            img.onload = () => {
              try {
                // Draw the image at its position, adjusted by the minimum bounds
                ctx.drawImage(
                  img,
                  0, 0, img.width, img.height,
                  tileX - minX, tileY - minY, tileWidth, tileHeight
                );
                loadedCount++;
                resolve();
              } catch (err) {
                ModuleLogger.warn(`Error drawing tile image: ${err}`);
                failedCount++;
                resolve();
              }
            };
            
            img.onerror = () => {
              ModuleLogger.warn(`Failed to load tile image: ${textureSrc}`);
              failedCount++;
              resolve();
            };
            
            img.src = textureSrc;
          });
        } catch (err) {
          ModuleLogger.warn(`Error processing tile: ${err}`);
          failedCount++;
        }
      }

      // Status update before export
      if (failedCount > 0) {
        ui.notifications?.warn(`${failedCount} tiles could not be loaded or drawn.`);
      }
      
      try {
        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });
        
        if (!blob) {
          ui.notifications?.error("Failed to create image blob.");
          return;
        }
        
        // Generate file name
        const sceneName = scene.name?.replace(/\s+/g, "_") || "scene";
        const fileName = `${sceneName}_tiles.png`;
        
        // Create a File object
        const file = new File([blob], fileName, { type: "image/png" });
        
        // Create download link using FileSaver API
        const FileSaver = (await import('file-saver')).default;
        FileSaver.saveAs(file, fileName);
        
        ui.notifications?.info(`Scene tiles exported successfully (${loadedCount} tiles).`);
      } catch (exportErr) {
        console.error("Image export error:", exportErr);
        ui.notifications?.error(`Failed to export image: ${exportErr instanceof Error ? exportErr.message : String(exportErr)}`);
      }
    } catch (error) {
      console.error("Error exporting scene tiles:", error);
      ui.notifications?.error("Error exporting scene tiles: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}

/**
 * Register the module in the game
 */
export default {
  id: moduleId
};
