import React, { useState, useEffect, useRef } from 'react';

interface ImageModalProps {
  imageUrl: string;
  altText: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose }) => {
  const [scale, setScale] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the modal when it opens for accessibility
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleZoomIn = () => setScale(prev => prev * 1.2);
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev / 1.2)); // Prevent zooming out too much

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    // Use a generic name for downloaded files
    const filename = `${altText.replace(/\s+/g, '_').toLowerCase()}.jpeg`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
      tabIndex={-1} // Make it focusable
    >
        <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col gap-4">
           <h2 id="image-modal-title" className="sr-only">Penampil Gambar: {altText}</h2>
           
            {/* Controls */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 flex items-center justify-center gap-2 self-center">
                <button onClick={handleZoomIn} title="Perbesar" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
                <button onClick={handleZoomOut} title="Perkecil" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
                 <button onClick={handleDownload} title="Unduh" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button onClick={onClose} title="Tutup" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Image container */}
            <div className="overflow-auto flex-grow flex items-center justify-center">
                <img
                    src={imageUrl}
                    alt={altText}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${scale})` }}
                />
            </div>
        </div>
    </div>
  );
};

export default ImageModal;