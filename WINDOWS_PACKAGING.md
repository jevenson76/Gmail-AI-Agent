# Windows Packaging Guide for Gmail AI Agent

This guide walks you through the process of packaging the Gmail AI Agent as a native Windows application.

## Prerequisites

1. Node.js (v16+) and npm installed
2. Windows 10 or 11 operating system for building Windows packages
3. Git installed (optional, for cloning the repository)

## Setup

1. Clone or download the repository:
   ```bash
   git clone https://github.com/yourusername/gmail-ai-agent.git
   cd gmail-ai-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration (or run the setup script):
   ```bash
   npm run setup
   ```

## Development Testing

To test the Electron app in development mode:

```bash
npm run dev:electron
```

This will start the application in development mode with hot reloading enabled.

## Building the Windows Application

### Option 1: Build Both Installer and Portable Versions

To build both the installer (.exe) and portable versions:

```bash
npm run build:win
```

This will create:
- An NSIS installer (.exe) that users can run to install the app
- A portable version (.exe) that can run without installation

### Option 2: Build Only the Portable Version

If you just want a standalone executable that doesn't require installation:

```bash
npm run build:win-portable
```

### Option 3: Build Only the Installer

If you just want an installer package:

```bash
npm run build:win-installer
```

## Output Files

After building, you'll find the output in the `release` folder:

- **Installer**: `release/Gmail AI Agent Setup x.x.x.exe`
- **Portable**: `release/GmailAIAgent-Portable-x.x.x.exe`

Where `x.x.x` is the version number defined in your `package.json`.

## Customizing the Build

You can customize various aspects of the build by editing these files:

1. **electron-builder.json** - Controls packaging options, installer behavior, etc.
2. **package.json** - Application metadata and version
3. **electron/main.js** - Main process logic for the Electron app

## Distribution

### Installer Distribution

The NSIS installer includes:
- Desktop shortcut (optional during installation)
- Start menu shortcut (optional during installation)
- Uninstaller
- Application icon

### Portable App Distribution

The portable version:
- Can be run from any location, including USB drives
- Doesn't modify the Windows registry
- Doesn't require administrative privileges

## Troubleshooting

### Common Issues

1. **Build fails with node-gyp errors**:
   - Ensure you have the necessary build tools installed:
   ```bash
   npm install --global --production windows-build-tools
   ```

2. **Application crashes on startup**:
   - Check your .env configuration
   - Verify all dependencies are correctly installed

3. **Google OAuth doesn't work**:
   - Make sure your Google OAuth credentials are correctly configured
   - Add `app://gmail-ai-agent` to your authorized JavaScript origins in Google Cloud Console

### Getting Logs

When running the packaged application, logs are stored in:
- `%APPDATA%\Gmail AI Agent\logs\main.log` (for installed app)
- Same directory as the portable executable (for portable app)

## Security Notes

1. The `.env` file is bundled with the application. Make sure your application's security model takes this into account.

2. Consider using secure storage techniques for sensitive tokens in a production environment.

3. The Google OAuth credentials used should have appropriate restrictions in the Google Cloud Console.

## Further Customizations

### Auto Updates

To enable auto-updates, you would need to:

1. Set up a GitHub repository or other server to host updates
2. Configure `electron-builder.json` with your update server details
3. Implement update checking logic in `electron/main.js`

### System Tray Behavior

The app minimizes to the system tray by default. You can modify this behavior in `electron/main.js`.

### Startup on Boot

To add an option to start the app on Windows boot:

1. Add a checkbox in settings
2. Use the Windows registry to set the auto-start entry when enabled

## Need Help?

If you encounter any issues with the Windows packaging process, please:

1. Check the Electron and electron-builder documentation
2. Open an issue in the GitHub repository
3. Check existing issues for similar problems and solutions 