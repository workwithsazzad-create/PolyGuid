import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Search, MapPin, Plus, List, ArrowLeft } from 'lucide-react';
import CourseCard from '@/src/components/ui/CourseCard';
import MarketplaceBookCard from './MarketplaceBookCard';

export default function MarketplaceHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [district, setDistrict] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  
  const [polyguidBooks, setPolyguidBooks] = useState<any[]>([]);
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [district, semester, department]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Polyguid books (affiliate hard copies)
      const { data: adminBooks } = await supabase
        .from('courses')
        .select('*')
        .contains('categories', ['বই'])
        .like('description', '%[meta:affiliate_link:%')
        .order('created_at', { ascending: false });

      if (adminBooks) {
        setPolyguidBooks(adminBooks.map(c => {
          const metaMatch = c.description?.match(/\[meta:fake_user_count:(\d+)\]/);
          const affiliateMatch = c.description?.match(/\[meta:affiliate_link:([^\]]+)\]/);
          let cleanDesc = c.description?.replace(/\[meta:fake_user_count:\d+\]/g, '') || '';
          cleanDesc = cleanDesc.replace(/\[meta:affiliate_link:[^\]]+\]/g, '').trim();
          
          return {
            id: c.id,
            title: c.title,
            description: cleanDesc,
            price: c.price,
            originalPrice: c.original_price,
            thumbnail: c.thumbnail_url || "https://placehold.co/1000x1430/1a1a1a/e11d48?text=Book",
            classes: c.classes_count,
            categories: c.categories || [],
            affiliateLink: affiliateMatch ? affiliateMatch[1] : null,
            totalUsers: metaMatch ? parseInt(metaMatch[1]) : 0
          };
        }));
      }

      // 2. Fetch User Books
      let userQuery = supabase
        .from('marketplace_books')
        .select(`*, user:user_id(id)`)
        .order('created_at', { ascending: false });
        
      if (district) userQuery = userQuery.eq('district', district);
      if (semester) userQuery = userQuery.eq('semester', semester);
      if (department) userQuery = userQuery.eq('department', department);

      const { data: usersBooksList } = await userQuery;
      if (usersBooksList) {
        setUserBooks(usersBooksList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPolyguid = polyguidBooks.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = userBooks.filter(b => {
    const q = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || 
           b.department?.toLowerCase().includes(q) || 
           b.district?.toLowerCase().includes(q) || 
           b.upazila?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-[var(--background)] lg:min-h-[calc(100vh-64px)] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 lg:hidden">
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
             </button>
             <div>
                <h1 className="text-lg sm:text-2xl font-black text-[var(--text)] tracking-tight">Marketplace</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Buy and sell engineering books</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/marketplace/my-posts')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 dark:bg-white/5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <List size={14} /> <span className="hidden sm:inline">My Posts</span>
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="w-full">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="বইয়ের নাম অথবা ঠিকানা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00c48c] text-sm font-medium shadow-sm"
            />
          </div>

          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-[1/1.4] bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {/* Polyguid Books Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">Polyguid থেকে প্রকাশিত</h2>
                    <span className="text-xs text-gray-500 font-bold px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-full">{filteredPolyguid.length}টি বই</span>
                  </div>
                  {filteredPolyguid.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                      {filteredPolyguid.map(book => (
                        <CourseCard key={book.id} {...book} isBook={true} isEnrolled={false} affiliateLink={book.affiliateLink} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/5 p-8 text-center text-gray-500 text-sm shadow-sm">কোনো বই পাওয়া যায়নি</div>
                  )}
                </div>

                {/* User Books Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">অন্যান্য ইউজারদের বই</h2>
                    <span className="text-xs text-gray-500 font-bold px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-full">{filteredUsers.length}টি বই</span>
                  </div>
                  {filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                      {filteredUsers.map(book => (
                        <MarketplaceBookCard key={book.id} book={book} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/5 p-8 text-center text-gray-500 text-sm shadow-sm">কোনো বই পাওয়া যায়নি</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile & Desktop */}
      <div className="fixed bottom-20 lg:bottom-10 right-4 lg:right-10 z-40">
        <button
          onClick={() => navigate('/marketplace/post')}
          className="w-14 h-14 bg-[#00c48c] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,196,140,0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
