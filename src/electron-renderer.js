// Initialize Electron-specific features for the renderer process

// Check if we're running in Electron
export const isElectron = () => {
  return window?.electron?.isElectron === true;
};

// Setup IPC listeners for Electron events
export const setupElectronEvents = (onProcessEmails, onAuthCallback) => {
  if (!isElectron()) return;
  
  // Listen for "process-emails" event from main process
  window.electron.receive('process-emails', () => {
    console.log('Received process-emails event from main process');
    if (typeof onProcessEmails === 'function') {
      onProcessEmails();
    }
  });
  
  // Listen for auth callback events
  window.electron.receive('auth-callback', (callbackUrl) => {
    console.log('Received auth-callback event from main process');
    if (typeof onAuthCallback === 'function') {
      onAuthCallback(callbackUrl);
    }
  });
};

// Minimize to system tray
export const minimizeToTray = () => {
  if (!isElectron()) return;
  
  window.electron.minimizeToTray();
};

// Get app version from Electron
export const getAppVersion = () => {
  if (!isElectron()) return '1.0.0';
  
  return window.electron.getAppVersion();
};

// Get auto-start setting
export const getAutoStart = async () => {
  if (!isElectron()) return false;
  
  return await window.electron.getAutoStart();
};

// Set auto-start setting
export const setAutoStart = async (enable) => {
  if (!isElectron()) return false;
  
  return await window.electron.setAutoStart(enable);
};

// Get minimize-to-tray setting
export const getMinimizeToTray = async () => {
  if (!isElectron()) return false;
  
  return await window.electron.getMinimizeToTray();
};

// Set minimize-to-tray setting
export const setMinimizeToTray = async (enable) => {
  if (!isElectron()) return false;
  
  return await window.electron.setMinimizeToTray(enable);
};

// Open OAuth authentication window
export const openAuthWindow = async (authUrl) => {
  if (!isElectron()) return false;
  
  return await window.electron.openAuthWindow(authUrl);
}; 