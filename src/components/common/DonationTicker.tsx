// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useState, useEffect } from 'react';

const DONATIONS = [
  { name: 'Juragan Baik Hati', amount: 'secangkir kopi ☕' },
  { name: 'Sultan Dermawan', amount: 'semangkuk bakso 🍜' },
  { name: 'Pejuang UMKM', amount: 'segelas es teh 🍹' },
];

const DonationTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const initialTimer = setTimeout(() => setIsVisible(true), 5000); // Start after 5s

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % DONATIONS.length);
        setIsVisible(true);
      }, 500);
    }, 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-xs transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0 }}>
      <a href="https://saweria.co/ranggaph" target="_blank" rel="noopener noreferrer" className="block bg-surface/90 backdrop-blur-md text-text-body text-sm p-3 rounded-lg shadow-lg border border-border-main hover:border-primary transition-colors">
        <p>
          <strong className="text-primary">🙏 Terima kasih!</strong> {DONATIONS[currentIndex].name} baru saja mentraktir {DONATIONS[currentIndex].amount}
        </p>
      </a>
    </div>
  );
};

export default DonationTicker;
