const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Module to manage Windows auto-start functionality
 */
class AutoStartManager {
  constructor() {
    this.appName = 'Gmail AI Agent';
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from the user data directory
   */
  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    // Default settings
    return {
      autoStart: false
    };
  }

  /**
   * Save settings to the user data directory
   */
  saveSettings() {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Get auto-start status
   */
  isAutoStartEnabled() {
    return this.settings.autoStart === true;
  }

  /**
   * Enable or disable auto-start
   * @param {boolean} enable - Whether to enable auto-start
   */
  setAutoStart(enable) {
    // Update our settings
    this.settings.autoStart = enable === true;
    this.saveSettings();
    
    // Update the system registry/settings
    if (enable) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
        args: []
      });
    } else {
      app.setLoginItemSettings({
        openAtLogin: false
      });
    }
    
    return true;
  }

  /**
   * Initialize auto-start based on saved settings
   */
  initialize() {
    // Set the login item according to the saved setting
    if (this.isAutoStartEnabled()) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
        args: []
      });
    } else {
      app.setLoginItemSettings({
        openAtLogin: false
      });
    }
  }
}

module.exports = new AutoStartManager(); 