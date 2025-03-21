import React, { useState, useEffect } from 'react';
import { Mail, Inbox, Archive, Trash2, Settings as SettingsIcon, Bot, Loader, Edit, Send, AlertTriangle, BarChart, Loader2, PenSquare, Search, Trash } from 'lucide-react';
import { supabase, getDraftEmails, deleteDraftEmail } from '../lib/supabase';
import { EmailProcessor } from '../services/emailProcessor';
import { GmailAPI } from '../api/gmail';
import { format } from 'date-fns';
import { useGoogleLogin } from '@react-oauth/google';
import { useToast } from './ToastNotification';
import { EmailDetail } from './EmailDetail';
import SearchAndFilter, { SearchOptions } from './SearchAndFilter';
import EmailAnalytics from './EmailAnalytics';
import { formatErrorMessage, isAuthError, withErrorHandling } from '../utils/error';
import KeyboardShortcuts from './KeyboardShortcuts';
import Settings, { AppSettings, defaultSettings } from './Settings';
import { isElectron, setupElectronEvents, minimizeToTray } from '../electron-renderer';

interface DashboardProps {
  onSettingsClick: () => void;
}

// Component for email skeleton loading state
const EmailSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm p-4 border border-gray-100 dark:border-gray-700 animate-pulse transform transition-all duration-300">
    <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
      <div className="w-full sm:w-3/4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-2 sm:mt-0"></div>
    </div>
    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="flex flex-wrap gap-2 mb-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    </div>
    <div className="border-t pt-2 mt-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
      <div className="flex flex-wrap gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </div>
  </div>
);

// Component for draft skeleton loading state
const DraftSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm p-4 border border-gray-100 dark:border-gray-700 animate-pulse transform transition-all duration-300">
    <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
      <div className="w-full sm:w-3/4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-2 sm:mt-0"></div>
    </div>
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="flex justify-end space-x-2">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
    </div>
  </div>
);

