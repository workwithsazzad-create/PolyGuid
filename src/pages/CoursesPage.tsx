import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Search, Filter, Book, GraduationCap, Laptop } from 'lucide-react';
import { cn } from '../lib/utils';
import CourseCard from '../components/ui/CourseCard';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';

const CATEGORIES = [
  'সবগুলো',
  '১ম সেমিস্টার',
  '২য় সেমিস্টার',
  '৩য় সেমিস্টার',
  '৪র্থ সেমিস্টার',
  '৫ম সেমিস্টার',
  '৬ষ্ঠ সেমিস্টার',
  '৭ম সেমিস্টার',
  'ফ্রি'
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'সবগুলো';
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [currentCategory]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('courses')
        .select('*')
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
      }

      if (data) {
        let filtered = data;
        
        if (currentCategory !== 'সবগুলো') {
          filtered = data.filter(c => {
            if (currentCategory === 'ফ্রি') {
              return c.is_free === true;
            }
            return c.categories?.includes(currentCategory) || 
                   c.title.includes(currentCategory);
          });
        }

        setCourses(filtered.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          price: c.price,
          originalPrice: c.original_price,
          thumbnail: c.thumbnail_url || "https://placehold.co/600x400/1a1a1a/32CD32?text=New+Course",
          classes: c.classes_count,
          categories: c.categories || []
        })));
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">কোর্স লাইব্রেরি</h1>
          <p className="text-gray-500 mt-1">আপনার প্রয়োজনীয় কোর্সটি খুঁজে নিন</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="কোর্স খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
          />
        </div>
      </div>

      {/* Categories Scroll */}
      <div 
        className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar scroll-smooth"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSearchParams({ category: cat })}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
              currentCategory === cat 
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20" 
                : "bg-white dark:bg-white/5 text-gray-500 border-black/5 dark:border-white/10 hover:border-[var(--primary)]/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-3xl bg-black/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map(course => (
            <CourseCard 
               key={course.id}
               {...course}
               isEnrolled={enrollments.some(e => e.course_id === course.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
          <Book size={64} className="mb-4" strokeWidth={1} />
          <h2 className="text-xl font-medium">কোনো কোর্স পাওয়া যায়নি</h2>
          <p className="text-sm mt-2">অন্য কোনো কিওয়ার্ড বা ক্যাটাগরি ট্রাই করুন</p>
        </div>
      )}
    </div>
  );
}
