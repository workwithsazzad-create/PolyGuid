import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { ArrowLeft, Trash2, Box, AlertTriangle, X, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MarketplaceMyPosts() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('marketplace_books')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSold = async (id: string | null) => {
    if (!id) return;
    setIsProcessing(true);
    try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) return alert('Session expired, please login again');

       // 1. Get the book to find image URL before deleting
       const { data: book } = await supabase
         .from('marketplace_books')
         .select('image_url')
         .eq('id', id)
         .single();

       // 2. Delete the record from database
       const { error: deleteError } = await supabase
         .from('marketplace_books')
         .delete()
         .eq('id', id)
         .eq('user_id', session.user.id);
       
       if (deleteError) throw deleteError;

       // 3. Delete the image from storage if it exists
       if (book?.image_url) {
         try {
           const imageUrl = book.image_url;
           // Extract path from public URL: https://.../public/marketplace/path/to/file
           const pathParts = imageUrl.split('/public/marketplace/');
           if (pathParts.length > 1) {
             const filePath = pathParts[1];
             await supabase.storage
               .from('marketplace')
               .remove([filePath]);
           }
         } catch (storageErr) {
           console.error('Error deleting image from storage:', storageErr);
         }
       }
       
       setBooks(prev => prev.filter(b => b.id !== id));
       setShowConfirm(false);
       setSelectedBookId(null);
    } catch (e: any) {
       console.error(e);
       alert('Failed to delete: ' + (e.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <header className="bg-white dark:bg-[#121212] border-b border-black/5 dark:border-white/5 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <h1 className="text-xl font-black text-[var(--text)]">My Posts</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 py-8">
        {isLoading ? (
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}
           </div>
        ) : books.length > 0 ? (
           <div className="flex flex-col gap-3">
             {books.map(book => (
               <div key={book.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/5 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group">
                 <div className="flex flex-col flex-1">
                   <h3 className="text-sm font-bold text-[var(--text)] line-clamp-1 mb-1">{book.title}</h3>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                     <p className="text-[#32CD32] font-black text-sm">৳{book.price}</p>
                     <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{book.department}</p>
                     <p className="text-xs text-gray-500">{new Date(book.created_at).toLocaleDateString()}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => {
                     setSelectedBookId(book.id);
                     setShowConfirm(true);
                   }}
                   className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors ml-4 whitespace-nowrap"
                 >
                   <Trash2 size={16} /> <span className="hidden sm:inline">Mark as Sold</span>
                 </button>
               </div>
             ))}
           </div>
        ) : (
           <div className="text-center py-32 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-6">
                 <Box size={32} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">No active posts!</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">You haven't posted any books yet. Start selling your engineering books today.</p>
              <button 
                onClick={() => navigate('/marketplace/post')}
                className="px-6 py-3 bg-[#32CD32] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                 Post a Book
              </button>
           </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setShowConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative border border-black/5 dark:border-white/5"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-600 mb-6 mx-auto">
                  <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-xl font-black text-[var(--text)] text-center mb-2">আপনি কি নিশ্চিত?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center text-sm font-bold mb-8">
                  বইটি কি সত্যিই বিক্রি হয়ে গেছে? এটি মার্কেটপ্লেস থেকে সরিয়ে ফেলা হবে।
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    disabled={isProcessing}
                    onClick={() => markAsSold(selectedBookId)}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isProcessing ? 'Processing...' : 'হ্যাঁ, সরিয়ে ফেলুন'}
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => setShowConfirm(false)}
                    className="w-full py-4 bg-gray-100 dark:bg-white/5 font-black rounded-2xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    না, থাক
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
