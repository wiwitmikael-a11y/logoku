
import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { playSound, playBGM } from '../../services/soundService';

const BrandingTipModal = React.lazy(() => import('./BrandingTipModal'));

interface Props {
  show: boolean;
  onSuccess: () => void;
}

const GITHUB_ASSETS_URL = 'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/';

const SliderCaptcha: React.FC<Props> = ({ show, onSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderLeft, setSliderLeft] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [showBrandingTip, setShowBrandingTip] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const jinglePlayedRef = useRef(false);

  const getTrackBounds = useCallback(() => {
    if (!trackRef.current || !sliderRef.current) return { trackWidth: 0, maxSliderLeft: 0 };
    const trackWidth = trackRef.current.clientWidth;
    const sliderWidth = sliderRef.current.clientWidth;
    return { trackWidth, maxSliderLeft: trackWidth - sliderWidth };
  }, []);

  const resetSlider = useCallback(() => {
    if (sliderRef.current) {
      sliderRef.current.style.transition = 'left 0.3s ease-out';
      setSliderLeft(0);
    }
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isSolved) return;
    
    if (!jinglePlayedRef.current) {
        playBGM('welcome');
        jinglePlayedRef.current = true;
    }
    
    if (sliderRef.current) sliderRef.current.style.transition = 'none';

    setIsDragging(true);
  }, [isSolved]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current || !sliderRef.current) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const newLeft = clientX - trackRect.left - (sliderRef.current.clientWidth / 2);
    const { maxSliderLeft } = getTrackBounds();

    const clampedLeft = Math.max(0, Math.min(newLeft, maxSliderLeft));
    setSliderLeft(clampedLeft);
  }, [isDragging, getTrackBounds]);

  const handleMouseDragMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);
  
  const handleTouchDragMove = useCallback((e: TouchEvent) => {
    if (e.touches[0]) {
      handleDragMove(e.touches[0].clientX);
    }
  }, [handleDragMove]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const { maxSliderLeft } = getTrackBounds();

    if (sliderLeft >= maxSliderLeft - 5) {
      playSound('puzzle_drop');
      setSliderLeft(maxSliderLeft);
      setIsSolved(true);
      setTimeout(() => {
        setShowBrandingTip(true);
      }, 500); 
    } else {
      playSound('puzzle_fail');
      resetSlider();
    }
  }, [isDragging, sliderLeft, getTrackBounds, resetSlider]);
  
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
    if (show) {
      modalRef.current?.focus();
    } else {
      setTimeout(() => {
          setIsSolved(false);
          setShowBrandingTip(false);
          resetSlider();
          jinglePlayedRef.current = false;
      }, 300);
    }
  }, [show, resetSlider]);

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        ref={modalRef}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-content-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="captcha-title"
        tabIndex={-1}
      >
        <div className={`relative max-w-sm w-full bg-gray-800 border rounded-2xl shadow-2xl p-8 flex flex-col items-center transition-all duration-300 ${isSolved ? 'border-green-500 ring-4 ring-green-500/30' : 'border-gray-700'} ${showBrandingTip ? 'filter blur-sm' : ''}`}>
          <img
              src={`${GITHUB_ASSETS_URL}Mang_AI.png`}
              alt="Mang AI character"
              className="w-24 mb-4 animate-breathing-ai"
              style={{ imageRendering: 'pixelated' }}
          />
          <h2 id="captcha-title" className="text-xl font-bold text-indigo-400 mb-2">Eits, Tahan Dulu, Juragan!</h2>
          <p className="text-gray-300 mb-8 text-center text-sm">Sebelum kita mulai ngeracik brand juara, buktikan kalo lo pejuang UMKM sejati dengan geser slider ini sampe mentok!</p>

          <div 
            ref={trackRef}
            className="w-full h-14 bg-gray-900 rounded-full flex items-center p-2 relative"
          >
            <div 
              className="absolute left-0 top-0 h-full bg-indigo-600/50 rounded-full"
              style={{ width: `${sliderLeft + 40}px` }}
            />

            <div
              ref={sliderRef}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              className={`w-10 h-10 bg-indigo-600 rounded-full absolute flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${isSolved ? '!bg-green-500' : ''}`}
              style={{ left: `${sliderLeft}px` }}
              aria-label="Geser untuk verifikasi"
              role="slider"
            >
              {isSolved ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              )}
            </div>

            <span className={`text-center w-full font-semibold transition-opacity duration-300 ${isDragging || isSolved ? 'opacity-0' : 'opacity-100 text-gray-400'}`}>
              Ayo, geser ke kanan, juragan!
            </span>
          </div>
          
          {isSolved && !showBrandingTip && (
              <p className="text-green-400 font-bold animate-pulse mt-6">Mantap! Ternyata beneran juragan, bukan kaleng-kaleng. Sokin lanjut!</p>
          )}
        </div>
      </div>
      <Suspense fallback={null}>
        <BrandingTipModal
            show={showBrandingTip}
            onConfirm={onSuccess}
        />
      </Suspense>
    </>
  );
};

export default SliderCaptcha;