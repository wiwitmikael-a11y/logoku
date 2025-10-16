// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const SupabaseKeyErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-orange-900/50 text-white p-4">
    <div className="max-w-xl text-center bg-surface text-text-body p-8 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-orange-500 mb-4">Waduh, Gagal Konek!</h1>
      <p className="mb-4">Sepertinya ada masalah koneksi ke database. Aplikasi tidak bisa menyimpan progresmu saat ini.</p>
      <div className="text-left bg-background p-4 rounded-lg text-sm text-text-muted">
        <p className="font-semibold">Detail Error:</p>
        <pre className="mt-2 whitespace-pre-wrap break-words font-mono">
          {error}
        </pre>
      </div>
       <p className="mt-6 text-xs">Ini adalah masalah di sisi developer. Jika Anda adalah developer, pastikan variabel environment `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah diatur dengan benar.</p>
    </div>
  </div>
);

export default SupabaseKeyErrorScreen;
