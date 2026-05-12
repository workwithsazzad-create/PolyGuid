import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { ArrowLeft, Trash2, Box } from 'lucide-react';

export default function MarketplaceMyPosts() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSold = async (id: string) => {
    if (!window.confirm('Are you sure the book is sold? This will permanently delete it from the marketplace.')) return;
    try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) return alert('Session expired, please login again');

       const { error } = await supabase
         .from('marketplace_books')
         .delete()
         .eq('id', id)
         .eq('user_id', session.user.id);

       if (error) throw error;
       setBooks(prev => prev.filter(b => b.id !== id));
    } catch (e: any) {
       console.error(e);
       alert('Failed to delete: ' + (e.message || 'Unknown error'));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <header className="bg-white dark:bg-[#121212] border-b border-black/5 dark:border-white/5 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/marketplace')} className="p-2 -ml-2 rounded-full hover:bg-black/5">
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
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
                     <p className="text-[#00c48c] font-black text-sm">৳{book.price}</p>
                     <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{book.department}</p>
                     <p className="text-xs text-gray-500">{new Date(book.created_at).toLocaleDateString()}</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => markAsSold(book.id)}
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
                className="px-6 py-3 bg-[#00c48c] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                 Post a Book
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
