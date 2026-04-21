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
        className="flex flex-col gap-2 p-2 sm:p-3 h-full cursor-pointer bg-white dark:bg-[#1a1a1a] border-none shadow-md hover:shadow-xl transition-all"
      >
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100">
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
          <div className="absolute top-2 right-2">
             <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-400">
                <BookOpen size={14} />
             </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 p-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1 leading-snug">
            {title}
          </h3>
          
          {description && (
            <p className="text-[10px] text-gray-500 line-clamp-2 -mt-1">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-1 mt-auto">
            <span className="text-lg font-black text-[#1a237e] dark:text-indigo-400">
              ৳{price}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through">
                ৳{originalPrice}
              </span>
            )}
          </div>
          
          <div 
            className={`w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wider text-center transition-all shadow-sm ${
              isEnrolled 
                ? 'bg-gray-100 text-gray-400 border border-gray-200' 
                : 'bg-[#1a237e] text-white'
            }`}
          >
            {isEnrolled ? 'Enrolled' : 'Enroll Now'}
          </div>
        </div>
      </GlassmorphicCard>
    </Link>
  );
}

const CourseBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute bottom-2 right-2 bg-[#e8eaf6] text-[#3f51b5] text-[10px] font-bold px-2 py-1 rounded-md border border-[#c5cae9]">
    {children}
  </div>
);
