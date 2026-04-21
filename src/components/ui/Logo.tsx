import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { logoDarkB64, logoLightB64 } from './logo-data';

interface LogoProps {
  className?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export default function Logo({ className, showText = true, theme = 'dark' }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = theme === 'light' ? logoDarkB64 : logoLightB64;

  // Reset error state if theme changes
  useEffect(() => {
    setImgError(false);
  }, [theme]);

  // Adjust Logo image wrapper class based on text presence and use CSS object-position to hide the text
  const imgWrapperClassName = cn(
    "relative flex items-center justify-start overflow-hidden",
    showText ? "h-24 sm:h-28 justify-center" : "h-[30px] w-[125px]" 
  );

  const imgClassName = cn(
    "h-[51px] max-w-none w-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] object-contain origin-top-left absolute top-[-12px] left-[-0px] pr-0",
    showText ? "relative top-0 left-0 h-full max-w-full" : ""
  );

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={imgWrapperClassName}>
        {!imgError ? (
          <img 
            src={logoSrc} 
            alt="PolyGuid Logo" 
            referrerPolicy="no-referrer"
            className={imgClassName}
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
          "font-bold text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-[-10px] sm:mt-[-22px] whitespace-nowrap",
          theme === 'light' ? "text-[#4a4a4a]" : "text-gray-400"
        )}>
          Your learning partner
        </p>
      )}
    </div>
  );
}
