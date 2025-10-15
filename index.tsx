// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UIProvider } from './contexts/UIContext';
import { UserActionsProvider } from './contexts/UserActionsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AIPetProvider } from './contexts/AIPetContext';

// Import error screens and config checks
import { supabaseError } from './services/supabaseClient';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const root = ReactDOM.createRoot(rootElement);

// Perform startup checks here, before rendering the main app tree. This is the core fix.
if (supabaseError) {
  root.render(<SupabaseKeyErrorScreen error={supabaseError} />);
} else if (!import.meta?.env?.VITE_API_KEY) {
  root.render(<ApiKeyErrorScreen />);
} else {
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <UserActionsProvider>
          <UIProvider>
            <LanguageProvider>
              <AIPetProvider>
                <App />
              </AIPetProvider>
            </LanguageProvider>
          </UIProvider>
        </UserActionsProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}
