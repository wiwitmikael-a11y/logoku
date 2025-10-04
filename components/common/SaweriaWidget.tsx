import React from 'react';

const SaweriaWidget: React.FC = () => {
  const supporters = [
    { name: 'Sultan Cromboloni Viral', amount: 'Rp 50.000', emoji: '🥐' },
    { name: 'Juragan Seblak Level 100', amount: 'Rp 25.000', emoji: '🌶️' },
    { name: 'CEO Angkringan Senja', amount: 'Rp 15.000', emoji: '☕' },
    { name: 'Ratu Skincare Glowing', amount: 'Rp 75.000', emoji: '✨' },
    { name: 'Bos Jastip Bangkok', amount: 'Rp 30.000', emoji: '✈️' },
    { name: 'Panglima Ayam Geprek', amount: 'Rp 20.000', emoji: '🍗' },
    { name: 'Presiden Direktur Thrift Shop', amount: 'Rp 40.000', emoji: '👕' },
    { name: 'Ketua Geng Pecel Lele', amount: 'Rp 10.000', emoji: '🐟' },
    { name: 'Ahli Racik Kopi Manual', amount: 'Rp 35.000', emoji: '⚗️' },
    { name: 'Master Kue Cubit Lumer', amount: 'Rp 12.345', emoji: '🍪' },
  ];

  return (
    <div className="w-full p-6 bg-surface border border-border-main rounded-xl text-center shadow-lg shadow-black/20">
      <h3 className="text-4xl font-bold text-splash mb-4" style={{fontFamily: 'var(--font-hand)'}}>Dukungan dari Juragan Baik Hati!</h3>
      <p className="text-text-muted mb-6 max-w-2xl mx-auto text-sm"> Setiap traktiran kopi jadi bahan bakar buat Mang AI biar makin pinter. Makasih banyak, ya! Sehat dan lancar terus rezekinya! </p>
      
      <div className="w-full h-12 bg-background rounded-lg overflow-hidden relative border border-border-main">
        <div className="animate-marquee">
            <div className="marquee-group">
                {supporters.map((s, i) => (
                  <p key={i} className="text-sm mx-6 flex-shrink-0">
                    <span className="font-bold text-splash">{s.name}</span>
                    <span className="text-text-muted"> traktir </span>
                    <span className="font-semibold text-text-header">{s.amount}!</span>
                    <span className="ml-2">{s.emoji}</span>
                  </p>
                ))}
            </div>
            <div className="marquee-group">
                {supporters.map((s, i) => (
                  <p key={`dup-${i}`} className="text-sm mx-6 flex-shrink-0">
                    <span className="font-bold text-splash">{s.name}</span>
                    <span className="text-text-muted"> traktir </span>
                    <span className="font-semibold text-text-header">{s.amount}!</span>
                    <span className="ml-2">{s.emoji}</span>
                  </p>
                ))}
            </div>
        </div>
      </div>

       <a 
          href="https://saweria.co/logoku"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 relative inline-flex items-center justify-center gap-3 bg-splash hover:bg-splash-hover text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 ease-in-out hover:scale-105 shadow-lg shadow-fuchsia-500/20 btn-splash-hover z-0 overflow-hidden"
      >
          <span className="relative z-10 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Mau Ikutan Traktir Mang AI Kopi?
          </span>
      </a>
    </div>
  );
};

export default SaweriaWidget;