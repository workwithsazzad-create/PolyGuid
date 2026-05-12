import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketplaceBookCard({ book }: { book: any; key?: any }) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/marketplace/book/${book.id}`)}
      className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="relative aspect-[1/1.3] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
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
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[7px] sm:text-[8px] text-gray-400 font-bold pt-2 border-t border-black/5 dark:border-white/5 gap-1">
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
  );
}
