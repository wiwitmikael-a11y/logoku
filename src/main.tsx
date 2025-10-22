// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { UIProvider } from './contexts/UIContext';
import { UserActionsProvider } from './contexts/UserActionsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css'; // THE CRITICAL FIX IS HERE. This line was missing.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <UIProvider>
            <UserActionsProvider>
              <LanguageProvider>
                <App />
              </LanguageProvider>
            </UserActionsProvider>
          </UIProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
