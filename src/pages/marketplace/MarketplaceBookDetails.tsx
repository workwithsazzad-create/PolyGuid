import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Phone, MessageSquare, MapPin, Clock, Share2, Tag, Book, User, ChevronLeft, ChevronRight, Eye, BadgeCheck } from 'lucide-react';

export default function MarketplaceBookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });
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
      
      // Fetch seller info from profiles
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', data.user_id).maybeSingle();
      data.seller_name = profile?.full_name || 'Unknown User';
      data.seller_avatar = profile?.avatar_url;
      data.seller_role = profile?.role;

      // Increment views manually
      const nextViews = (data.views || 0) + 1;
      await supabase.from('marketplace_books').update({ views: nextViews }).eq('id', id);
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

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months} months ago`;
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return `${mins} mins ago`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]"><div className="w-8 h-8 rounded-full border-4 border-[#32CD32] border-t-transparent animate-spin" /></div>;
  }
  if (!book) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 h-14 flex items-center justify-center">
        <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest truncate max-w-[200px]">{book.title}</h2>
        <button 
          onClick={async () => {
             if (navigator.share) {
               try {
                 await navigator.share({
                   title: book.title,
                   text: `Check out this book: ${book.title}`,
                   url: window.location.href,
                 });
               } catch(e) {}
             }
          }}
          className="absolute right-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Share2 size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Image Gallery Mockup */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video bg-white dark:bg-white/5 overflow-hidden shadow-inner">
          <img src={book.image_url} alt={book.title} className="w-full h-full object-contain" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 focus:outline-none">
            <div className="w-2 h-2 rounded-full bg-[#32CD32]" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-5 sm:p-8 border border-black/5 dark:border-white/5 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] leading-tight">{book.title}</h1>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{book.department} Section</p>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#32CD32] whitespace-nowrap ml-4">৳{book.price}</div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 border border-black/5">
                  <MapPin size={14} className="text-[#32CD32]" /> {book.district}, {book.upazila}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 border border-black/5">
                  <Clock size={14} /> {getTimeAgo(book.created_at)}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 border border-black/5">
                  <Eye size={14} /> {book.views || 0} views
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-black/5 dark:bg-white/5" />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-[0.2em] opacity-50">Description</h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                {book.description || "বইটি এখন পর্যন্ত খুব ভালো কন্ডিশন এ আছে চাইলে নিতে পারেন। কোনো পেজ ছেঁড়া বা দাগ নেই। বিস্তারিত জানতে কল করুন।"}
              </p>
            </div>

            {/* Seller info */}
            <div className="flex items-center gap-4 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5">
                {book.seller_avatar ? (
                  <img src={book.seller_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-[#32CD32]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seller</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <h4 className="text-sm font-black text-[var(--text)] break-words leading-tight">{book.seller_name}</h4>
                  {(book.seller_role === 'admin' || book.user_id === '01993879904' || book.seller_name?.includes('PolyGuid')) && (
                    <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-[1.125rem] h-[1.125rem] shrink-0" size={16} />
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons Inside Card */}
            {currentUser?.id !== book.user_id ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                <a 
                  href={`tel:${book.phone}`}
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#32CD32] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#32CD32]/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                >
                  <Phone size={20} /> Call
                </a>
                <button 
                  onClick={() => navigate(`/messages?userId=${book.user_id}`)}
                  className="flex items-center justify-center gap-2 py-3.5 border-2 border-[#32CD32]/30 text-[var(--text)] rounded-2xl font-black text-sm hover:bg-[#32CD32]/5 transition-all text-center"
                >
                  <MessageSquare size={20} /> SMS
                </button>
                <a 
                  href={`https://wa.me/${book.whatsapp?.replace(/[^0-9]/g, '') || book.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 border-2 border-[#32CD32]/30 text-[var(--text)] rounded-2xl font-black text-sm hover:bg-[#32CD32]/5 transition-all text-center"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg> WhatsApp
                </a>
              </div>
            ) : (
              <div className="pt-4 border-t border-black/5 dark:border-white/5 text-center">
                <p className="text-xs font-bold text-gray-400 italic">আপনি আপনার নিজের পোস্টে যোগাযোগ করতে পারবেন না</p>
              </div>
            )}
          </div>

          {/* Safety Tips */}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-4 border border-orange-100 dark:border-orange-900/20">
             <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-2 uppercase tracking-wider">
               <svg style={{width: 16, height: 16}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
               Safety Tips
             </h4>
             <ul className="text-[10px] sm:text-xs text-orange-600/80 dark:text-orange-400/60 font-medium space-y-1 ml-6 list-disc">
               <li>পেমেন্ট করার আগে সরাসরি বইটি দেখে বুঝে নিন।</li>
               <li>বইয়ের কন্ডিশন ভালো করে যাচাই করুন।</li>
               <li>ভুলেও আগে বিকাশ বা নগদে টাকা পাঠাবেন না।</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
