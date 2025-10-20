// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React from 'react';

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

const GlowingArrowButton: React.FC<Props> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors duration-300 animate-arrow-pulse"
      aria-label={isOpen ? 'Ciutkan' : 'Bentangkan'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-6 w-6 transform transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export default GlowingArrowButton;
