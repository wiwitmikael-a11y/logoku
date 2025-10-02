


import React, { useState, useEffect, useRef } from 'react';

interface ImageModalProps {
  imageUrl: string;
  altText: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose }) => {
  const [scale, setScale] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleZoomIn = () => setScale(prev => prev * 1.2);
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev / 1.2));

  const handleDownload = async () => {
    try {
      // 1. Fetch the image data and create a blob. This works for both http(s) and data: URLs.
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Gagal mengambil data gambar untuk diunduh.');
      }
      const blob = await response.blob();

      // 2. Determine the filename and extension from the blob's MIME type.
      const mimeType = blob.type || 'image/png';
      let extension = mimeType.split('/')[1] || 'png';
      // Handle potential complex mime types like 'svg+xml'
      extension = extension.split('+')[0];

      const filename = `${altText.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'download'}.${extension}`;

      // 3. Create a temporary link using a blob URL, which is handled correctly by iOS.
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;

      // 4. Trigger the download and then clean up.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 5. Revoke the object URL to free up memory.
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Waduh, gagal mengunduh gambar. Coba lagi, ya.');
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
        alert('Fitur share tidak didukung di browser ini.');
        return;
    }
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const extension = blob.type.split('/')[1] || 'png';
        const filename = `${altText.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'download'}.${extension}`;
        const file = new File([blob], filename, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Desain dari desain.fun`,
                text: `Lihat ${altText} yang aku buat pakai Mang AI!`,
            });
        } else {
            throw new Error("Tidak bisa share file.");
        }
    } catch (error) {
        console.error('Gagal share file, mencoba share URL:', error);
        try {
            await navigator.share({
                title: `Desain dari desain.fun`,
                text: `Lihat ${altText} yang aku buat pakai Mang AI! Cek di desain.fun!`,
                url: window.location.href,
            });
        } catch (shareError) {
             console.error('Gagal share URL juga:', shareError);
             alert('Waduh, gagal nge-share.');
        }
    }
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
      tabIndex={-1}
    >
        <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col gap-4">
           <h2 id="image-modal-title" className="sr-only">Penampil Gambar: {altText}</h2>
           
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 flex items-center justify-center gap-2 self-center">
                <button onClick={handleZoomIn} title="Perbesar" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
                <button onClick={handleZoomOut} title="Perkecil" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
                {canShare && (
                  <button onClick={handleShare} title="Bagikan" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                  </button>
                )}
                 <button onClick={handleDownload} title="Unduh" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button onClick={onClose} title="Tutup" className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
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