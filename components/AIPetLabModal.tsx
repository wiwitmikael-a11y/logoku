// FIX: Created this file with a skeleton component to resolve the "not a module" error.
import React, { useEffect, useRef } from 'react';
import Button from './common/Button';

interface AIPetLabModalProps {
  show: boolean;
  onClose: () => void;
}

const AIPetLabModal: React.FC<AIPetLabModalProps> = ({ show, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aipet-lab-title"
      tabIndex={-1}
    >
      <div className="relative max-w-lg w-full bg-surface rounded-2xl shadow-xl p-8 text-center flex flex-col items-center">
        <h2 id="aipet-lab-title" className="text-3xl font-bold text-primary mb-4">
          AIPet Lab
        </h2>
        <p className="text-text-body mb-6">
          Welcome to the AIPet Lab. This feature is under construction.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default AIPetLabModal;
