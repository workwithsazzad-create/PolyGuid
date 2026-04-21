import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

// We must use explicit imports so Vite's bundler guarantees the files are included in the dist folder for Vercel.
import logoDarkUrl from '/public/logo-dark.png';
import logoLightUrl from '/public/logo-light.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export default function Logo({ className, showText = true, theme = 'dark' }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = theme === 'light' ? logoDarkUrl : logoLightUrl;

  // Reset error state if theme changes
  useEffect(() => {
    setImgError(false);
  }, [theme]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative h-24 sm:h-28 flex items-center justify-center">
        {!imgError ? (
          <img 
            src={logoSrc} 
            alt="PolyGuid Logo" 
            className="h-full w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-24 h-24 relative flex items-center gap-3">
            {/* Fallback SVG if logo is not found */}
            <div className="w-12 h-12 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-400 fill-current">
                <path d="M10 20 L50 30 L90 20 L90 80 L50 90 L10 80 Z" fill="none" stroke="currentColor" strokeWidth="8" />
                <path d="M50 30 L50 90" stroke="currentColor" strokeWidth="4" />
              </svg>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#32CD32] fill-none stroke-current">
                <path 
                  d="M30 50 L45 65 L80 30" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_8px_rgba(50,205,50,0.8)]"
                />
              </svg>
            </div>
            {showText && (
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-gray-300">Poly</span>
                <span className="text-white">Guid</span>
              </span>
            )}
          </div>
        )}
      </div>
      {!imgError && showText && (
        <p className={cn(
          "font-bold text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-[-22px] whitespace-nowrap",
          theme === 'light' ? "text-[#4a4a4a]" : "text-gray-400"
        )}>
          Your learning partner
        </p>
      )}
    </div>
  );
}
