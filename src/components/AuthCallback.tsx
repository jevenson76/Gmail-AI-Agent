import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GmailAPI } from '../api/gmail';

interface AuthCallbackProps {
  onAuthSuccess: (accessToken: string, refreshToken: string, profile: any) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onAuthSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          // Check for error parameter
          const errorParam = urlParams.get('error');
          throw new Error(errorParam || 'Authorization code not found in URL');
        }

        // Exchange code for tokens
        const tokenResponse = await exchangeCodeForTokens(code);
        
        if (!tokenResponse.access_token) {
          throw new Error('Failed to retrieve access token');
        }

        // Get user profile
        const profile = await fetchUserProfile(tokenResponse.access_token);
        
        // Store tokens and profile in local storage
        localStorage.setItem('gmail_access_token', tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
          localStorage.setItem('gmail_refresh_token', tokenResponse.refresh_token);
        }
        
        // Call the success handler
        onAuthSuccess(
          tokenResponse.access_token, 
          tokenResponse.refresh_token || '', 
          profile
        );
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Unknown authentication error');
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, onAuthSuccess]);

  // Exchange authorization code for tokens
  const exchangeCodeForTokens = async (code: string) => {
    const redirectUri = window.location.origin + '/auth/callback/google';
    
    // For Electron app, use the app protocol
    const isElectron = window.electron?.isElectron === true;
    const electronRedirectUri = isElectron ? 'app://gmail-ai-agent/auth/callback/google' : null;
    
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: isElectron ? (electronRedirectUri as string) : redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`);
    }

    return await response.json();
  };

  // Fetch user profile information
  const fetchUserProfile = async (accessToken: string) => {
    const api = new GmailAPI(accessToken);
    try {
      const profile = await api.getUserProfile();
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  };

  if (processing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <svg className="h-12 w-12 text-red-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium mt-4">Authentication Failed</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Successful auth should redirect, this is just a fallback
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <p className="text-xl">Authentication successful!</p>
        <p className="mt-2">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 