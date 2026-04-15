# Label Studio Pro - Setup Guide

## Requirements

- **Node.js** v18 or later - Download from [nodejs.org](https://nodejs.org/)
- **Windows** 10 or 11

## Installation

1. Copy the project folder to your machine
2. Open a terminal in the project folder
3. Run `npm install` to install dependencies
4. Generate the tray icon (first time only):
   ```
   node generate-ico.cjs
   ```

## Usage

### Quick Start (recommended)

Double-click **`start.bat`** to:
- Start the server silently in the background
- Show a tray icon in the Windows System Tray
- Automatically open the app in your default browser

### Tray Menu

Left-click or right-click the tray icon to access:
- **Open App** - Open the app in your browser
- **Restart Server** - Restart the dev server
- **Stop & Exit** - Stop the server and remove the tray icon

### Emergency Stop

If the tray icon is unresponsive, double-click **`stop.bat`** to force-kill the server.

### Developer Mode

For development with hot reload and terminal output:
```
npm run dev
```

## Create a Desktop Shortcut

1. Right-click on your Desktop > **New** > **Shortcut**
2. Browse to `start.bat` in the project folder
3. Name it **Label Studio Pro**
4. Right-click the shortcut > **Properties**
5. Click **Change Icon** > Browse to `public/icon.ico` in the project folder
6. Set **Run** to **Minimized**
7. Click **OK**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (terminal mode) |
| `npm run tray` | Start with system tray launcher |
| `npm start` | Same as `npm run tray` |
| `npm run build` | Build for production |
