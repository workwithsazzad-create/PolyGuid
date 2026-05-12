import React from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from './GlassmorphicCard';
import { PlayCircle, BookOpen, FileText } from 'lucide-react';
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
  isBook?: boolean;
  affiliateLink?: string;
}

import { Link } from 'react-router-dom';

export default function CourseCard({ id, title, description, price, originalPrice, thumbnail, classes = 12, isEnrolled = false, isBook = false, affiliateLink }: CourseCardProps) {
  const hasDiscount = Boolean(originalPrice && originalPrice > price);
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  const affiliateMatch = description?.match(/\[meta:affiliate_link:([^\]]+)\]/);
  const actualAffiliateLink = affiliateLink || (affiliateMatch ? affiliateMatch[1] : null);

  const CardWrapper = ({ children, className }: any) => <Link to={`/course/${id}`} className={className}>{children}</Link>;

  return (
    <CardWrapper className="block h-full no-underline">
      <GlassmorphicCard 
        hoverEffect 
        className="flex flex-col gap-0.5 p-1 sm:p-1.5 h-full cursor-pointer bg-white dark:bg-[#1a1a1a] border-none shadow-sm hover:shadow-md transition-all rounded-xl"
      >
        <div className={`relative ${isBook ? 'aspect-[1/1.3]' : 'aspect-[16/9]'} rounded-lg overflow-hidden bg-gray-100`}>
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
          {isBook && (
            <div className="absolute top-1.5 right-1.5 bg-white/95 dark:bg-black/80 backdrop-blur text-[var(--primary)] text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 border border-white/20 dark:border-white/10 z-10 uppercase tracking-wider">
              {actualAffiliateLink ? <BookOpen size={10} /> : <FileText size={10} />}
              {actualAffiliateLink ? 'Hard Copy' : 'PDF Book'}
            </div>
          )}
          {!isBook && (
            <div className="absolute top-1.5 right-1.5">
               <div className="w-5 h-5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-300">
                  <PlayCircle size={10} />
               </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-0.5 p-0.5">
          <h3 className="text-[9px] sm:text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight h-[2.1em] overflow-hidden">
            {title}
          </h3>
          
          <div className="flex items-center gap-1 mt-auto">
            <span className="text-[10px] sm:text-[11px] font-black text-[var(--primary)]">
              ৳{price}
            </span>
            {hasDiscount && (
              <span className="text-[7.5px] sm:text-[8px] text-gray-400 line-through">
                ৳{originalPrice}
              </span>
            )}
          </div>
          
          <div 
            className={`w-full py-0.5 sm:py-1 rounded-md font-black text-[8.5px] sm:text-[9.5px] uppercase tracking-wider text-center transition-all shadow-none ${
              isEnrolled 
                ? 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10' 
                : 'bg-[var(--primary)] text-white'
            }`}
          >
            {isEnrolled ? (isBook ? 'Purchased' : 'Enrolled') : (isBook ? 'Buy Now' : 'Enroll')}
          </div>
        </div>
      </GlassmorphicCard>
    </CardWrapper>
  );
}

const CourseBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute bottom-1.5 right-1.5 bg-[var(--primary)] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
    {children}
  </div>
);
