import React, { useEffect, useRef } from 'react';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirmLoading?: boolean;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const ConfirmationModal: React.FC<Props> = ({
  show,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirmLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (show) {
      modalRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      tabIndex={-1}
    >
      <div className="relative max-w-md w-full bg-gray-800 border border-yellow-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character with a thinking pose"
          className="w-24 mb-4"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="confirmation-modal-title" className="text-2xl font-bold text-yellow-400 mb-2 text-center">{title}</h2>
        <div className="text-gray-300 my-4 text-center text-sm">
          {children}
        </div>
        <div className="flex gap-4 mt-6">
          <Button onClick={onClose} variant="secondary" disabled={isConfirmLoading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} isLoading={isConfirmLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
