import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isElectron, openAuthWindow } from '../electron-renderer';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build the OAuth URL
      const clientId = process.env.GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google Client ID not found');
      }
      
      // Determine redirect URI based on environment
      let redirectUri = window.location.origin + '/auth/callback/google';
      
      // For Electron app, use the app protocol
      const electronApp = isElectron();
      if (electronApp) {
        redirectUri = 'app://gmail-ai-agent/auth/callback/google';
      }
      
      // Required scopes for Gmail access
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',   // Read-only access to Gmail
        'https://www.googleapis.com/auth/gmail.modify',     // Modify Gmail but not delete
        'https://www.googleapis.com/auth/gmail.labels',     // Create, read, update, and delete labels
        'https://www.googleapis.com/auth/userinfo.profile', // Get user profile info
        'https://www.googleapis.com/auth/userinfo.email'    // Get user email
      ];
      
      // Build the authorization URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
      
      // Generate and store state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('oauth_state', state);
      authUrl.searchParams.append('state', state);
      
      // For Electron, use the custom auth window
      if (electronApp) {
        const opened = await openAuthWindow(authUrl.toString());
        if (!opened) {
          throw new Error('Failed to open authentication window');
        }
        // The auth callback will be handled in the main process
      } else {
        // For web, redirect to Google's OAuth page
        window.location.href = authUrl.toString();
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error during login');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gmail AI Agent</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Sign in with your Google account to get started
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="mt-8">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-b-2 border-gray-800 dark:border-white rounded-full"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 186.69 190.5">
                  <g transform="translate(1184.583 765.171)">
                    <path clipPath="none" mask="none" d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z" fill="#4285f4"/>
                    <path clipPath="none" mask="none" d="M-1142.714-651.791l-6.972 5.337-24.679 19.223h0c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.34-39.226z" fill="#34a853"/>
                    <path clipPath="none" mask="none" d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z" fill="#fbbc05"/>
                    <path d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.533-22.514 28.575-39.226 53.34-39.226z" fill="#ea4335" clipPath="none" mask="none"/>
                  </g>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>The Gmail AI Agent needs permission to access and manage your emails.</p>
        </div>
        
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">This application will:</h3>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
            <li>Analyze your emails to categorize by type and importance</li>
            <li>Apply labels to your emails based on their content</li>
            <li>Optionally archive emails after processing</li>
            <li>Generate smart responses as drafts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;