// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

const MOCK_DONATIONS = [
  "Rangga P. H. baru saja mendukung via Saweria!",
  "Juragan Kopi menyemangati Mang AI dengan segelas kopi!",
  "Sultan Skincare baru saja mendukung via Saweria!",
  "Anonymous memberikan dukungan untuk pengembangan!",
  "Owner Kedai Senja baru saja mendukung via Saweria!",
  "Terima kasih atas semua dukungannya, Juragan!",
];

const DonationTicker: React.FC = () => {
    // This component is currently not in use but kept for potential future implementation.
    const tickerText = MOCK_DONATIONS.map(item => `${item}`).join(' ✨ ');

    return (
        <div className="bg-splash/10 border-t border-b border-splash/20 text-splash text-xs font-semibold overflow-hidden whitespace-nowrap flex items-center h-7 rounded-b-md">
            <span className="bg-splash text-[rgb(var(--c-text-inverse))] px-2 py-1 text-xs font-bold h-full flex items-center">DONASI</span>
            <div className="marquee-text-wrapper">
                <p className="marquee-text" style={{ animationDuration: '50s'}}>
                    <a href="https://saweria.co/ranggaph" target="_blank" rel="noopener noreferrer" className="hover:underline">{tickerText}</a>
                </p>
            </div>
        </div>
    );
};

export default DonationTicker;
