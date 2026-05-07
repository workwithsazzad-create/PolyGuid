import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { logoDarkB64, logoLightB64 } from './logo-data';

interface LogoProps {
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export default function Logo({ 
  className, 
  imgClassName: customImgClassName, 
  textClassName: customTextClassName, 
  showText = true, 
  theme = 'dark' 
}: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = theme === 'light' ? logoDarkB64 : logoLightB64;

  // Reset error state if theme changes
  useEffect(() => {
    setImgError(false);
  }, [theme]);

  // Adjust Logo image wrapper class based on text presence
  const imgWrapperClassName = cn(
    "relative flex items-center transition-all",
    showText ? "h-20 sm:h-24" : "h-[40px] w-[150px]" 
  );

  const imgClassName = cn(
    "h-full w-auto object-contain transition-all",
    !showText ? "max-w-none absolute left-0 top-0 scale-[1.3]" : "relative",
    customImgClassName
  );

  return (
    <div className={cn("flex flex-col items-start", className)}>
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
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-[var(--primary)] rounded-lg" />
            {showText && (
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-[var(--primary)]">Poly</span>
                <span className="text-[var(--text)]">Guid</span>
              </span>
            )}
          </div>
        )}
      </div>
      {!imgError && showText && (
        <p className={cn(
          "font-bold text-[8.5px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.18em] uppercase opacity-70 leading-none whitespace-nowrap",
          theme === 'light' ? "text-gray-600" : "text-gray-400",
          customTextClassName
        )}>
          Your Learning Partner
        </p>
      )}
    </div>
  );
}
