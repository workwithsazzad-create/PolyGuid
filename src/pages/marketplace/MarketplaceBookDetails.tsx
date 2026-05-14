import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  MessageSquare,
  BadgeCheck,
  Share2,
  Trash2,
  Eye,
  Loader2
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";

export default function MarketplaceBookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      if (!id) return;
      try {
        setLoading(true);
        let bookData = null;
        const { data, error } = await supabase
          .from('marketplace_books')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
      if (data) {
        setBook({ ...data });
        
        // Fetch profile info manually
        if (data.user_id) {
          const fetchProfile = async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, role, is_verified')
              .eq('id', data.user_id)
              .maybeSingle();
              
            if (profileData) {
              setBook((prev: any) => prev ? { ...prev, profiles: profileData } : null);
            }
          };

          fetchProfile();

          // Realtime profile sub
          const channel = supabase
            .channel(`profile-${data.user_id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${data.user_id}`
              },
              (payload) => {
                if (payload.new) {
                  setBook((prev: any) => prev ? { ...prev, profiles: payload.new } : null);
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
        
        // Increment view count using SQL
        try {
          await supabase.rpc('increment_book_views', { book_id: id });
        } catch (rpcError) {
          console.warn("Could not increment views:", rpcError);
        }
      }
    } catch (error) {
      console.error("Critical error fetching book:", error);
    } finally {
      setLoading(false);
    }
  };

  const cleanup = init();
  return () => {
    cleanup.then(fn => fn && fn());
  };
}, [id]);

  const handleDelete = async () => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই বইটি ডিলিট করতে চান?")) return;
    try {
      const { error } = await supabase
        .from('marketplace_books')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      alert('বইটি সফলভাবে ডিলিট করা হয়েছে');
      navigate("/marketplace");
    } catch (error) {
      console.error("Error deleting book:", error);
      alert('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#32CD32] animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-500 font-bold text-center">বইটি খুঁজে পাওয়া যায়নি অথবা ডিলিট করা হয়েছে</p>
        <button 
          onClick={() => navigate("/marketplace")}
          className="px-6 py-2 bg-[#32CD32] text-white rounded-xl font-bold active:scale-95 transition-all"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-10">
      <div className="max-w-5xl mx-auto border-x border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0a] min-h-screen shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 hidden md:flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text)]"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: book.title,
                    text: book.description,
                    url: window.location.href
                  });
                }
              }}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text)]"
            >
              <Share2 size={20} />
            </button>
            {currentUser?.id === book.user_id && (
              <button 
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors text-red-500"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Image Frame */}
        <div className="aspect-[4/3] md:aspect-[21/9] bg-[#f8f9fa] dark:bg-[#121212] relative flex items-center justify-center overflow-hidden border-b border-black/5 dark:border-white/5">
          {book.image_url ? (
            <img src={book.image_url} alt={book.title} className="w-full h-full object-contain p-4 md:p-8" />
          ) : (
            <div className="flex flex-col items-center gap-3 opacity-20">
              <User size={64} className="text-gray-400" />
              <p className="font-black text-sm uppercase tracking-widest">No Photo</p>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-5 md:p-6 space-y-5">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[20px] p-4 sm:p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-5">
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[var(--text)] leading-tight tracking-tight">{book.title}</h1>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{book.department} • {book.semester} Semester</p>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#32CD32] whitespace-nowrap">৳{book.price}</div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-white/5 rounded-full text-[9px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 border border-black/5">
                  <MapPin size={12} className="text-[#32CD32]" /> {book.district}, {book.upazila}
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-white/5 rounded-full text-[9px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 border border-black/5">
                  <Clock size={12} /> {getTimeAgo(book.created_at)}
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-white/5 rounded-full text-[9px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 border border-black/5">
                  <Eye size={12} /> {book.views || 0}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white dark:bg-white/10 flex items-center justify-center border border-black/5 overflow-hidden">
                  {book.profiles?.avatar_url ? (
                    <img src={book.profiles.avatar_url} alt={book.profiles.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-[var(--text)] leading-none">{book.profiles?.full_name || 'Anonymous Seller'}</span>
                    {(book.profiles?.is_verified || book.profiles?.role === 'admin') && (
                      <BadgeCheck size={14} className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a]" />
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5 tracking-tight">Seller Information</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-black/5 dark:bg-white/5" />

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-black text-[var(--text)] uppercase tracking-widest opacity-40">Description</h3>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                {book.description}
              </p>
            </div>

            {/* Action Buttons */}
            {currentUser?.id !== book.user_id ? (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <a 
                  href={`tel:${book.phone}`}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 bg-[#32CD32] text-white rounded-lg font-bold shadow-sm shadow-[#32CD32]/5 active:scale-95 hover:bg-[#28a428] transition-all text-center"
                >
                  <Phone size={14} /> <span className="text-[8px] sm:text-[9px] uppercase tracking-wide">Call</span>
                </a>
                <button 
                  onClick={() => navigate(`/messages?userId=${book.user_id}`)}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 bg-gray-100 dark:bg-white/5 text-[var(--text)] rounded-lg font-bold active:scale-95 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-center border border-black/5"
                >
                  <MessageSquare size={14} /> <span className="text-[8px] sm:text-[9px] uppercase tracking-wide">SMS</span>
                </button>
                <a 
                  href={`https://wa.me/${book.whatsapp?.replace(/[^0-9]/g, '') || book.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center gap-1 py-1.5 border border-[#32CD32]/20 text-[var(--text)] rounded-lg font-bold active:scale-95 hover:bg-[#32CD32]/5 transition-all text-center"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg> <span className="text-[8px] sm:text-[9px] uppercase tracking-wide">WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="pt-3 border-t border-black/5 dark:border-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-400">This is your listing</p>
              </div>
            )}
          </div>

          {/* Safety Tips */}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-3xl p-6 md:p-10 border border-orange-100 dark:border-orange-900/20">
             <h4 className="text-xs sm:text-sm font-black text-orange-700 dark:text-orange-400 flex items-center gap-3 mb-4 uppercase tracking-[0.2em]">
               <svg style={{width: 18, height: 18}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
               Safety Tips
             </h4>
             <ul className="text-xs sm:text-sm text-orange-800/70 dark:text-orange-400/80 font-bold space-y-2 ml-4 list-disc leading-relaxed">
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
