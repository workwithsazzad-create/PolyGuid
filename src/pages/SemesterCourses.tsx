import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, BookOpen } from 'lucide-react';
import CourseCard from '../components/ui/CourseCard';

export default function SemesterCourses() {
  const { semesterName } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
  }, [semesterName]);

  const fetchCourses = async () => {
    setIsLoading(true);
    if (!semesterName) return;

    try {
      const coursesPromise = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      const sessionPromise = supabase.auth.getSession();

      const [{ data }, { data: { session } }] = await Promise.all([coursesPromise, sessionPromise]);

      if (session) {
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', session.user.id);
        
        if (enrollmentsData) {
          setEnrollments(enrollmentsData);
        }

        const { data: donationData } = await supabase
          .from('donations')
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
        // Filter by semester locally for flexible matching
        const filtered = data.filter(c => 
          c.categories?.includes(semesterName) || 
          c.title.includes(semesterName)
        ).map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          price: c.price,
          originalPrice: c.original_price,
          thumbnail: c.thumbnail_url || "https://placehold.co/600x400/1a1a1a/32CD32?text=New+Course",
          classes: c.classes_count,
          categories: c.categories || []
        }));

        // Load thumbnails before rendering
        if (filtered.length > 0) {
           await Promise.all(filtered.map(c => {
             return new Promise((resolve) => {
               const img = new Image();
               img.onload = resolve;
               img.onerror = resolve;
               img.src = c.thumbnail;
             });
           }));
        }

        setCourses(filtered);
      }
    } catch (err) {
      console.error('Error fetching semester courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-8 animate-fade-in focus-within:outline-none">
      <div className="flex items-center gap-3 sm:gap-4 border-b border-black/5 dark:border-white/10 pb-4 sm:pb-6">
        <button 
          onClick={() => navigate('/home')}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors hidden lg:flex"
        >
          <ArrowLeft size={24} className="text-[var(--text)]" />
        </button>
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-[var(--text)]">
            {semesterName}
          </h1>
          <p className="text-gray-400 mt-0.5 text-[10px] sm:text-sm">উপলব্ধ কোর্স সমূহ</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 animate-pulse">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map(course => (
            <CourseCard 
               key={course.id}
               {...course}
               onClick={() => navigate(`/course/${course.id}`)}
               isEnrolled={enrollments.some(e => e.course_id === course.id)}
               purchaseStatus={pendingCourseIds.has(course.id) ? 'pending' : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50 select-none">
          <BookOpen size={64} className="text-gray-500" strokeWidth={1} />
          <h2 className="text-2xl font-light text-gray-400 tracking-wider">এখনো কোনো কোর্স উপলব্ধ নেই</h2>
        </div>
      )}
    </div>
  );
}
