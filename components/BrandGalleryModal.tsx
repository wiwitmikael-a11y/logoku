// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useEffect, useRef, Suspense } from 'react';
import LoadingMessage from './common/LoadingMessage';

const BrandGallery = React.lazy(() => import('./BrandGallery'));

interface Props {
  show: boolean;
  onClose: () => void;
}

const BrandGalleryModal: React.FC<Props> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) {
    return null;
  }
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
      tabIndex={-1}
    >
      <style>{`
        .gallery-modal-bg {
            background-color: #111827;
            background-image: radial-gradient(ellipse at 50% 20%, rgba(79, 70, 229, 0.2) 0%, transparent 70%);
        }
      `}</style>
      <div className="relative max-w-7xl w-full h-[90vh] bg-gray-900 gallery-modal-bg border border-gray-700 rounded-2xl shadow-2xl flex flex-col">
        <header className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center">
             <h2 id="gallery-modal-title" className="text-xl font-bold text-indigo-400">
                Pameran Brand Juragan
            </h2>
            <button onClick={onClose} title="Tutup" className="p-2 -mr-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>

        <main className="p-6 overflow-y-auto">
            <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><LoadingMessage /></div>}>
                <BrandGallery onClose={onClose} />
            </Suspense>
        </main>
      </div>
    </div>
  );
};

export default BrandGalleryModal;