/**
 * Electron API wrapper for use in the renderer process
 * This provides type-safe access to electron functionality exposed via contextBridge
 */

// Type definitions for the electron API exposed via preload.js
interface ElectronAPI {
  receive: (channel: string, func: (...args: any[]) => void) => void;
  minimizeToTray: () => Promise<void>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => Promise<boolean>;
  getMinimizeToTray: () => Promise<boolean>;
  setMinimizeToTray: (enable: boolean) => Promise<boolean>;
  openAuthWindow: (authUrl: string) => Promise<boolean>;
  getAppVersion: () => string;
  isElectron: boolean;
}

// Declare the global electron variable
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

/**
 * Check if the app is running in Electron
 */
export const isElectron = (): boolean => {
  return window.electron?.isElectron === true;
};

/**
 * Set up event listeners for electron messages
 * @param handlers Object containing handler functions for electron events
 */
export const setupElectronEvents = (handlers: {
  onProcessEmails?: () => void;
  onAuthCallback?: (url: string) => void;
}) => {
  if (!isElectron()) return;
  
  // Listen for process-emails event
  if (handlers.onProcessEmails) {
    window.electron?.receive('process-emails', () => {
      if (handlers.onProcessEmails) handlers.onProcessEmails();
    });
  }
  
  // Listen for auth-callback event
  if (handlers.onAuthCallback) {
    window.electron?.receive('auth-callback', (url: string) => {
      if (handlers.onAuthCallback) handlers.onAuthCallback(url);
    });
  }
};

/**
 * Minimize the app to system tray
 */
export const minimizeToTray = async (): Promise<void> => {
  if (!isElectron()) return;
  
  try {
    await window.electron?.minimizeToTray();
  } catch (error) {
    console.error('Failed to minimize to tray:', error);
  }
};

/**
 * Get auto start setting
 */
export const getAutoStart = async (): Promise<boolean> => {
  if (!isElectron()) return false;
  
  try {
    return await window.electron?.getAutoStart() || false;
  } catch (error) {
    console.error('Failed to get auto start setting:', error);
    return false;
  }
};

/**
 * Set auto start setting
 */
export const setAutoStart = async (enable: boolean): Promise<boolean> => {
  if (!isElectron()) return false;
  
  try {
    return await window.electron?.setAutoStart(enable) || false;
  } catch (error) {
    console.error('Failed to set auto start setting:', error);
    return false;
  }
};

/**
 * Get minimize to tray setting
 */
export const getMinimizeToTray = async (): Promise<boolean> => {
  if (!isElectron()) return false;
  
  try {
    return await window.electron?.getMinimizeToTray() || false;
  } catch (error) {
    console.error('Failed to get minimize to tray setting:', error);
    return false;
  }
};

/**
 * Set minimize to tray setting
 */
export const setMinimizeToTray = async (enable: boolean): Promise<boolean> => {
  if (!isElectron()) return false;
  
  try {
    return await window.electron?.setMinimizeToTray(enable) || false;
  } catch (error) {
    console.error('Failed to set minimize to tray setting:', error);
    return false;
  }
};

/**
 * Open OAuth authentication window
 */
export const openAuthWindow = async (authUrl: string): Promise<boolean> => {
  if (!isElectron()) return false;
  
  try {
    return await window.electron?.openAuthWindow(authUrl) || false;
  } catch (error) {
    console.error('Failed to open auth window:', error);
    return false;
  }
};

/**
 * Get app version
 */
export const getAppVersion = (): string => {
  if (!isElectron()) return '1.0.0';
  
  try {
    return window.electron?.getAppVersion() || '1.0.0';
  } catch (error) {
    console.error('Failed to get app version:', error);
    return '1.0.0';
  }
};

/**
 * Extract auth code from OAuth callback URL
 */
export const extractAuthCode = (callbackUrl: string): string | null => {
  try {
    const url = new URL(callbackUrl);
    return url.searchParams.get('code');
  } catch (error) {
    console.error('Failed to extract auth code from URL:', error);
    return null;
  }
}; 