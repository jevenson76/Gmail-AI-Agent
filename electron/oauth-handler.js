const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const url = require('url');

/**
 * OAuth handler for Electron applications
 */
class OAuthHandler {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.authWindow = null;
    
    // Register app:// protocol for OAuth callbacks
    this.registerProtocol();
    
    // Cleanup on app quit
    app.on('will-quit', () => {
      if (this.authWindow && !this.authWindow.isDestroyed()) {
        this.authWindow.close();
      }
    });
  }
  
  /**
   * Register the custom app:// protocol for handling OAuth redirects
   */
  registerProtocol() {
    if (app.isReady()) {
      this._doRegisterProtocol();
    } else {
      app.whenReady().then(() => this._doRegisterProtocol());
    }
  }
  
  _doRegisterProtocol() {
    // Register the app:// protocol
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = request.url.substring(6); // Remove 'app://'
      callback({ path: path.normalize(`${__dirname}/../dist/${url}`) });
    });
    
    // Handle the Gmail callback
    const handleGmailCallback = (request) => {
      // Extract the URL path and query
      const parsedUrl = new URL(request.url);
      const pathname = parsedUrl.pathname;
      
      // Check if this is the OAuth callback path
      if (pathname === '/auth/callback/google') {
        // Close the auth window
        if (this.authWindow && !this.authWindow.isDestroyed()) {
          this.authWindow.close();
          this.authWindow = null;
        }
        
        // Send the URL to the main window to handle the auth code
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('auth-callback', request.url);
          
          // Focus the main window
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore();
          }
          this.mainWindow.focus();
          
          // Navigate to the callback URL in the main window
          this.mainWindow.loadURL(request.url);
        }
        
        return true;
      }
      
      return false;
    };
    
    // Register the handler for app:// protocol
    app.on('open-url', (event, url) => {
      event.preventDefault();
      if (url.startsWith('app://gmail-ai-agent')) {
        handleGmailCallback({ url });
      }
    });
  }
  
  /**
   * Open a popup window for OAuth authentication
   * @param {string} authUrl - The OAuth URL to navigate to
   */
  openAuthWindow(authUrl) {
    // Close existing auth window if any
    if (this.authWindow && !this.authWindow.isDestroyed()) {
      this.authWindow.close();
    }
    
    // Create a new window for authentication
    this.authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: true,
      parent: this.mainWindow,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Load the auth URL
    this.authWindow.loadURL(authUrl);
    
    // Handle window close
    this.authWindow.on('closed', () => {
      this.authWindow = null;
    });
    
    // Handle navigation events
    this.authWindow.webContents.on('will-navigate', (event, newUrl) => {
      this.handleCallback(newUrl);
    });
    
    this.authWindow.webContents.on('will-redirect', (event, newUrl) => {
      this.handleCallback(newUrl);
    });
  }
  
  /**
   * Handle OAuth callback URLs
   * @param {string} callbackUrl - The callback URL to handle
   */
  handleCallback(callbackUrl) {
    if (callbackUrl.startsWith('app://gmail-ai-agent/auth/callback/google')) {
      // Close the auth window
      if (this.authWindow && !this.authWindow.isDestroyed()) {
        this.authWindow.close();
        this.authWindow = null;
      }
      
      // Send the URL to the main window
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        // Navigate to the callback URL in the main window
        this.mainWindow.loadURL(callbackUrl);
      }
    }
  }
}

module.exports = OAuthHandler; 