import React from 'react';

const SaweriaWidget: React.FC = () => {
  const supporters = [
    { name: 'Juragan Kopi Sachet', amount: 'Rp 10.000', emoji: '✨' },
    { name: 'Sultan Skincare', amount: 'Rp 50.000', emoji: '🔥' },
    { name: 'Ratu Frozen Food', amount: 'Rp 25.000', emoji: '🧊' },
    { name: 'CEO Keripik Level 30', amount: 'Rp 15.000', emoji: '🌶️' },
    { name: 'Owner Distro Keren', amount: 'Rp 30.000', emoji: '👕' },
    { name: 'Bos Ayam Geprek', amount: 'Rp 20.000', emoji: '🍗' },
  ];

  // Duplicate for seamless loop
  const displaySupporters = [...supporters, ...supporters];

  return (
    <div className="w-full p-6 bg-gray-800/50 border border-amber-600/50 rounded-xl text-center animate-content-fade-in">
      <h3 className="text-xl font-bold text-amber-400 mb-4 font-handwritten tracking-wide">Dukungan Terbaru dari Juragan Baik Hati!</h3>
      <p className="text-gray-400 mb-6 max-w-2xl mx-auto text-sm">
        Setiap traktiran kopi jadi bahan bakar buat Mang AI biar makin pinter. Makasih banyak, ya! Sehat dan lancar terus rezekinya!
      </p>
      
      {/* Running Text Marquee */}
      <div className="w-full h-12 bg-gray-900 rounded-lg overflow-hidden relative border-2 border-gray-700">
        <div className="absolute top-0 left-0 h-full flex items-center animate-marquee">
          {displaySupporters.map((s, i) => (
            <p key={i} className="text-sm mx-6 flex-shrink-0">
              <span className="font-bold text-amber-300">{s.name}</span>
              <span className="text-gray-400"> baru traktir </span>
              <span className="font-semibold text-white">{s.amount}!</span>
              <span className="ml-2">{s.emoji}</span>
            </p>
          ))}
        </div>
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