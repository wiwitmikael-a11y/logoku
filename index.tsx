// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UIProvider } from './contexts/UIContext';
import { UserActionsProvider } from './contexts/UserActionsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

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

// Startup checks are moved to their respective services (lazy initialization).
// The app will now always attempt to render, showing the login/captcha screen first.
root.render(
  <React.StrictMode>
    <AuthProvider>
      <UserActionsProvider>
        <UIProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </UIProvider>
      </UserActionsProvider>
    </AuthProvider>
  </React.StrictMode>
);
