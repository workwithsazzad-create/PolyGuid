import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketplaceBookCard({ book }: { book: any }) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/marketplace/book/${book.id}`)}
      className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="relative aspect-[1/1.3] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
        <img 
          src={book.image_url} 
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
      
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <div className="text-xs sm:text-sm font-black text-[#00c48c] mb-0.5">
          ৳{book.price}
        </div>
        
        <h3 className="text-[11px] sm:text-xs font-bold text-[var(--text)] line-clamp-2 leading-tight group-hover:text-[#00c48c] transition-colors mb-1 flex-1">
          {book.title}
        </h3>
        
        <p className="text-[9px] text-gray-500 font-medium line-clamp-1 mb-2 uppercase tracking-wider">
          {book.department}
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[8px] sm:text-[9px] text-gray-400 font-bold pt-2 border-t border-black/5 dark:border-white/5 gap-1">
          <div className="flex items-center gap-1">
            <MapPin size={10} />
            <span className="truncate max-w-[80px]">{book.district}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>
              {new Date(book.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
