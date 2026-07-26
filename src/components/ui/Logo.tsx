import React from 'react';
import { cn } from '@/src/lib/utils';
import { useTheme } from '../ThemeProvider';

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
  theme: themeProp 
}: LogoProps) {
  let theme = themeProp;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const themeContext = useTheme();
    if (!theme) {
      theme = themeContext.theme as 'light' | 'dark';
    }
  } catch (e) {
    if (!theme) theme = 'dark';
  }

  // Light mode -> dark logo (/darklogo.png)
  // Dark mode -> white logo (/whitelogo.png)
  const logoSrc = theme === 'light' ? '/darklogo.png' : '/whitelogo.png';

  return (
    <div className={cn("flex flex-col items-start w-fit select-none", className)}>
      <div className="flex items-center justify-start">
        <img 
          src={logoSrc} 
          alt="PolyGuide Logo" 
          className={cn(
            "h-20 sm:h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]",
            customImgClassName
          )}
        />
      </div>

      {showText && (
        <div 
          className={cn(
            "w-full flex justify-between font-bold text-[10px] sm:text-[12px] uppercase leading-none whitespace-nowrap text-gray-500 dark:text-gray-400 mt-0.5 px-0 tracking-wider",
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
