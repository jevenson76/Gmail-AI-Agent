import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import { isElectron, setupElectronEvents } from './electron-renderer';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('gmail_access_token');
      if (accessToken) {
        setIsAuthenticated(true);
        // Get profile from localStorage if available
        const profile = localStorage.getItem('user_profile');
        if (profile) {
          try {
            setUserProfile(JSON.parse(profile));
          } catch (error) {
            console.error('Error parsing user profile:', error);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
    
    // Set up electron events if running in electron
    if (isElectron()) {
      setupElectronEvents(
        // Process emails handler
        () => {
          console.log('Processing emails from Electron event');
          // Call your email processing function here
        },
        // Auth callback handler
        (callbackUrl) => {
          console.log('Handling auth callback from Electron:', callbackUrl);
          // The URL will be loaded in the main window, so we don't need
          // to do anything special here - the AuthCallback component
          // will handle it when the route is loaded
        }
      );
    }
  }, []);

  // Handle auth success
  const handleAuthSuccess = (accessToken: string, refreshToken: string, profile: any) => {
    localStorage.setItem('gmail_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('gmail_refresh_token', refreshToken);
    }
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setUserProfile(profile);
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_refresh_token');
    localStorage.removeItem('user_profile');
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/auth/callback/google" 
          element={<AuthCallback onAuthSuccess={handleAuthSuccess} />} 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} userProfile={userProfile} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;