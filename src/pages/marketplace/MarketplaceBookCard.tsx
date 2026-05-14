import React from 'react';
import { MapPin, Clock, BadgeCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';

export default function MarketplaceBookCard({ book }: { book: any; key?: any }) {
  const navigate = useNavigate();
  const isVerified = book.profiles?.is_verified || book.profiles?.role === 'admin';

  return (
    <GlassmorphicCard 
      hoverEffect
      onClick={() => navigate(`/marketplace/book/${book.id}`)}
      className="p-1 sm:p-1.5 cursor-pointer bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 shadow-sm hover:shadow-md transition-all rounded-xl"
    >
      <div className="flex flex-col h-full">
        <div className="relative aspect-[1/1.3] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
          <img 
            src={book.image_url} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {book.status === 'sold' && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest z-10">
              Sold
            </div>
          )}
          {isVerified && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white p-0.5 rounded-full z-10">
              <BadgeCheck size={10} className="fill-blue-500 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>
        
        <div className="p-1.5 sm:p-2 flex flex-col flex-1">
          <div className="text-[10px] sm:text-xs font-black text-[#32CD32] mb-0.5">
            ৳{book.price}
          </div>
          
          <h3 className="text-[10px] sm:text-[11px] font-bold text-[var(--text)] line-clamp-2 leading-tight group-hover:text-[#32CD32] transition-colors mb-1 flex-1">
            {book.title}
          </h3>
          
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium line-clamp-1 mb-2 uppercase tracking-wider">
            {book.department}
          </p>
  
          {/* Seller Info */}
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-black/5 dark:border-white/5">
            <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
              {book.profiles?.avatar_url ? (
                <img src={book.profiles.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                <User size={10} className="text-gray-400" />
              )}
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
              {book.profiles?.full_name || 'Anonymous'}
              {isVerified && <BadgeCheck size={10} className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full" />}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[7px] sm:text-[8px] text-gray-400 font-bold mt-auto gap-1">
            <div className="flex items-center gap-1">
              <MapPin size={9} />
              <span className="truncate max-w-[60px]">{book.district}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={9} />
              <span>
                {new Date(book.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassmorphicCard>
  );
}
