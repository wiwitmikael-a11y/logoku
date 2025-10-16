// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-body">
    <img
      src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
      alt="Mang AI loading..."
      className="w-24 h-24 animate-bouncing-ai"
      style={{ imageRendering: 'pixelated' }}
    />
    <p className="mt-4 text-lg font-semibold animate-pulse">Memuat data Juragan...</p>
  </div>
);

export default AuthLoadingScreen;
