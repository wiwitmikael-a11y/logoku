// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { AuthProvider } from './src/contexts/AuthContext';
import { UIProvider } from './src/contexts/UIContext';
import { UserActionsProvider } from './src/contexts/UserActionsContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import ErrorBoundary from './src/components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <UserActionsProvider>
            <LanguageProvider>
              <App />
            {/* FIX: Corrected typo in closing tag for LanguageProvider. */}
            </LanguageProvider>
          </UserActionsProvider>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);