import React from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from './GlassmorphicCard';
import { PlayCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDirectLink } from '@/src/lib/utils';

interface CourseCardProps {
  id?: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  classes?: number;
  isEnrolled?: boolean;
}

import { Link } from 'react-router-dom';

export default function CourseCard({ id, title, description, price, originalPrice, thumbnail, classes = 12, isEnrolled = false }: CourseCardProps) {
  const hasDiscount = Boolean(originalPrice && originalPrice > price);
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <Link to={`/course/${id}`} className="block h-full no-underline">
      <GlassmorphicCard 
        hoverEffect 
        className="flex flex-col gap-1.5 p-1.5 sm:p-2.5 h-full cursor-pointer bg-white dark:bg-[#1a1a1a] border-none shadow-sm hover:shadow-md transition-all rounded-xl"
      >
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={getDirectLink(thumbnail)} 
            alt={title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {hasDiscount && (
            <CourseBadge>
              {discountPercent}% OFF
            </CourseBadge>
          )}
          <div className="absolute top-1.5 right-1.5">
             <div className="w-6 h-6 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400">
                <BookOpen size={12} />
             </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-0.5 p-0.5">
          <h3 className="text-[9px] sm:text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight h-[2.5em]">
            {title}
          </h3>
          
          <div className="flex items-center gap-1 mt-auto">
            <span className="text-[10px] sm:text-xs font-black text-[var(--primary)]">
              ৳{price}
            </span>
            {hasDiscount && (
              <span className="text-[7px] sm:text-[9px] text-gray-400 line-through">
                ৳{originalPrice}
              </span>
            )}
          </div>
          
          <div 
            className={`w-full py-1 sm:py-1.5 rounded-md font-black text-[8px] sm:text-[10px] uppercase tracking-wider text-center transition-all shadow-none ${
              isEnrolled 
                ? 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10' 
                : 'bg-[var(--primary)] text-white'
            }`}
          >
            {isEnrolled ? 'Enrolled' : 'Enroll'}
          </div>
        </div>
      </GlassmorphicCard>
    </Link>
  );
}

const CourseBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute bottom-1 right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
    {children}
  </div>
);
