import React from 'react';
import { cn } from '@/src/lib/utils';

interface LogoProps {
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
  customLogoUrl?: string;
}

export const LIGHT_LOGO_URL = "https://i.imgur.com/FupjuNz.png";
export const DARK_LOGO_URL = "https://i.imgur.com/IA7WO68.png";

export default function Logo({ 
  className, 
  imgClassName: customImgClassName, 
  textClassName: customTextClassName,
  showText = true,
  theme: themeProp,
  customLogoUrl
}: LogoProps) {
  const isLight = themeProp === 'light';
  const isDark = themeProp === 'dark';

  return (
    <div className={cn("flex flex-col items-start w-fit select-none group", className)}>
      <div className="flex items-center justify-start w-full relative">
        {customLogoUrl ? (
          <img 
            src={customLogoUrl} 
            alt="PolyGuide Logo"
            referrerPolicy="no-referrer"
            className={cn("h-[38px] sm:h-[42px] w-auto object-contain", customImgClassName)}
          />
        ) : (
          <>
            {/* Light Mode Logo (shown in light mode) */}
            <img 
              src={LIGHT_LOGO_URL} 
              alt="PolyGuide Logo" 
              referrerPolicy="no-referrer"
              className={cn(
                "h-[38px] sm:h-[42px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]",
                themeProp 
                  ? (isLight ? "block" : "hidden")
                  : "dark:hidden block",
                customImgClassName
              )}
            />

            {/* Dark Mode Logo (shown in dark mode) */}
            <img 
              src={DARK_LOGO_URL} 
              alt="PolyGuide Logo" 
              referrerPolicy="no-referrer"
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
