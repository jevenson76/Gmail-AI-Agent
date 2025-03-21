const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // From main to renderer
  receive: (channel, func) => {
    const validChannels = ['process-emails', 'auth-callback'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // From renderer to main
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  
  // Auto-start settings
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enable) => ipcRenderer.invoke('set-auto-start', enable),
  
  // Minimize to tray settings
  getMinimizeToTray: () => ipcRenderer.invoke('get-minimize-to-tray'),
  setMinimizeToTray: (enable) => ipcRenderer.invoke('set-minimize-to-tray', enable),
  
  // OAuth handling
  openAuthWindow: (authUrl) => ipcRenderer.invoke('open-auth-window', authUrl),
  
  // App version
  getAppVersion: () => process.env.npm_package_version || '1.0.0',
  
  // Is this running in Electron?
  isElectron: true
}); 