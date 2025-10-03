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

  const displaySupporters = [...supporters, ...supporters];

  return (
    <div className="w-full p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
      <h3 className="text-2xl font-bold text-orange-500 mb-4" style={{fontFamily: 'var(--font-hand)'}}>Dukungan dari Juragan Baik Hati!</h3>
      <p className="text-slate-500 mb-6 max-w-2xl mx-auto text-sm">
        Setiap traktiran kopi jadi bahan bakar buat Mang AI biar makin pinter. Makasih banyak, ya! Sehat dan lancar terus rezekinya!
      </p>
      
      <div className="w-full h-12 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
        <div className="absolute top-0 left-0 h-full flex items-center animate-marquee" style={{animation: 'marquee 40s linear infinite'}}>
          {displaySupporters.map((s, i) => (
            <p key={i} className="text-sm mx-6 flex-shrink-0">
              <span className="font-bold text-orange-600">{s.name}</span>
              <span className="text-slate-500"> baru traktir </span>
              <span className="font-semibold text-slate-800">{s.amount}!</span>
              <span className="ml-2">{s.emoji}</span>
            </p>
          ))}
        </div>
      </div>

       <a 
          href="https://saweria.co/logoku"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 shadow-lg shadow-orange-500/20"
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