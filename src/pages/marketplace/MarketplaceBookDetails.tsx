import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Phone, MessageSquare, ArrowLeft, MapPin, Map, Share2, Tag, Book, User } from 'lucide-react';

export default function MarketplaceBookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookInfo();
  }, [id]);

  const fetchBookInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_books')
        .select(`*`)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Fetch seller name from profiles
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user_id).maybeSingle();
      data.seller_name = profile?.full_name || 'Unknown User';

      // Increment views manually
      const nextViews = (data.views || 0) + 1;
      await supabase.from('marketplace_books').update({ views: nextViews }).eq('id', id).catch(() => {});
      data.views = nextViews;

      setBook(data);
    } catch (e) {
      console.error(e);
      alert('Book not found');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Check out ${book.title} on PolyGuid Marketplace for ৳${book.price}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]"><div className="w-8 h-8 rounded-full border-4 border-[#00c48c] border-t-transparent animate-spin" /></div>;
  }
  if (!book) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header Mobile - Transparent over image */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center active:scale-95 transition">
          <ArrowLeft size={20} />
        </button>
        <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center active:scale-95 transition">
          <Share2 size={20} />
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full lg:mt-8 lg:rounded-3xl overflow-hidden bg-white dark:bg-[#121212] lg:border border-black/5 dark:border-white/10 lg:shadow-xl relative">
        {/* Image */}
        <div className="w-full aspect-square sm:aspect-video bg-gray-100 dark:bg-white/5 relative">
          <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
        </div>

        {/* Details Section */}
        <div className="p-5 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] leading-snug">{book.title}</h1>
            <div className="text-3xl font-black text-[#00c48c]">৳{book.price}</div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Book size={12} className="opacity-50" /> {book.department}
              </span>
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag size={12} className="opacity-50" /> Semester {book.semester}
              </span>
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MapPin size={12} className="opacity-50" /> {book.district}, {book.upazila}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium">
              <span>{new Date(book.created_at).toLocaleDateString()}</span>
              {book.views > 0 && <span className="flex items-center gap-1.5">👁 {book.views} views</span>}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-black/5 dark:border-white/5">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{book.description}</p>
            <p className="text-sm text-gray-500 font-medium pt-2">Seller: {book.seller_name}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-black/5 dark:border-white/5">
            <a 
              href={`tel:${book.phone}`}
              className="flex items-center justify-center gap-2 py-3.5 bg-[#00c48c]/10 text-[#00c48c] hover:bg-[#00c48c]/20 rounded-xl font-bold transition-colors"
            >
              <Phone size={18} /> <span className="hidden sm:inline">Call</span>
            </a>
            <button 
              onClick={() => navigate(`/messages?userId=${book.user_id}`)}
              className="flex items-center justify-center gap-2 py-3.5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl font-bold text-[var(--text)] transition-colors"
            >
              <MessageSquare size={18} /> <span className="hidden sm:inline">Message</span>
            </button>
            <a 
              href={`https://wa.me/${book.whatsapp || book.phone}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl font-bold text-[var(--text)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
