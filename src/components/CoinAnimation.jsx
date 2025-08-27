import React, { useState, useEffect } from 'react';

const CoinAnimation = ({ coins, isVisible, onComplete, isCelebration = false }) => {
  const [particles, setParticles] = useState([]);
  const [animationState, setAnimationState] = useState('fadeIn');

  useEffect(() => {
    if (isVisible && coins > 0) {
      setAnimationState('fadeIn');
      
      if (isCelebration) {
        // Celebration mode - particles multiplied by coins earned
        const coinCount = Math.max(coins * 2, 10); // 2x coins earned, minimum 10
        const newParticles = Array.from({ length: coinCount }, (_, i) => ({
          id: i,
          x: Math.random() * 200 - 100, // Wider spread for celebration
          y: Math.random() * 200 - 100, // Wider spread for celebration
          rotation: Math.random() * 360,
          scale: 0.3 + Math.random() * 0.7, // Varied sizes
          delay: i * 50, // Faster animation for celebration
          opacity: 1,
          finalX: (Math.random() - 0.5) * 300, // Final positions spread out
          finalY: (Math.random() - 0.5) * 300 - 100 // Move up and out
        }));
        
        setParticles(newParticles);
      } else {
        // Regular mode - just the number, no particles
        setParticles([]);
      }

      setTimeout(() => {
        setAnimationState('visible');
        
        setTimeout(() => {
          setAnimationState('fadeOut');
          
          if (isCelebration) {
            // Animate celebration particles outward
            setTimeout(() => {
              setParticles(prev => prev.map(p => ({ 
                ...p, 
                x: p.finalX,
                y: p.finalY,
                opacity: 0,
                scale: p.scale * 0.5
              })));
              setTimeout(() => {
                onComplete();
              }, 1500);
            }, 500);
          } else {
            // Regular fade out
            setTimeout(() => {
              onComplete();
            }, 500);
          }
        }, 800);
      }, 100);

      return () => {
        setAnimationState('fadeIn');
      };
    }
  }, [isVisible, coins, onComplete, isCelebration]);

  if (!isVisible || coins === 0) return null;

  const getAnimationClasses = () => {
    switch (animationState) {
      case 'fadeIn':
        return 'opacity-0 translate-y-4';
      case 'visible':
        return 'opacity-100 translate-y-0';
      case 'fadeOut':
        return 'opacity-0 -translate-y-4';
      default:
        return 'opacity-0 translate-y-4';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Main coin number with fade and movement animation */}
      <div className={`text-4xl font-bold text-yellow-500 text-center transition-all duration-500 ease-out ${getAnimationClasses()}`}>
        +{coins}
      </div>
      
      {/* Celebration coin particles - only show during celebration */}
      {isCelebration && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute text-lg animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            opacity: particle.opacity,
            transition: `all 1.5s ease-out ${particle.delay}ms`
          }}
        >
          💰
        </div>
      ))}
      
      {/* Celebration sparkle effects - only show during celebration */}
      {isCelebration && Array.from({ length: 15 }, (_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
          style={{
            left: `${Math.cos(i * 24 * Math.PI / 180) * 60}%`,
            top: `${Math.sin(i * 24 * Math.PI / 180) * 60}%`,
            animationDelay: `${i * 80}ms`
          }}
        />
      ))}
    </div>
  );
};

export default CoinAnimation;
