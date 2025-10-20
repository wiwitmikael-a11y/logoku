import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { UserActionsProvider } from './contexts/UserActionsContext';
import ErrorBoundary from './components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <UserActionsProvider>
              <App />
          </UserActionsProvider>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);