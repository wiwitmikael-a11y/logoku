// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import Spinner from './Spinner';

const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-body p-4 text-center">
      <div className="flex flex-col items-center">
          <Spinner />
          <p className="mt-4 text-lg font-semibold">Memuat data Juragan...</p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
