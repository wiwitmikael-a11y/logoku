// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import Button from './Button';

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

interface Props {
  isStuck: boolean;
}

const AuthLoadingScreen: React.FC<Props> = ({ isStuck }) => {

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-body p-4 text-center">
      <div className="relative h-40">
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI"
          className={`w-24 h-24 absolute bottom-0 left-1/2 -translate-x-1/2 ${isStuck ? 'animate-tripped-ai' : 'animate-stomp-ai'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      {isStuck ? (
        <div className="animate-content-fade-in">
          <h2 className="text-xl font-bold text-accent mt-4">Waduh, Kok Lama...</h2>
          <p className="mt-2 text-text-muted max-w-sm">
            Koneksi sepertinya lambat atau ada yang nyangkut. Coba muat ulang halaman, biasanya langsung beres!
          </p>
          <Button onClick={handleReload} className="mt-6" variant="primary">
            Coba Muat Ulang Halaman
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-lg font-semibold animate-pulse">Memuat data Juragan...</p>
      )}
    </div>
  );
};

export default AuthLoadingScreen;