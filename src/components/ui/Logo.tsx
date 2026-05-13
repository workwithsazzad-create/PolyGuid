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
    showText ? "h-20 sm:h-24 lg:h-28" : "h-[40px] w-[150px]" 
  );

  const imgClassName = cn(
    "h-full w-auto object-contain transition-all",
    !showText ? "max-w-none absolute left-0 top-0 scale-[1.3]" : "relative z-10",
    customImgClassName
  );

  return (
    <div className={cn("flex flex-col items-center w-fit mx-auto", className)}>
      <div className={imgWrapperClassName}>
        {!imgError ? (
          <img 
            src={logoSrc} 
            alt="PolyGuid Logo" 
            referrerPolicy="no-referrer"
            className={imgClassName}
            style={{ paddingTop: '0px', paddingLeft: '2px', marginLeft: '0px', marginTop: '-100px' }}
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
        <div className={cn(
          "w-full flex justify-between font-bold text-[7.5px] sm:text-[10px] lg:text-[12px] uppercase leading-none whitespace-nowrap px-0.5",
          "text-gray-500 dark:text-gray-400",
          customTextClassName
        )} style={{ marginTop: '-70px', marginLeft: '-5px', marginRight: '-6px', marginBottom: '63px' }}>
          {"YOUR LEARNING PARTNER".split("").map((char, i) => (
            <span key={i} className={char === " " ? "inline-block w-1" : ""}>{char}</span>
          ))}
        </div>
      )}
    </div>
  );
}
