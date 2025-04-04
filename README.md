# Foundry Module Bundler

A Foundry VTT module that allows you to create and share bundles of modules across Foundry instances.

![Foundry V12 Compatible](https://img.shields.io/badge/Foundry-v12-green)
![Alpha Status](https://img.shields.io/badge/Status-Alpha-orange)

## Overview

Foundry Module Bundler solves the problem of sharing your module setup with friends, other GMs, or across multiple Foundry instances. With a few clicks, you can:

1. Create a bundle of all your active modules (or all installed modules)
2. Share a single manifest URL that will install all publicly available modules
3. Download a zip file of any modules that couldn't be found online **not for distribution**

# Important Notes

⚠️ **IMPORTANT: Always back up your worlds before installing multiple modules at once!**

- The bundler only works with **publicly available non-premium modules**
- Premium modules and those not publicly available will be offered for local download instead (still in development)
- If a required module is already installed in your Foundry instance, the bundled version will **not** overwrite it
- Large modules (with "compendium" or "jb2a" in their name) are automatically excluded from local packaging currently, and local zipping may still take a very long while to finish. See the console for info.
- At the moment there are no loading screens or progress indicators. The bundling process may take some time for larger bundles. Be patient and eventually the dialogue should show back up with the results.

## Features

- **Module Bundle Creation**: Generate a shareable manifest URL containing all your selected modules
- **Intelligent Module Processing**: Automatically determines which modules are publicly available and finds the exact same version (or one verified to be equivalent)
- **Selective Module Inclusion**: Choose between bundling all installed modules or just active ones
- **Local Module Downloading**: For modules that can't be found online, download them as a zip package
- **Dependency Management**: Automatically ensures dependencies are valid in the bundle


## Usage

1. Click the box button added in the token scene controls.
2. Choose all or active modules, And click prepare bundle.
3. After the bundle has been created by the server, a dialogue will show up detailing the results and providing the manifest link.
4. Use the provided manifest link to install the bundle in foundry. For large bundles this will take some time to display the auto install screen.
5. Only install the dependencies of the bundle. Do not allow foundry to auto install other dependencies as their versions may be different.

## Installation


### Method 1: Manual Installation

1. Download the latest release from [Releases](https://github.com/yourusername/foundry-module-bundler/releases)
2. Extract the zip file
3. Move the extracted folder to your Foundry `Data/modules/` directory
4. Restart Foundry and enable the module

## Usage

1. Go to the Foundry setup or game and enable the Module Bundler module
2. Click the "Create Module Bundle" button in the module settings
3. Choose whether to include all modules or just active ones
4. Wait for the module to analyze your modules and prepare the bundle
5. Copy the generated manifest URL to share with others
6. Optionally download any modules that couldn't be found online

### Method 2: Building From Source

If you want to build the module from source:

1. Clone this repository
2. Install dependencies with:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Build the module with:
   ```bash
   npm run build
   # or
   pnpm build
   ```
4. For development with auto-reload:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

The `dev` command will automatically try to place the built module into your Foundry VTT modules directory for immediate testing.

## Alpha Status

⚠️ **This module is currently in ALPHA status.**

- Expect bugs and unfinished features
- Some modules may not be handled correctly in this early version
- Please [report issues](https://github.com/yourusername/foundry-module-bundler/issues) you encounter
- Use at your own risk

## Future Plans

This will be a large project, and and there are many things to consider. I believe this utility has great potential, but there are inherant risks involved with enabling (and therefore encouraging) quickly and completely changing your worlds. As such I want this project to be ready for those kinds of risks before allowing anyone but testers to use the system.

The current plans for the final product include:
- A dedicated website with comprehensive pages for each bundle and **many** warnings
- Trusted verification of bundles by admins and moderators
- In-Foundry and on-website bug reporting (so bundle bugs are seperate to the modules included)
- Integrated forums
- Statistics and analytics for popular module combinations (when we get there)

## Troubleshooting

- If module bundling fails to get a module you believe it should have, wait a few minutes and try again. If any public non-premium module is still missed please open an issue with the copied and pasted missing modules.
- Some modules with unusual file structures may not zip correctly.
- Large modules may timeout during processing and will be entirely or partially skipped when zipping.