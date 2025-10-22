// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { UserActionsProvider } from './contexts/UserActionsContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';

// --- SESSION RESET MECHANISM ---
// Setiap kali ada perubahan signifikan pada kode, NAIKKAN NOMOR VERSI INI.
// Contoh: '1.0.0' -> '1.0.1'
const APP_VERSION = '1.1.0'; 
const VERSION_KEY = 'desainfun_app_version';

const storedVersion = localStorage.getItem(VERSION_KEY);

if (storedVersion !== APP_VERSION) {
  console.log(`Versi aplikasi berubah dari ${storedVersion} ke ${APP_VERSION}. Membersihkan sesi lama...`);
  // Hapus semua kunci yang berhubungan dengan Supabase auth
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && key.includes('-auth-token')) {
      localStorage.removeItem(key);
    }
  });
  
  // Update ke versi baru
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  
  // Paksa muat ulang halaman untuk memulai dengan sesi yang bersih
  window.location.reload();
}
// --- END OF SESSION RESET MECHANISM ---


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <UserActionsProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </UserActionsProvider>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
