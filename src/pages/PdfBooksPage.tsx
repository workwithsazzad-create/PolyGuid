import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, ArrowLeft, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import CourseCard from '../components/ui/CourseCard';

export default function PdfBooksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'ebook' | 'pdf' | 'hardcopy'>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .contains('categories', ['বই'])
        .order('created_at', { ascending: false });

      const sessionPromise = supabase.auth.getSession();
      const [{ data }, { data: { session } }] = await Promise.all([query, sessionPromise]);

      if (session) {
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', session.user.id);
        
        if (enrollmentsData) {
          setEnrollments(enrollmentsData);
        }

        const { data: donationData } = await supabase
          .from('payments')
          .select('course_id, status')
          .eq('user_id', session.user.id);
        
        if (donationData) {
          const pending = new Set<string>();
          const approved = new Set<string>();
          donationData.forEach(d => {
            if (d.status === 'pending') pending.add(d.course_id);
            if (d.status === 'approved') approved.add(d.course_id);
          });
          setPendingCourseIds(pending);
          // Combine enrollment check with approved donations
          const combinedEnrollments = [...(enrollmentsData || [])];
          approved.forEach(id => {
            if (!combinedEnrollments.some(e => e.course_id === id)) {
              combinedEnrollments.push({ course_id: id });
            }
          });
          setEnrollments(combinedEnrollments);
        }
      }

      if (data) {
        setCourses(
          data.map(c => {
            const affiliateMatch = c.description?.match(/\[meta:affiliate_link:([^\]]+)\]/);
            const readNowMatch = c.description?.match(/\[meta:read_now_link:([^\]]+)\]/);
            
            let bookType: 'ebook' | 'pdf' | 'hardcopy' = 'pdf';
            if (c.categories?.includes('ebook') || readNowMatch) bookType = 'ebook';
            else if (c.categories?.includes('affiliate') || affiliateMatch) bookType = 'hardcopy';
            else bookType = 'pdf';

            return {
              id: c.id,
              title: c.title,
              description: c.description,
              price: c.price,
              originalPrice: c.original_price,
              thumbnail: c.thumbnail_url || "https://placehold.co/1000x1430/1a1a1a/e11d48?text=New+Book",
              classes: c.classes_count,
              categories: c.categories || [],
              bookType
            };
          })
        );
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isEBookOnly = searchParams.get('type') === 'ebook';
  const pageTitle = isEBookOnly ? 'Free Books' : 'Book Somahar';

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (isEBookOnly) {
      return matchesSearch && c.bookType === 'ebook';
    }

    const matchesCategory = activeCategory === 'all' || c.bookType === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'সব' },
    { id: 'ebook', name: 'ফ্রি বুক' },
    { id: 'pdf', name: 'পিডিএফ বুক' },
    { id: 'hardcopy', name: 'হার্ডকপি' }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full px-4 py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group flex"
          >
            <ArrowLeft className="text-[var(--text)] group-hover:text-[var(--primary)]" size={20} />
          </button>
          <div className="pl-1">
            <h1 className="text-xl sm:text-3xl font-black text-[var(--text)] tracking-tight">{pageTitle}</h1>
            <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5">আপনার প্রয়োজনীয় বইটি খুঁজে নিন</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="বইয়ের নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#32CD32] text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Categories - Only show in Book Somahar mode */}
      {!isEBookOnly && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-[#32CD32] text-white shadow-lg shadow-[#32CD32]/20 scale-105"
                  : "bg-white dark:bg-white/5 text-gray-500 border border-black/5 dark:border-white/10 hover:border-[#32CD32]/50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[1/1.43] bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              {...course} 
              isBook={true}
              isEnrolled={enrollments.some(e => e.course_id === course.id)}
              purchaseStatus={pendingCourseIds.has(course.id) ? 'pending' : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text)] mb-2">কোনো বই পাওয়া যায়নি</h3>
          <p className="text-gray-500 max-w-sm">
            আপনি যা খুঁজছেন তা পাওয়া যায়নি। অন্য কিছু দিয়ে চেষ্টা করুন।
          </p>
        </div>
      )}
    </div>
  );
}
