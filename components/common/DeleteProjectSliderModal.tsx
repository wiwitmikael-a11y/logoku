import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playSound } from '../../services/soundService';
import Button from './Button';

interface Props {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectNameToDelete: string;
  projectLogoUrl?: string | null;
  isConfirmLoading?: boolean;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const DeleteProjectSliderModal: React.FC<Props> = ({ show, onClose, onConfirm, projectNameToDelete, projectLogoUrl, isConfirmLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderLeft, setSliderLeft] = useState(0);
  const [isSolved, setIsSolved] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLImageElement>(null);
  const trashRef = useRef<SVGSVGElement>(null);
  const trackGlowRef = useRef<HTMLDivElement>(null);

  const getTrackBounds = useCallback(() => {
    if (!trackRef.current || !sliderRef.current) return { maxSliderLeft: 0 };
    const trackWidth = trackRef.current.clientWidth;
    const sliderWidth = sliderRef.current.clientWidth;
    return { maxSliderLeft: trackWidth - sliderWidth };
  }, []);

  const resetSlider = useCallback(() => {
    if (sliderRef.current) {
      sliderRef.current.style.transition = 'left 0.3s ease-out';
      setSliderLeft(0);
    }
    setIsSolved(false);
    if(paperRef.current) {
        paperRef.current.classList.remove('animate-paper-throw');
    }
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isSolved || isConfirmLoading) return;
    if (sliderRef.current) sliderRef.current.style.transition = 'none';
    setIsDragging(true);
  }, [isSolved, isConfirmLoading]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current || !sliderRef.current) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const newLeft = clientX - trackRect.left - (sliderRef.current.clientWidth / 2);
    const { maxSliderLeft } = getTrackBounds();

    const clampedLeft = Math.max(0, Math.min(newLeft, maxSliderLeft));
    setSliderLeft(clampedLeft);
  }, [isDragging, getTrackBounds]);

  const handleMouseDragMove = useCallback((e: MouseEvent) => handleDragMove(e.clientX), [handleDragMove]);
  const handleTouchDragMove = useCallback((e: TouchEvent) => e.touches[0] && handleDragMove(e.touches[0].clientX), [handleDragMove]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const { maxSliderLeft } = getTrackBounds();

    if (sliderLeft >= maxSliderLeft - 10) {
      playSound('puzzle_drop');
      setSliderLeft(maxSliderLeft);
      setIsSolved(true);
      
      paperRef.current?.classList.add('animate-paper-throw');
      trashRef.current?.classList.add('animate-trash-shake');
      trackGlowRef.current?.classList.add('animate-slider-success-glow');

      setTimeout(() => {
        onConfirm();
      }, 500);
    } else {
      playSound('puzzle_fail');
      resetSlider();
    }
  }, [isDragging, sliderLeft, getTrackBounds, resetSlider, onConfirm]);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleMouseDragMove, handleTouchDragMove, handleDragEnd]);

  useEffect(() => {
    if (show) modalRef.current?.focus();
    else setTimeout(resetSlider, 300);
  }, [show, resetSlider]);
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isConfirmLoading) {
          onClose();
      }
  }

  if (!show) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
      onClick={handleOverlayClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      tabIndex={-1}
    >
      <div className={`relative max-w-md w-full bg-gray-800 border rounded-2xl shadow-2xl p-8 flex flex-col items-center transition-colors duration-300 ${isSolved ? 'border-red-500' : 'border-gray-700'}`}>
        <img
          src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
          alt="Mang AI character with a thinking pose"
          className="w-24 mb-4"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2 id="delete-modal-title" className="text-2xl font-bold text-red-400 mb-2">Hapus Project Ini?</h2>
        <p className="text-gray-300 mb-2 text-center">
          Lo mau ngebuang project <strong className="text-white">"{projectNameToDelete}"</strong>?
        </p>
         <p className="text-xs text-gray-500 mb-8 text-center">Awas, tindakan ini bakal ngapus semua data secara permanen dan gak bisa dibalikin lagi.</p>

        <div 
          ref={trackRef}
          className="w-full h-16 bg-gray-900/50 rounded-full flex items-center p-2 relative border border-gray-700"
        >
          <div
            ref={trackGlowRef}
            className="absolute left-0 top-0 h-full bg-red-800/50 rounded-full"
            style={{ width: `${sliderLeft + 50}px` }}
          />
          
          <div
            ref={sliderRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`w-12 h-12 bg-red-600 rounded-full absolute flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-lg ${isSolved ? 'opacity-0' : ''}`}
            style={{ left: `${sliderLeft}px` }}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((sliderLeft / getTrackBounds().maxSliderLeft) * 100) || 0}
          >
             {projectLogoUrl ? (
                <img ref={paperRef} src={projectLogoUrl} alt={`Logo untuk ${projectNameToDelete}`} className="w-9 h-9 object-contain bg-white p-1 rounded-md" />
             ) : (
                <img ref={paperRef} src="https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/paper-stack-icon.png" alt="Project" className="w-7 h-7" />
             )}
          </div>

          <span className={`text-center w-full font-semibold transition-opacity duration-300 ${(isDragging || isSolved) ? 'opacity-0' : 'opacity-100 text-gray-400'}`}>
            Geser untuk Hapus Permanen
          </span>
          
           <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
             <svg ref={trashRef} xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
           </div>
        </div>
        
        {isConfirmLoading && !isSolved && <p className="text-yellow-400 text-sm mt-4">Menghapus...</p>}

        <div className="mt-8">
            <Button onClick={onClose} variant="secondary" disabled={isConfirmLoading}>
                Gak Jadi, Sayang
            </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectSliderModal;