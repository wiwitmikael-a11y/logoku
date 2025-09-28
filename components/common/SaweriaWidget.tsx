import React from 'react';

const SAWERRIA_WIDGET_URL = 'https://saweria.co/widgets/recent?streamKey=9f0562857accae5eeb6163e3d2248fd0';

const SaweriaWidget: React.FC = () => {
  return (
    <div className="w-full p-6 bg-gray-800/50 border border-amber-600/50 rounded-xl text-center animate-content-fade-in">
      <h3 className="text-xl font-bold text-amber-400 mb-4 font-handwritten tracking-wide">Dukungan Terbaru dari Juragan Baik Hati!</h3>
      <p className="text-gray-400 mb-6 max-w-2xl mx-auto text-sm">
        Setiap traktiran kopi dari kalian jadi bahan bakar buat Mang AI biar makin pinter dan bisa terus bantu UMKM Indonesia. Makasih banyak, ya! Sehat dan lancar terus rezekinya!
      </p>
      <div className="w-full h-80 rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900">
        <iframe
          src={SAWERRIA_WIDGET_URL}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Donasi Terbaru Saweria"
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
        ></iframe>
      </div>
       <a 
          href="https://saweria.co/logoku"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 shadow-lg"
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          Mau Ikutan Traktir Mang AI Kopi?
      </a>
    </div>
  );
};

export default SaweriaWidget;
