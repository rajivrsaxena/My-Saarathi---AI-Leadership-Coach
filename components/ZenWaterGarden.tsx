
import React, { useEffect, useState, useCallback } from 'react';

interface Ripple {
  id: string;
  x: number;
  y: number;
}

const ZenWaterGarden: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const spawnRipple = useCallback((x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Prevent ripples when clicking on interactive UI elements
      if (target.closest('button, input, select, textarea, a')) return;
      
      const x = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const y = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      spawnRipple(x, y);
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('touchstart', handleGlobalClick);
    
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [spawnRipple]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      <style>{`
        @keyframes ripple-out {
          0% { 
            transform: translate(-50%, -50%) scale(0); 
            opacity: 0.5; 
          }
          100% { 
            transform: translate(-50%, -50%) scale(5); 
            opacity: 0; 
          }
        }
        
        .water-ripple {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 1.5px solid rgba(184, 134, 11, 0.4);
          border-radius: 50%;
          animation: ripple-out 2.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
          pointer-events: none;
        }

        .water-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0) 0%, rgba(241, 245, 249, 0.05) 100%);
          mix-blend-mode: soft-light;
        }
      `}</style>

      <div className="water-overlay" />

      {ripples.map((r) => (
        <div 
          key={r.id} 
          className="water-ripple" 
          style={{ left: r.x, top: r.y }} 
        />
      ))}
    </div>
  );
};

export default ZenWaterGarden;
