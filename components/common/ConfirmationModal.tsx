import React, { useEffect, useRef } from 'react';
import { playSound, unlockAudio } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ConfirmationModal: React.FC<Props> = ({ show, onClose, onConfirm, title, children, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
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

  if (!show) {
    return null;
  }

  const handleClose = async () => {
      await unlockAudio();
      playSound('click');
      onClose();
  };

  const handleConfirm = async () => {
      await unlockAudio();
      playSound('click');
      onConfirm();
  };
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          handleClose();
      }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      style={{ animationDuration: '0.2s' }}
      onClick={handleOverlayClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-md w-full bg-gray-800/80 backdrop-blur-md border border-yellow-700 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character with a thinking pose"
          className="w-24 mb-4"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="confirmation-modal-title" className="text-2xl font-bold text-yellow-400 mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">
          {children}
        </p>
        <div className="flex gap-4">
            <Button onClick={handleClose} variant="secondary">
                {cancelText}
            </Button>
            <Button onClick={handleConfirm}>
                {confirmText}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
