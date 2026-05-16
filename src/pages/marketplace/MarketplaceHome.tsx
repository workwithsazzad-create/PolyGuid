import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Search, MapPin, Plus, List, Eye, ArrowLeft } from 'lucide-react';
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
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set());
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const DISTRICTS = [
    "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
  ];

  const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

  useEffect(() => {
    fetchEnrollments();
    fetchBooks();
  }, [district, semester, department]);

  const fetchEnrollments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', session.user.id);
      
      const { data: donationData } = await supabase
        .from('payments')
        .select('course_id, status')
        .eq('user_id', session.user.id)
        .in('status', ['approved', 'pending']);
      
      const enrolled = new Set<string>();
      const pending = new Set<string>();
      
      enrollmentData?.forEach(e => enrolled.add(e.course_id));
      donationData?.forEach(d => {
        if (d.status === 'approved') enrolled.add(d.course_id);
        else if (d.status === 'pending') pending.add(d.course_id);
      });

      setEnrollments(Array.from(enrolled).map(id => ({ course_id: id })));
      setPendingCourseIds(pending);
    }
  };

  const [polyguidType, setPolyguidType] = useState<'all' | 'pdf' | 'hardcopy'>('all');

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Polyguid books (Exclude E-books as they go to Free Books)
      const { data: adminBooks } = await supabase
        .from('courses')
        .select('*')
        .contains('categories', ['বই'])
        .not('categories', 'cs', '{"ebook"}')
        .order('created_at', { ascending: false });

      if (adminBooks) {
        setPolyguidBooks(adminBooks.map(c => {
          const metaMatch = c.description?.match(/\[meta:fake_user_count:(\d+)\]/);
          const affiliateMatch = c.description?.match(/\[meta:affiliate_link:([^\]]+)\]/);
          const readNowMatch = c.description?.match(/\[meta:read_now_link:([^\]]+)\]/);
          let cleanDesc = c.description?.replace(/\[meta:fake_user_count:\d+\]/g, '') || '';
          cleanDesc = cleanDesc.replace(/\[meta:affiliate_link:[^\]]+\]/g, '').replace(/\[meta:read_now_link:[^\]]+\]/g, '').trim();
          
          let bookType = 'pdf';
          if (c.categories?.includes('affiliate') || affiliateMatch) bookType = 'hardcopy';
          else if (c.categories?.includes('pdf')) bookType = 'pdf';
          else if (affiliateMatch) bookType = 'hardcopy';

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
            totalUsers: metaMatch ? parseInt(metaMatch[1]) : 0,
            bookType
          };
        }));
      }

      // 2. Fetch User Books
      const { data: { session } } = await supabase.auth.getSession();
      
      const fetchWithFallback = async () => {
        try {
          // Try with join first, selecting only public profile fields
          const { data, error } = await supabase
            .from('marketplace_books')
            .select(`
              *,
              profiles (
                id,
                full_name,
                avatar_url,
                role,
                is_verified
              )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
            
          if (error) {
            console.warn('Join fetch errored:', error);
            throw error;
          }
          return data;
        } catch (err) {
          console.warn('Join fetch failed, using manual multi-fetch:', err);
          
          // 1. Fetch books
          const { data: books, error: booksError } = await supabase
            .from('marketplace_books')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
          
          if (booksError || !books) {
            console.error('Simple books fetch failed:', booksError);
            return [];
          }

          // 2. Fetch profiles for these books
          const userIds = [...new Set(books.map(b => b.user_id))];
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, role, is_verified')
              .in('id', userIds);
            
            const profilesMap = profiles?.reduce((acc: any, p: any) => {
              acc[p.id] = p;
              return acc;
            }, {});

            return books.map(b => ({
              ...b,
              profiles: profilesMap ? profilesMap[b.user_id] : null
            }));
          }
          
          return books;
        }
      };

      let initialBooks = await fetchWithFallback();
      
      // Apply filters manually if needed or via query
      // To keep it simple and efficient, let's stick to query filters if they work
      if (district || semester || department) {
        let filteredQuery = supabase
          .from('marketplace_books')
          .select(`
            *,
            profiles (
              id,
              full_name,
              avatar_url,
              role,
              is_verified
            )
          `)
          .eq('status', 'active');
          
        if (district) filteredQuery = filteredQuery.eq('district', district);
        if (semester) filteredQuery = filteredQuery.eq('semester', semester);
        if (department) filteredQuery = filteredQuery.eq('department', department);
        
        filteredQuery = filteredQuery.order('created_at', { ascending: false });
        
        const { data: filteredData, error: filterError } = await filteredQuery;
        
        if (filterError) {
          // Fallback for filtered query too
          let simpleFiltered = supabase
            .from('marketplace_books')
            .select('*')
            .eq('status', 'active');
          if (district) simpleFiltered = simpleFiltered.eq('district', district);
          if (semester) simpleFiltered = simpleFiltered.eq('semester', semester);
          if (department) simpleFiltered = simpleFiltered.eq('department', department);
          simpleFiltered = simpleFiltered.order('created_at', { ascending: false });
          
          const { data: sData } = await simpleFiltered;
          if (sData) setUserBooks(sData);
        } else if (filteredData) {
          setUserBooks(filteredData);
        }
      } else {
        setUserBooks(initialBooks || []);
      }
    } catch (e) {
      console.error('Marketplace Home Fetch Error:', e);
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
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
             <button 
               onClick={() => navigate(-1)}
               className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group"
             >
               <ArrowLeft size={20} className="text-[var(--text)] group-hover:text-[var(--primary)]" />
             </button>
             <div>
                <h1 className="text-sm sm:text-lg font-black text-[var(--text)] tracking-tight">Marketplace</h1>
                <p className="text-[7px] sm:text-[9px] text-gray-500 font-medium">Buy and sell books</p>
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

      <div className="w-full max-w-[1600px] mx-auto px-4 py-6">
        {/* Main Content */}
        <div className="w-full">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="বইয়ের নাম অথবা ঠিকানা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#32CD32] text-[10px] sm:text-xs font-medium shadow-sm"
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">Polyguid থেকে প্রকাশিত</h2>
                    <div className="flex gap-2">
                       {['all', 'pdf', 'hardcopy'].map((type) => (
                         <button
                           key={type}
                           onClick={() => setPolyguidType(type as any)}
                           className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                             polyguidType === type 
                               ? 'bg-[#32CD32] text-white shadow-lg shadow-[#32CD32]/20' 
                               : 'bg-white dark:bg-white/5 text-gray-500 border border-black/5 dark:border-white/10'
                           }`}
                         >
                           {type === 'all' ? 'সব' : type === 'pdf' ? 'PDF' : 'Hardcopy'}
                         </button>
                       ))}
                    </div>
                  </div>
                  
                  {filteredPolyguid.filter(b => polyguidType === 'all' || b.bookType === polyguidType).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                      {filteredPolyguid
                        .filter(b => polyguidType === 'all' || b.bookType === polyguidType)
                        .map(book => (
                          <CourseCard 
                            key={book.id} 
                            {...book} 
                            isBook={true} 
                            isEnrolled={enrollments.some(e => e.course_id === book.id)} 
                            purchaseStatus={pendingCourseIds.has(book.id) ? 'pending' : undefined}
                            affiliateLink={book.affiliateLink} 
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-black/5 dark:border-white/5 p-8 text-center text-gray-500 text-sm shadow-sm">কোনো বই পাওয়া যায়নি</div>
                  )}
                </div>

                {/* User Books Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">বইয়ের মার্কেটপ্লেস</h2>
                    <span className="text-xs text-gray-500 font-bold px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-full">{filteredUsers.length}টি বই</span>
                  </div>
                  
                  {/* Filters for User Books */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar items-center">
                    <select 
                      value={district} 
                      onChange={e => setDistrict(e.target.value)}
                      className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] sm:text-xs font-bold outline-none flex-shrink-0"
                    >
                      <option value="">সকল জেলা</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select 
                      value={semester} 
                      onChange={e => setSemester(e.target.value)}
                      className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] sm:text-xs font-bold outline-none flex-shrink-0"
                    >
                      <option value="">সকল সেমিস্টার</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                    </select>

                    {(district || semester) && (
                      <button 
                        onClick={() => { setDistrict(''); setSemester(''); }}
                        className="text-[10px] font-bold text-[#32CD32] whitespace-nowrap px-2"
                      >
                        Clear
                      </button>
                    )}
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
          className="w-14 h-14 bg-[#32CD32] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(50,205,50,0.4)] hover:scale-105 active:scale-95 transition-all text-center"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