function Dashboard({ onSettingsClick }: DashboardProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    searchTerm: '',
    categories: [],
    importance: [],
    dateRange: { from: null, to: null },
    hasLabel: null,
    hasDraft: null,
    isArchived: null
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [batchSelectionEnabled, setBatchSelectionEnabled] = useState(false);

  // Get user session
  const [userId, setUserId] = useState<string | null>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('gmail_access_token');
    if (token) {
      setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'drafts') {
      fetchDrafts();
    } else {
      fetchEmails();
    }
  }, [activeTab]);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    await withErrorHandling(async () => {
      let query = supabase
        .from('email_metadata')
        .select('*')
        .order('received_at', { ascending: false });
      
      // Apply tab filters first
      if (activeTab === 'archived') {
        query = query.eq('archived', true);
      } else if (activeTab === 'inbox') {
        query = query.eq('archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
      applySearchFilters(data || []);
    }, (error) => {
      setError(formatErrorMessage(error));
      showToast(formatErrorMessage(error), 'error');
    });
    
    setLoading(false);
  };

  // Apply search filters to emails
  const applySearchFilters = (emailsToFilter = emails) => {
    let filtered = [...emailsToFilter];
    const options = searchOptions;
    
    // Apply text search
    if (options.searchTerm) {
      const lowerSearchTerm = options.searchTerm.toLowerCase();
      filtered = filtered.filter(email => 
        (email.subject?.toLowerCase().includes(lowerSearchTerm) || 
        email.sender?.toLowerCase().includes(lowerSearchTerm) || 
        email.ai_summary?.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply category filter
    if (options.categories.length > 0) {
      filtered = filtered.filter(email => 
        email.category && options.categories.includes(email.category)
      );
    }
    
    // Apply importance filter
    if (options.importance.length > 0) {
      filtered = filtered.filter(email => 
        email.importance_score && options.importance.includes(email.importance_score)
      );
    }
    
    // Apply date range filter
    if (options.dateRange.from) {
      const fromDate = new Date(options.dateRange.from);
      filtered = filtered.filter(email => 
        new Date(email.received_at) >= fromDate
      );
    }
    
    if (options.dateRange.to) {
      const toDate = new Date(options.dateRange.to);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(email => 
        new Date(email.received_at) <= toDate
      );
    }
    
    // Apply label filter
    if (options.hasLabel) {
      filtered = filtered.filter(email => 
        email.applied_labels && 
        Array.isArray(email.applied_labels) && 
        email.applied_labels.includes(options.hasLabel)
      );
    }
    
    // Apply draft filter
    if (options.hasDraft !== null) {
      filtered = filtered.filter(email => 
        email.has_draft === options.hasDraft
      );
    }
    
    // Apply archived filter
    if (options.isArchived !== null) {
      filtered = filtered.filter(email => 
        email.archived === options.isArchived
      );
    }
    
    setFilteredEmails(filtered);
  };

  // Handle search options change
  const handleSearchChange = (newOptions: SearchOptions) => {
    setSearchOptions(newOptions);
    applySearchFilters();
  };

  useEffect(() => {
    applySearchFilters();
  }, [searchOptions]);

  // Batch selection handlers
  const toggleBatchSelection = () => {
    setBatchSelectionEnabled(!batchSelectionEnabled);
    setSelectedEmails([]);
  };

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId) 
        : [...prev, emailId]
    );
  };

  const selectAllVisible = () => {
    setSelectedEmails(filteredEmails.map((email: any) => email.id));
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };

  // Batch actions
  const batchArchive = async () => {
    if (!accessToken || selectedEmails.length === 0) return;
    
    showToast(`Archiving ${selectedEmails.length} emails...`, 'info');
    
    try {
      const gmailApi = GmailAPI.getInstance(accessToken);
      
      // Archive emails in Gmail
      for (const emailId of selectedEmails) {
        await gmailApi.archiveEmail(emailId);
      }
      
      // Update in Supabase
      if (supabase) {
        await supabase
          .from('email_metadata')
          .update({ archived: true })
          .in('id', selectedEmails);
          
        // Update local state
        setEmails(emails.map((email: any) => 
          selectedEmails.includes(email.id) ? { ...email, archived: true } : email
        ));
        
        showToast('Emails archived successfully!', 'success');
        setSelectedEmails([]);
        setBatchSelectionEnabled(false);
        fetchEmails(); // Refresh the list
      }
    } catch (error) {
      console.error('Error archiving emails:', error);
      showToast('Failed to archive emails', 'error');
    }
  };

  const batchDelete = async () => {
    if (!accessToken || selectedEmails.length === 0) return;
    
    showToast(`Moving ${selectedEmails.length} emails to trash...`, 'info');
    
    try {
      const gmailApi = GmailAPI.getInstance(accessToken);
      
      // Trash emails in Gmail
      for (const emailId of selectedEmails) {
        await gmailApi.trashEmail(emailId);
      }
      
      // Update in Supabase
      if (supabase) {
        await supabase
          .from('email_metadata')
          .update({ archived: true, trashed: true })
          .in('id', selectedEmails);
          
        // Update local state
        setEmails(emails.filter((email: any) => !selectedEmails.includes(email.id)));
        
        showToast('Emails moved to trash successfully!', 'success');
        setSelectedEmails([]);
        setBatchSelectionEnabled(false);
        fetchEmails(); // Refresh the list
      }
    } catch (error) {
      console.error('Error trashing emails:', error);
      showToast('Failed to move emails to trash', 'error');
    }
  };

  const processNewEmails = async () => {
    if (!userId) {
      setError('Please log in to process emails');
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      const token = accessToken || (await getGoogleAccessToken());
      if (!token) {
        throw new Error('Failed to get Google access token');
      }
      
      setAccessToken(token);
      sessionStorage.setItem('gmail_access_token', token);
      
      const emailProcessor = new EmailProcessor(token);
      await emailProcessor.processNewEmails(userId);
      await fetchEmails(); // Refresh the email list
    } catch (error) {
      console.error('Error processing emails:', error);
      setError('Failed to process new emails. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const sendDraft = async (draftId: string) => {
    if (!accessToken) {
      setError('Please log in to send drafts');
      return;
    }

    try {
      const gmailApi = GmailAPI.getInstance(accessToken);
      await gmailApi.sendDraft(draftId);
      await deleteDraftEmail(draftId);
      await fetchDrafts(); // Refresh the drafts list
    } catch (error) {
      console.error('Error sending draft:', error);
      setError('Failed to send draft. Please try again.');
    }
  };

  const getGoogleAccessToken = useGoogleLogin({
    onSuccess: tokenResponse => {
      return tokenResponse.access_token;
    },
    onError: () => {
      setError('Failed to get Google access token');
      throw new Error('Google authentication failed');
    },
    scope: 'https://www.googleapis.com/auth/gmail.modify',
    flow: 'implicit'
  });

  const handleOpenEmail = (email: any) => {
    if (batchSelectionEnabled) {
      toggleEmailSelection(email.id);
    } else {
      setSelectedEmail(email);
    }
  };

  const archiveEmail = async (emailId: string) => {
    if (!accessToken) {
      showToast('Please log in to archive emails', 'error');
      return;
    }

    try {
      const gmailApi = GmailAPI.getInstance(accessToken);
      await gmailApi.archiveEmail(emailId);
      
      // Update local state
      setEmails(emails.map((email: any) => 
        email.id === emailId ? { ...email, archived: true } : email
      ));
      
      // Update in database
      await supabase
        .from('email_metadata')
        .update({ archived: true })
        .eq('id', emailId);
        
      showToast('Email archived successfully!', 'success');
      setSelectedEmail(null);
      fetchEmails(); // Refresh the list
    } catch (error) {
      showToast('Failed to archive email', 'error');
      setError(formatErrorMessage(error));
    }
  };

  // Handle keyboard shortcuts
  const handleShortcut = (action: string) => {
    switch(action) {
      case 'inbox':
        setActiveTab('inbox');
        break;
      case 'drafts':
        setActiveTab('drafts');
        break;
      case 'archived':
        setActiveTab('archived');
        break;
      case 'trash':
        setActiveTab('trash');
        break;
      case 'process':
        fetchEmails();
        break;
      case 'toggleAnalytics':
        if (activeTab !== 'drafts') {
          setShowAnalytics(prev => !prev);
        }
        break;
      case 'toggleBatch':
        setBatchSelectionEnabled(prev => !prev);
        setSelectedEmails([]);
        break;
      case 'selectAll':
        if (batchSelectionEnabled) {
          if (activeTab === 'inbox') {
            setSelectedEmails(emails.map(email => email.id));
          } else if (activeTab === 'archived') {
            setSelectedEmails(emails.filter(email => email.archived).map(email => email.id));
          } else if (activeTab === 'trash') {
            setSelectedEmails(emails.filter(email => email.trashed).map(email => email.id));
          }
        }
        break;
      case 'archive':
        // Handle archiving selected emails
        if (selectedEmails.length > 0) {
          batchArchive();
        }
        break;
      case 'delete':
        // Handle deleting selected emails
        if (selectedEmails.length > 0) {
          batchDelete();
        }
        break;
      case 'reply':
        // Handle reply to selected email
        console.log('Reply to email');
        break;
      case 'forward':
        // Handle forward selected email
        console.log('Forward email');
        break;
      case 'escape':
        // Close any open modal or selection
        setBatchSelectionEnabled(false);
        setSelectedEmails([]);
        break;
      case 'settings':
        setShowSettings(true);
        break;
    }
  };

  // Modify the sidebar to include selected counts when batch selection is enabled
  const renderSidebarItem = (
    icon: React.ReactNode,
    label: string,
    tabName: string,
    count?: number
  ) => {
    const selected = activeTab === tabName;
    const selectedCount = 
      tabName === 'inbox' 
        ? selectedEmails.filter(id => emails.some(email => email.id === id)).length 
        : tabName === 'archived'
          ? selectedEmails.filter(id => emails.some(email => email.archived && email.id === id)).length
          : tabName === 'trash'
            ? selectedEmails.filter(id => emails.some(email => email.trashed && email.id === id)).length
            : 0;
            
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center justify-between w-full px-4 py-2 rounded-md transition-colors ${
          selected
            ? 'bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
        {(count !== undefined || (batchSelectionEnabled && selectedCount > 0)) && (
          <div className="flex items-center space-x-2">
            {batchSelectionEnabled && selectedCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                {selectedCount} selected
              </span>
            )}
            {count !== undefined && count > 0 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                {count}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };
  
  // Update the email list to include selection checkboxes when batch mode is enabled
  const renderEmailList = (emailsToRender: any[]) => {
    if (emailsToRender.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No emails found</p>
        </div>
      );
    }

    return emailsToRender.map((email) => (
      <div
        key={email.id}
        className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors animate-fade-in ${
          selectedEmails.includes(email.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <div className="flex items-start">
          {batchSelectionEnabled && (
            <div className="mr-3 pt-1">
              <input 
                type="checkbox" 
                checked={selectedEmails.includes(email.id)}
                onChange={() => toggleEmailSelection(email.id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Email content */}
            <div className="flex justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {email.from || "Unknown Sender"}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {email.date || "Unknown Date"}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
              {email.subject || "No subject"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {email.summary || email.snippet || "No content"}
            </p>
            
            {/* Labels */}
            {email.labels && email.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {email.labels.map((label: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Category & Importance */}
            <div className="flex items-center mt-2 space-x-2">
              {email.category && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  {email.category}
                </span>
              )}
              {email.importance && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  Importance: {email.importance}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  };
  
  // Add batch actions toolbar when batch selection is enabled and emails are selected
  const renderBatchActionsToolbar = () => {
    if (!batchSelectionEnabled || selectedEmails.length === 0) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between animate-slide-in-from-top">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-4">
            {selectedEmails.length} selected
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleShortcut('archive')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Archive selected"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleShortcut('delete')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Delete selected"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setBatchSelectionEnabled(false)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    );
  };

  // Handle settings updates
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Apply dark mode setting if changed
    if (newSettings.darkMode !== settings.darkMode) {
      if (newSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Re-initialize the email processor with new settings
    initializeEmailProcessor();
  };
  
  // Initialize email processor with current settings
  const initializeEmailProcessor = () => {
    if (!accessToken) return;
    
    const gmailApi = GmailAPI.getInstance(accessToken);
    const agentOptions = {
      archiveAfterProcessing: settings.archiveAfterProcessing,
      useLocalLLM: settings.useLocalLLM
    };
    
    emailProcessor = new EmailProcessor(gmailApi, agentOptions);
  };
  
  // Apply dark mode on initial load
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    // Setup electron events if running in Electron
    if (isElectron()) {
      // Integrate with Electron - listen for process-emails event
      setupElectronEvents(() => {
        processNewEmails();
      });
      
      // Add minimize to tray button to sidebar if in Electron
      const sidebarItems = document.querySelector('.sidebar-items');
      if (sidebarItems) {
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-700';
        minimizeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path><line x1="18" x2="12" y1="9" y2="15"></line><line x1="12" x2="18" y1="9" y2="15"></line></svg>Minimize to Tray';
        minimizeBtn.onclick = () => minimizeToTray();
        sidebarItems.appendChild(minimizeBtn);
      }
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar for larger screens */}
      <div className="hidden md:block md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-dark-sm transition-all duration-300 ease-in-out">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-bounce" />
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Gmail AI Agent</span>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {renderSidebarItem(<Inbox className="w-5 h-5" />, "Inbox", "inbox")}
          {renderSidebarItem(<Edit className="w-5 h-5" />, "Drafts", "drafts")}
          {renderSidebarItem(<Archive className="w-5 h-5" />, "Archived", "archived")}
          {renderSidebarItem(<Trash2 className="w-5 h-5" />, "Trash", "trash")}
          
          <div className="border-t my-3 border-gray-100 dark:border-gray-700"></div>
          
          <button
            onClick={processNewEmails}
            disabled={processing || !userId}
            className="w-full flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ease-in-out text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:transform hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <Loader className="w-5 h-5 text-gray-500 dark:text-gray-400 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
            <span>{processing ? 'Processing...' : 'Process New Emails'}</span>
          </button>
          
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ease-in-out text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:transform hover:scale-102"
          >
            <SettingsIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
      
      {/* Mobile header with dropdown menu */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-bounce" />
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Gmail AI Agent</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {showMobileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg dark:shadow-dark-lg py-1 z-10 origin-top-right transition-all duration-200 ease-in-out border border-gray-200 dark:border-gray-700 animate-fade-in">
                {renderSidebarItem(<Inbox className="w-4 h-4" />, "Inbox", "inbox")}
                {renderSidebarItem(<Edit className="w-4 h-4" />, "Drafts", "drafts")}
                {renderSidebarItem(<Archive className="w-4 h-4" />, "Archived", "archived")}
                {renderSidebarItem(<Trash2 className="w-4 h-4" />, "Trash", "trash")}
                <div className="border-t my-1 border-gray-100 dark:border-gray-700"></div>
                <button
                  onClick={() => { onSettingsClick(); setShowMobileMenu(false); }}
                  className={`block px-4 py-2 text-sm ${activeTab === 'settings' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'} w-full text-left transition-colors`}
                >
                  <div className="flex items-center space-x-2">
                    <SettingsIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-dark-sm p-4 sticky top-0 md:top-0 z-[5]">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              {batchSelectionEnabled && (
                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                  {selectedEmails.length} selected
                </span>
              )}
            </h1>
            <div className="flex items-center space-x-2">
              {batchSelectionEnabled ? (
                <>
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={selectAllVisible}
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={batchArchive}
                    disabled={selectedEmails.length === 0}
                    className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    onClick={batchDelete}
                    disabled={selectedEmails.length === 0}
                    className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={toggleBatchSelection}
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                activeTab !== 'drafts' && (
                  <>
                    <button
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="hidden sm:flex items-center space-x-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <BarChart className="w-4 h-4 mr-1" />
                      <span>Analytics</span>
                    </button>
                    <button
                      onClick={toggleBatchSelection}
                      className="hidden sm:flex items-center space-x-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>Select</span>
                    </button>
                    <button
                      onClick={processNewEmails}
                      disabled={processing || !userId}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none"
                    >
                      {processing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span className="hidden sm:inline">Processing...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-5 h-5" />
                          <span className="hidden sm:inline">Process New Emails</span>
                          <span className="sm:hidden">Process</span>
                        </>
                      )}
                    </button>
                  </>
                )
              )}
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-2 shadow-sm dark:shadow-dark-sm animate-slide-in-from-top">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p>{error}</p>
                {isAuthError(error) && (
                  <button 
                    onClick={() => {
                      sessionStorage.removeItem('gmail_access_token');
                      window.location.reload();
                    }}
                    className="mt-2 px-3 py-1 bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 text-red-800 dark:text-red-300 rounded-md text-sm transition-colors"
                  >
                    Log out and refresh
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Only show analytics for emails, not drafts */}
          {showAnalytics && activeTab !== 'drafts' && (
            <EmailAnalytics 
              emails={emails}
              loading={loading}
              className="mb-6 animate-fade-in"
            />
          )}

          {/* Only show search for emails, not drafts */}
          {activeTab !== 'drafts' && (
            <div className="mb-4">
              <SearchAndFilter 
                onSearchChange={handleSearchChange}
                className="mb-4"
              />
            </div>
          )}

          {/* Toggle batch selection button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeTab === 'inbox' ? 'Inbox' : 
               activeTab === 'drafts' ? 'Drafts' : 
               activeTab === 'archived' ? 'Archived' :
               activeTab === 'trash' ? 'Trash' : ''}
            </h2>
            <div className="flex items-center space-x-2">
              {activeTab !== 'drafts' && (
                <button
                  onClick={() => setBatchSelectionEnabled(prev => !prev)}
                  className={`p-2 rounded-md transition-colors ${
                    batchSelectionEnabled 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                  title="Toggle batch selection"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="8" height="8" x="3" y="3" rx="1" />
                    <rect width="8" height="8" x="13" y="3" rx="1" />
                    <rect width="8" height="8" x="3" y="13" rx="1" />
                    <rect width="8" height="8" x="13" y="13" rx="1" />
                  </svg>
                </button>
              )}
              
              {/* ... existing analytics toggle button ... */}
            </div>
          </div>
          
          {/* Batch mode actions toolbar */}
          {renderBatchActionsToolbar()}
          
          {loading ? (
            <div className="space-y-4">
              {activeTab === 'drafts' ? (
                // Draft skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                    <DraftSkeleton />
                  </div>
                ))
              ) : (
                // Email skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                    <EmailSkeleton />
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'drafts' ? (
            // Draft emails section
            drafts.length > 0 ? (
              <div className="space-y-4">
                {drafts.map((draft: any, index: number) => (
                  <div 
                    key={draft.id} 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm hover:shadow-md dark:hover:shadow-dark-md transition-all duration-300 p-4 border border-gray-100 dark:border-gray-700 transform hover:-translate-y-1 hover:scale-[1.01] animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{draft.subject}</h3>
                        <p className="text-gray-600 dark:text-gray-400">To: {draft.to}</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                        {format(new Date(draft.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="mb-4 border border-gray-200 dark:border-gray-700 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 max-h-60 overflow-y-auto">
                      <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{draft.body}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => sendDraft(draft.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                      <button
                        onClick={() => deleteDraftEmail(draft.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm p-6 border border-gray-100 dark:border-gray-700 animate-fade-in">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Edit className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-pulse" />
                  <p className="text-lg text-gray-600 dark:text-gray-300">No draft emails</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Process emails to generate draft responses</p>
                </div>
              </div>
            )
          ) : filteredEmails.length > 0 ? (
            // Regular emails section with filtering applied
            <div className="space-y-4">
              {renderEmailList(filteredEmails)}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm p-6 border border-gray-100 dark:border-gray-700 animate-fade-in">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-pulse" />
                {emails.length > 0 ? (
                  <>
                    <p className="text-lg text-gray-600 dark:text-gray-300">No emails match your filters</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search criteria</p>
                    <button
                      onClick={() => setSearchOptions({
                        searchTerm: '',
                        categories: [],
                        importance: [],
                        dateRange: { from: null, to: null },
                        hasLabel: null,
                        hasDraft: null,
                        isArchived: null
                      })}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-gray-600 dark:text-gray-300">No emails found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Process emails to see them here</p>
                    <button
                      onClick={processNewEmails}
                      disabled={processing || !userId}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none"
                    >
                      {processing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Bot className="w-5 h-5 mr-2" />
                          Process Emails
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetail
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onArchive={archiveEmail}
          onDelete={async () => {
            // Implementation for delete function
            showToast('Delete functionality coming soon', 'info');
          }}
          onReply={async () => {
            // Implementation for reply function
            showToast('Reply functionality coming soon', 'info');
          }}
        />
      )}

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentSettings={settings}
      />

      {/* Keyboard Shortcuts component */}
      <KeyboardShortcuts onShortcut={handleShortcut} />
    </div>
  );
}

export default Dashboard;