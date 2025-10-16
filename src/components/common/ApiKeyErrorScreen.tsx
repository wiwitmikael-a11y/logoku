// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const ApiKeyErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-900/50 text-white p-4">
    <div className="max-w-xl text-center bg-surface text-text-body p-8 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Waduh, Kunci API Error!</h1>
      <p className="mb-4">Sepertinya ada masalah dengan konfigurasi kunci API Google Gemini. Aplikasi tidak bisa berjalan tanpanya.</p>
      <div className="text-left bg-background p-4 rounded-lg text-sm text-text-muted">
        <p className="font-semibold">Detail Error:</p>
        <pre className="mt-2 whitespace-pre-wrap break-words font-mono">
          {error}
        </pre>
      </div>
      <p className="mt-6 text-xs">Ini adalah masalah di sisi developer. Jika Anda adalah developer, pastikan variabel environment `VITE_API_KEY` sudah diatur dengan benar.</p>
    </div>
  </div>
);

export default ApiKeyErrorScreen;
