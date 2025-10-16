// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UIProvider } from './contexts/UIContext';
import { UserActionsProvider } from './contexts/UserActionsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AIPetProvider } from './contexts/AIPetContext';
import { supabaseError } from './services/supabaseClient';
import SupabaseKeyErrorScreen from './components/common/SupabaseKeyErrorScreen';
import ApiKeyErrorScreen from './components/common/ApiKeyErrorScreen';

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

// CRITICAL: Check for initialization errors BEFORE rendering the app.
if (supabaseError) {
  root.render(
    <React.StrictMode>
      <SupabaseKeyErrorScreen error={supabaseError} />
    </React.StrictMode>
  );
} else if (!import.meta.env.VITE_API_KEY) {
  root.render(
    <React.StrictMode>
      <ApiKeyErrorScreen />
    </React.StrictMode>
  );
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
