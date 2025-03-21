const { app, BrowserWindow, Menu, Tray, ipcMain, shell, session } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const autoStart = require('./autoStart');
const OAuthHandler = require('./oauth-handler');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let tray = null;
let forceQuit = false;
let oauthHandler = null;

// Check if we should minimize to tray instead of quitting
const shouldMinimizeToTray = () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  let minimizeToTray = false;
  
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      minimizeToTray = settings.minimizeToTray === true;
    }
  } catch (error) {
    console.error('Error reading settings for minimize to tray:', error);
  }
  
  return minimizeToTray;
};

// Create the browser window
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    show: false // Don't show until loaded
  });

  // Remove the menu bar
  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '..', 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  // Handle close event - minimize to tray if enabled
  mainWindow.on('close', (event) => {
    if (!forceQuit && shouldMinimizeToTray()) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
  
  // Initialize the OAuth handler
  oauthHandler = new OAuthHandler(mainWindow);
};

// Create system tray icon
const createTray = () => {
  tray = new Tray(path.join(__dirname, '..', 'public', 'favicon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Gmail AI Agent', 
      click: () => mainWindow.show() 
    },
    { 
      label: 'Process New Emails', 
      click: () => mainWindow.webContents.send('process-emails') 
    },
    {
      label: 'Start on Boot',
      type: 'checkbox',
      checked: autoStart.isAutoStartEnabled(),
      click: (menuItem) => {
        autoStart.setAutoStart(menuItem.checked);
      }
    },
    { 
      type: 'separator' 
    },
    { 
      label: 'Quit', 
      click: () => {
        forceQuit = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Gmail AI Agent');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
};

// Register app protocol before app is ready
app.setAsDefaultProtocolClient('app');

// Handle OAuth URLs on Windows
if (process.platform === 'win32') {
  // Get the login item settings to determine if we were launched with a URL
  const args = process.argv.slice(1);
  const oauthUrlArg = args.find(arg => arg.startsWith('app://gmail-ai-agent'));
  
  if (oauthUrlArg) {
    // Wait for app to be ready before handling this
    app.whenReady().then(() => {
      if (oauthHandler) {
        oauthHandler.handleCallback(oauthUrlArg);
      }
    });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Initialize auto-start
  autoStart.initialize();
  
  createWindow();
  createTray();
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // Handle deep linking (OAuth callbacks)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (oauthHandler) {
      oauthHandler.handleCallback(url);
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC messages from renderer
ipcMain.handle('minimize-to-tray', () => {
  mainWindow.hide();
});

ipcMain.handle('get-auto-start', () => {
  return autoStart.isAutoStartEnabled();
});

ipcMain.handle('set-auto-start', (event, enable) => {
  return autoStart.setAutoStart(enable);
});

ipcMain.handle('get-minimize-to-tray', () => {
  return shouldMinimizeToTray();
});

ipcMain.handle('set-minimize-to-tray', (event, enable) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    let settings = {};
    
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    settings.minimizeToTray = enable === true;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving minimize to tray setting:', error);
    return false;
  }
});

ipcMain.handle('open-auth-window', (event, authUrl) => {
  if (oauthHandler) {
    oauthHandler.openAuthWindow(authUrl);
    return true;
  }
  return false;
});

// Before app quits
app.on('before-quit', () => {
  forceQuit = true;
}); 