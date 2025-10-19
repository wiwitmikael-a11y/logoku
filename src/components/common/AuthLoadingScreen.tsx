// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import Button from './Button';
import { useTranslation } from '../../contexts/LanguageContext';
import Spinner from './Spinner';

interface Props {
  isStuck: boolean;
}

const AuthLoadingScreen: React.FC<Props> = ({ isStuck }) => {
  const { t } = useTranslation();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-body p-4 text-center">
      {isStuck ? (
        <div className="animate-content-fade-in flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
          <h2 className="text-xl font-bold text-accent">{t({ id: "Waduh, Kok Lama...", en: "Uh Oh, It's Taking a While..." })}</h2>
          <p className="mt-2 text-text-muted max-w-sm">
            {t({ 
              id: "Koneksi sepertinya lambat atau ada yang nyangkut. Coba muat ulang halaman, biasanya langsung beres!", 
              en: "The connection seems slow or something got stuck. Try reloading the page, that usually fixes it!" 
            })}
          </p>
          <Button onClick={handleReload} className="mt-6" variant="primary">
            {t({ id: "Coba Muat Ulang Halaman", en: "Reload Page" })}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
            <Spinner />
            <p className="mt-4 text-lg font-semibold">{t({ id: "Memuat data Juragan...", en: "Loading your data, Boss..." })}</p>
        </div>
      )}
    </div>
  );
};

export default AuthLoadingScreen;