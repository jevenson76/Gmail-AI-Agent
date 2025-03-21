import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, RefreshCw, X, FileWarning, RotateCcw, Bot } from 'lucide-react';
import { getLocalLLMClient, OllamaClient } from '../lib/ollama';
import { isElectron, getAutoStart, setAutoStart, getMinimizeToTray, setMinimizeToTray } from '../electron-renderer';

interface Credentials {
  googleClientId: string;
  smartleadApiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  useLocalLLM: boolean;
  localLLMModel: string;
  archiveAfterProcessing: boolean;
}

// Settings interface
interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  currentSettings: AppSettings;
}

// Application settings
export interface AppSettings {
  useLocalLLM: boolean;
  localLLMModel: string;
  localLLMUrl: string;
  archiveAfterProcessing: boolean;
  darkMode: boolean;
  refreshInterval: number;
  isDesktopApp: boolean;
  autoStartEnabled?: boolean;
  minimizeToTray?: boolean;
}

// Default settings
export const defaultSettings: AppSettings = {
  useLocalLLM: false,
  localLLMModel: 'llama3',
  localLLMUrl: 'http://localhost:11434',
  archiveAfterProcessing: true,
  darkMode: false,
  refreshInterval: 5,
  isDesktopApp: false,
  autoStartEnabled: false,
  minimizeToTray: false,
};

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [ollama, setOllama] = useState<{
    available: boolean;
    models: string[];
    loading: boolean;
    error: string | null;
  }>({
    available: false,
    models: [],
    loading: true,
    error: null,
  });
  const [isDesktopApplication, setIsDesktopApplication] = useState(false);

  // Check Ollama availability and get models
  useEffect(() => {
    if (isOpen && settings.useLocalLLM) {
      checkOllamaAvailability();
    }
  }, [isOpen, settings.useLocalLLM]);

  useEffect(() => {
    // Check if we're running as a desktop app
    const desktopApp = isElectron();
    setIsDesktopApplication(desktopApp);

    // If we're a desktop app, get the settings
    if (desktopApp) {
      getAutoStart().then(enabled => {
        setSettings(prev => ({ ...prev, autoStartEnabled: enabled }));
      });
      
      getMinimizeToTray().then(enabled => {
        setSettings(prev => ({ ...prev, minimizeToTray: enabled }));
      });
    }
  }, []);

  const checkOllamaAvailability = async () => {
    setOllama(prev => ({ ...prev, loading: true, error: null }));
    try {
      const client = OllamaClient.getInstance({
        model: settings.localLLMModel,
        baseUrl: settings.localLLMUrl,
      });
      
      const available = await client.isAvailable();
      setOllama(prev => ({ 
        ...prev, 
        available, 
        loading: false,
        error: available ? null : 'Ollama server is not available at the specified URL'
      }));
      
      // If available, fetch models in the background
      if (available) {
        fetchOllamaModels();
      }
    } catch (error) {
      setOllama({
        available: false,
        models: [],
        loading: false,
        error: `Error connecting to Ollama: ${(error as Error).message}`,
      });
    }
  };

  const fetchOllamaModels = async () => {
    try {
      // This would typically call an API endpoint that returns available models
      // For now, we'll hardcode some common models
      setOllama(prev => ({ 
        ...prev, 
        models: ['llama3', 'llama2', 'mistral', 'gemma', 'phi', 'neural-chat'],
      }));
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({ ...prev, [name]: checked }));

      if (name === 'autoStartEnabled') {
        // Update the auto-start setting in Electron
        if (isDesktopApplication) {
          setAutoStart(checked);
        }
      } else if (name === 'minimizeToTray') {
        // Update the minimize-to-tray setting in Electron
        if (isDesktopApplication) {
          setMinimizeToTray(checked);
        }
      }
    } else if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full animate-slide-in-from-top">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Local LLM Settings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Local LLM Integration
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useLocalLLM"
                    name="useLocalLLM"
                    checked={settings.useLocalLLM}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useLocalLLM" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Use Local LLM for Email Analysis
                  </label>
                </div>
                
                {settings.useLocalLLM && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="localLLMUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ollama Server URL
                        </label>
                        <input
                          type="text"
                          id="localLLMUrl"
                          name="localLLMUrl"
                          value={settings.localLLMUrl}
                          onChange={handleChange}
                          placeholder="http://localhost:11434"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="localLLMModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Model
                        </label>
                        <select
                          id="localLLMModel"
                          name="localLLMModel"
                          value={settings.localLLMModel}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        >
                          {ollama.models.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                          {!ollama.models.includes(settings.localLLMModel) && (
                            <option value={settings.localLLMModel}>{settings.localLLMModel}</option>
                          )}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={checkOllamaAvailability}
                        disabled={ollama.loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {ollama.loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Testing Connection...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Test Connection
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Status display */}
                    {settings.useLocalLLM && !ollama.loading && (
                      <div className={`mt-2 p-2 rounded ${
                        ollama.available 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                          : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}>
                        {ollama.available ? (
                          <div className="flex items-center">
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                            <span>Ollama server is available</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <FileWarning className="flex-shrink-0 h-4 w-4 mr-2" />
                            <span>{ollama.error || 'Ollama server is not available'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Email Processing Settings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Email Processing
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="archiveAfterProcessing"
                    name="archiveAfterProcessing"
                    checked={settings.archiveAfterProcessing}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="archiveAfterProcessing" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Archive emails after processing
                  </label>
                </div>
                
                <div>
                  <label htmlFor="refreshInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Check for new emails every (minutes)
                  </label>
                  <input
                    type="number"
                    id="refreshInterval"
                    name="refreshInterval"
                    min="1"
                    max="60"
                    value={settings.refreshInterval}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Interface Settings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Interface
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="darkMode"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="darkMode" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Dark Mode
                  </label>
                </div>
              </div>
            </div>

            {isDesktopApplication && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Desktop App Settings</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">
                      Start on Windows boot
                    </label>
                    <input
                      type="checkbox"
                      name="autoStartEnabled"
                      checked={settings.autoStartEnabled || false}
                      onChange={handleChange}
                      className="toggle"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">
                      Minimize to tray on close
                    </label>
                    <input
                      type="checkbox"
                      name="minimizeToTray"
                      checked={settings.minimizeToTray || false}
                      onChange={handleChange}
                      className="toggle"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;