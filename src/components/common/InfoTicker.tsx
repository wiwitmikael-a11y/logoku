// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';

const TIPS = [
    "Persona brand yang kuat adalah kunci konsistensi komunikasi.",
    "Setiap hari kamu dapat token gratis untuk berkreasi!",
    "Warna bisa mempengaruhi persepsi pelanggan terhadap brand-mu.",
    "Gunakan 'Sotoshop' untuk membuat aset visual unik seperti maskot dan pola.",
    "Proyek yang kamu buat akan tersimpan otomatis saat ada perubahan.",
    "Jangan lupa cek 'Misi Harian' untuk mendapatkan XP dan token tambahan!",
    "Logo yang simpel lebih mudah diingat."
];

const InfoTicker: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Initial delay before showing the first tip
        const initialTimer = setTimeout(() => setIsVisible(true), 2000);

        const interval = setInterval(() => {
            setIsVisible(false); // Start fade out
            setTimeout(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % TIPS.length);
                setIsVisible(true); // Fade back in with new content
            }, 500); // Corresponds to animation duration
        }, 7000); // Change tip every 7 seconds

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        }
    }, []);

    // This component will not be visible if the ProjectDock is closed and the screen is small.
    // This is an acceptable trade-off to keep positioning simple.
    return (
        <div className="fixed bottom-36 sm:bottom-4 left-4 z-30 pointer-events-none max-w-xs transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0 }}>
             <div className="bg-surface/90 backdrop-blur-md text-text-body text-sm p-3 rounded-lg shadow-lg border border-border-main">
                <p><strong className="text-primary">💡 Info:</strong> {TIPS[currentIndex]}</p>
             </div>
        </div>
    );
};

export default InfoTicker;
