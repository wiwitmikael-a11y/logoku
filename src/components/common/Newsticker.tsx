// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';
import useFetchNews from '../../hooks/useFetchNews';

const Newsticker: React.FC = () => {
    const { news, loading, error } = useFetchNews();

    let tickerText = "Memuat berita terkini seputar UMKM & Pengusaha...";
    if (error) {
        tickerText = error;
    } else if (!loading && news.length > 0) {
        tickerText = news.map(item => item.title).join('  ---  ');
    } else if (!loading && news.length === 0) {
        tickerText = "Tidak ada berita ditemukan saat ini.";
    }

    return (
        <div className="bg-accent/10 border-t border-b border-accent/20 text-accent-hover text-xs font-semibold overflow-hidden whitespace-nowrap flex items-center h-7 rounded-t-md">
            <span className="bg-accent text-white px-2 py-1 text-xs font-bold h-full flex items-center">NEWS</span>
            <div className="marquee-text-wrapper">
                <p className="marquee-text" style={{ animationDuration: '90s' }}>{tickerText}</p>
            </div>
        </div>
    );
};

export default Newsticker;
