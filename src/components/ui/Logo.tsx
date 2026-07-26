import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { GraduationCap } from 'lucide-react';
import darkLogoAsset from '@/src/assets/darklogo.png';
import whiteLogoAsset from '@/src/assets/whitelogo.png';

interface LogoProps {
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
  customLogoUrl?: string;
}

export default function Logo({ 
  className, 
  imgClassName: customImgClassName, 
  textClassName: customTextClassName,
  showText = true,
  theme: themeProp,
  customLogoUrl
}: LogoProps) {
  const [hasError, setHasError] = useState(false);
  const isLight = themeProp === 'light';
  const isDark = themeProp === 'dark';

  return (
    <div className={cn("flex flex-col items-start w-fit select-none group", className)}>
      <div className="flex items-center justify-start w-full relative">
        {hasError ? (
          /* Graceful Fallback Vector Logo if image files fail or 404 on deployment */
          <div className="flex items-center gap-2 py-0.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#28a428] to-[#32CD32] text-white flex items-center justify-center shadow-md shadow-[#32CD32]/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight font-sans">
              <span className="text-[#32CD32]">P</span>
              <span className="text-gray-900 dark:text-white">oly</span>
              <span className="text-[#32CD32]">G</span>
              <span className="text-gray-900 dark:text-white">uide</span>
            </span>
          </div>
        ) : (
          <>
            {customLogoUrl ? (
              <img 
                src={customLogoUrl} 
                alt="PolyGuide Logo"
                onError={() => setHasError(true)}
                className={cn("h-[38px] sm:h-[42px] w-auto object-contain", customImgClassName)}
              />
            ) : (
              <>
                {/* Dark Logo (shown in light mode) */}
                <img 
                  src={darkLogoAsset} 
                  alt="PolyGuide Logo" 
                  onError={() => setHasError(true)}
                  className={cn(
                    "h-[38px] sm:h-[42px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]",
                    themeProp 
                      ? (isLight ? "block" : "hidden")
                      : "dark:hidden block",
                    customImgClassName
                  )}
                />

                {/* White Logo (shown in dark mode) */}
                <img 
                  src={whiteLogoAsset} 
                  alt="PolyGuide Logo" 
                  onError={() => setHasError(true)}
                  className={cn(
                    "h-[38px] sm:h-[42px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]",
                    themeProp 
                      ? (isDark ? "block" : "hidden")
                      : "hidden dark:block",
                    customImgClassName
                  )}
                />
              </>
            )}
          </>
        )}
      </div>

      {showText && (
        <div 
          className={cn(
            "w-full flex justify-between font-bold text-[10px] sm:text-[11.5px] uppercase leading-none whitespace-nowrap text-gray-500 dark:text-gray-400 mt-0.5 px-0 tracking-wider",
            customTextClassName
          )}
        >
          {"YOUR LEARNING PARTNER".split("").map((char, i) => (
            <span key={i} className={char === " " ? "inline-block w-1" : ""}>{char}</span>
          ))}
        </div>
      )}
    </div>
  );
}
