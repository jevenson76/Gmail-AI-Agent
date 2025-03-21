import React, { useEffect, useState } from 'react';
import { Command, KeySquare, X } from 'lucide-react';

interface ShortcutAction {
  description: string;
  key: string;
  modifier?: string;
}

interface KeyboardShortcutsProps {
  onShortcut: (action: string) => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onShortcut }) => {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Keyboard shortcut definitions
  const shortcutCategories = [
    {
      title: 'Navigation',
      shortcuts: [
        { description: 'Go to Inbox', key: 'i', modifier: '' },
        { description: 'Go to Drafts', key: 'd', modifier: '' },
        { description: 'Go to Archived', key: 'a', modifier: '' },
        { description: 'Go to Trash', key: 't', modifier: '' },
      ]
    },
    {
      title: 'Actions',
      shortcuts: [
        { description: 'Process new emails', key: 'p', modifier: '' },
        { description: 'Toggle batch selection', key: 'x', modifier: '' },
        { description: 'Select all visible', key: 'a', modifier: 'Shift' },
        { description: 'Archive selected', key: 'e', modifier: '' },
        { description: 'Delete selected', key: '#', modifier: '' },
        { description: 'Show/hide analytics', key: 'v', modifier: '' },
      ]
    },
    {
      title: 'Email',
      shortcuts: [
        { description: 'Reply to email', key: 'r', modifier: '' },
        { description: 'Forward email', key: 'f', modifier: '' },
        { description: 'Archive current email', key: 'e', modifier: '' },
        { description: 'Close current email', key: 'Escape', modifier: '' },
      ]
    },
    {
      title: 'General',
      shortcuts: [
        { description: 'Show keyboard shortcuts', key: '?', modifier: '' },
        { description: 'Focus search box', key: '/', modifier: '' },
        { description: 'Settings', key: ',', modifier: '' },
      ]
    }
  ];

  // Set up keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Show shortcuts modal on "?"
      if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        setShowShortcutsModal(true);
        return;
      }
      
      // Focus search on "/"
      if (event.key === '/' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          event.preventDefault();
        }
        return;
      }

      // Navigation shortcuts
      if (event.key === 'i' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('inbox');
      } else if (event.key === 'd' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('drafts');
      } else if (event.key === 'a' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('archived');
      } else if (event.key === 't' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('trash');
      }

      // Action shortcuts
      else if (event.key === 'p' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('process');
      } else if (event.key === 'x' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('toggleBatch');
      } else if (event.key === 'a' && event.shiftKey && !event.ctrlKey && !event.altKey) {
        onShortcut('selectAll');
      } else if (event.key === 'e' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('archive');
      } else if (event.key === '#' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('delete');
      } else if (event.key === 'v' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('toggleAnalytics');
      }

      // Email shortcuts
      else if (event.key === 'r' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('reply');
      } else if (event.key === 'f' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('forward');
      } else if (event.key === 'Escape' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('escape');
      } else if (event.key === ',' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        onShortcut('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onShortcut]);

  // Render keyboard shortcut button and modal
  return (
    <>
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="fixed right-4 bottom-4 flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors z-30"
        aria-label="Keyboard shortcuts"
      >
        <KeySquare className="w-5 h-5" />
      </button>

      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Command className="w-5 h-5 mr-2" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcutCategories.map((category, catIndex) => (
                <div key={catIndex} className="space-y-2">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">{category.title}</h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                        <div className="flex items-center space-x-1">
                          {shortcut.modifier && (
                            <>
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded">
                                {shortcut.modifier}
                              </kbd>
                              <span className="text-gray-500">+</span>
                            </>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded">
                            {shortcut.key}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts; 