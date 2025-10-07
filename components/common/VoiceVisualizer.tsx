// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

import React, { useRef, useEffect } from 'react';

interface VoiceVisualizerProps {
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ analyser, isSpeaking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!dataArrayRef.current) {
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
    const dataArray = dataArrayRef.current;
    const bufferLength = dataArray.length;
    
    let animationFrameId: number;

    const renderFrame = () => {
      animationFrameId = requestAnimationFrame(renderFrame);
      
      if (!isSpeaking) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 75; // Inner radius of the visualizer circle
      const bars = bufferLength * 0.8; // Use 80% of the frequency data for a cleaner look

      for (let i = 0; i < bars; i++) {
        // Use a power curve to make quiet sounds more visible
        const barHeight = Math.pow(dataArray[i] / 255, 2.5) * 80;
        // Map bar value to color, from primary to accent
        const hue = 200 + (dataArray[i] / 255) * 160; // 200 (blueish) to 360 (red-ish via magenta)
        const lightness = 50 + (dataArray[i] / 255) * 20;
        
        // Distribute bars evenly in a circle
        const angle = (i / bars) * 2 * Math.PI;

        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * (radius + barHeight);
        const endY = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        const alpha = Math.max(0.1, dataArray[i] / 255);
        
        ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isSpeaking]);

  return (
    <canvas 
        ref={canvasRef} 
        width="300" 
        height="300" 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`} 
    />
  );
};

export default VoiceVisualizer;