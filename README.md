# Auto Wall Companion

A [Foundry VTT](https://foundryvtt.com) module that enhances wall management by providing tools to import, export, and manage walls.

![Auto Wall Tools](https://i.imgur.com/placeholder-image.png)

## Features

- **Wall Import/Export**: Easily transfer walls between scenes or share them with others
  - Import walls from JSON files or clipboard
  - Export walls to JSON files or clipboard
- **Scene Image URL**: Copy the current scene's background image URL with one click
- **Integrated UI**: Adds tools directly to Foundry's wall controls panel
- **Padding Protection**: Warns when scene padding might affect wall positioning
- **Batch Processing**: Handles large wall collections efficiently

## Installation

You can install the module using one of the following methods:

### Method 1: Install from Foundry VTT

1. Open Foundry VTT and navigate to the "Add-on Modules" tab in the setup screen.
2. Click "Install Module."
3. Search for "Auto Wall Companion" in the module browser and click "Install."

### Method 2: Use the Manifest Link

1. In the Foundry VTT setup screen, go to the "Add-on Modules" tab.
2. Click "Install Module."
3. Paste the manifest URL from the latest release:
    ```
    https://github.com/ThreeHats/auto-wall-companion/releases/latest/download/module.json
    ```
4. Click "Install."

### Method 3: Manual Installation

1. Download the [latest release](https://github.com/yourusername/auto-wall-companion/releases).
2. Extract the zip file to your Foundry VTT `Data/modules/` folder.
3. Rename the folder to `auto-wall-companion` (if necessary).
4. Restart Foundry VTT.

## Usage

### Accessing the Tools

1. Open a scene in Foundry VTT
2. Select the Walls Tool in the left toolbar
3. Find the "Wall Import/Export" and "Copy Scene Image URL" buttons in the walls submenu

### Importing Walls

Two methods are available for importing walls:

1. **From Clipboard**:
   - Copy wall JSON to your clipboard
   - Click the "Wall Import/Export" button
   - Select "Import from Clipboard"

2. **From File**:
   - Click the "Wall Import/Export" button
   - Select "Import from File"
   - Choose your wall JSON file

### Exporting Walls

Two methods are available for exporting walls:

1. **To Clipboard**:
   - Click the "Wall Import/Export" button
   - Select "Export to Clipboard"
   - The wall data will be copied to your clipboard as JSON

2. **To File**:
   - Click the "Wall Import/Export" button
   - Select "Export to File"
   - The wall data will be saved as a JSON file named after your scene

### Scene Image URL

- Click the "Copy Scene Image URL" button in the walls tool submenu
- The background image URL will be copied to your clipboard

## Important Notes

### Scene Padding

For accurate wall positioning, it's recommended to set scene padding to 0 before importing or exporting walls. If padding is not 0, the module will warn you before proceeding.

To adjust scene padding:
1. Right-click on your scene in the Scenes panel
2. Select "Configure"
3. In the scene configuration, set "Padding" to 0
4. Save changes

## Configuration

The module includes settings for log level control, accessible in the Module Settings.

## For Developers

### Using the API

The module exposes functions on the global `AutoWallCompanion` object:

```javascript
// Import walls from clipboard
window.AutoWallCompanion.importWallsFromClipboard();

// Import walls from file
window.AutoWallCompanion.importWallsFromFile();

// Export walls to clipboard
window.AutoWallCompanion.exportWallsToClipboard();

// Export walls to file
window.AutoWallCompanion.exportWallsToFile();

// Copy scene image URL
window.AutoWallCompanion.copySceneImageUrl();
```

## License

This module is licensed under the [MIT License](LICENSE).

## Credits

- Developed by [Your Name]
- Special thanks to the Foundry VTT community

## Support

For issues, suggestions, or contributions, please visit the [GitHub repository](https://github.com/yourusername/auto-wall-companion).
