import React from 'react';
import heroImg from '@/src/assets/hero.png';

interface PolyGuideIconProps {
  className?: string;
  size?: number;
  iconUrl?: string;
}

export default function PolyGuideIcon({ className = "w-16 h-16", size, iconUrl }: PolyGuideIconProps) {
  const imgSrc = iconUrl || heroImg;

  return (
    <img 
      src={imgSrc} 
      alt="PolyGuide App Icon" 
      referrerPolicy="no-referrer"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}
