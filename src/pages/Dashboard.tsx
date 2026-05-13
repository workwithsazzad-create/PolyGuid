import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import CourseCard from '@/src/components/ui/CourseCard';
import { Youtube, FileText, ChevronRight, Play, Eye, Star, Book, BadgeCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [purchasedBooks, setPurchasedBooks] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [savedPdfs, setSavedPdfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch Profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setProfile(profileData);
          if (profileData?.full_name) {
            setUserName(profileData.full_name);
          }

          // Fetch Enrolled Items
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
              course_id,
              courses (*)
            `)
            .eq('user_id', user.id);
          
          if (enrollments) {
            const allItems = enrollments.map(e => {
              const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
              return {
                ...course,
                thumbnail: course?.thumbnail_url || "https://placehold.co/600x400/1a1a1a/32CD32?text=Enrolled",
                classes: course?.classes_count,
                isBook: course?.categories?.includes("বই") || course?.categories?.includes("Book") || course?.title?.includes("বই")
              };
            });
            
            setEnrolledCourses(allItems.filter(i => !i.isBook));
            setPurchasedBooks(allItems.filter(i => i.isBook));
          }

          // Fetch Saved Items
          const { data: savedData } = await supabase
            .from('saved_items')
            .select(`
              id,
              item_type,
              content_id,
              course_content (
                id,
                title,
                type,
                course_id,
                courses (
                  title
                )
              )
            `)
            .eq('user_id', user.id);
          
          if (savedData) {
            const videos = savedData
              .filter(i => {
                const content = Array.isArray(i.course_content) ? i.course_content[0] : i.course_content;
                return i.item_type === 'video' && content;
              })
              .map(i => {
                const content = Array.isArray(i.course_content) ? i.course_content[0] : (i.course_content as any);
                const course = content?.courses ? (Array.isArray(content.courses) ? content.courses[0] : content.courses) : null;
                return {
                  id: i.content_id,
                  title: content?.title,
                  courseTitle: course?.title || 'Unknown Course'
                };
              });
            
            const pdfs = savedData
              .filter(i => {
                const content = Array.isArray(i.course_content) ? i.course_content[0] : i.course_content;
                return i.item_type === 'pdf' && content;
              })
              .map(i => {
                const content = Array.isArray(i.course_content) ? i.course_content[0] : (i.course_content as any);
                const course = content?.courses ? (Array.isArray(content.courses) ? content.courses[0] : content.courses) : null;
                return {
                  id: i.content_id,
                  title: content?.title,
                  courseTitle: course?.title || 'Unknown Course'
                };
              });
            
            setSavedVideos(videos);
            setSavedPdfs(pdfs);
          }
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 sm:gap-8 pb-12 px-6 lg:px-0"
    >
      <header className="hidden sm:flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex flex-shrink-0 items-center justify-center overflow-hidden border-2 border-white dark:border-[#333] bg-white dark:bg-black shadow-sm">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#32CD32]/10 flex items-center justify-center">
              <span className="text-[#32CD32] font-black text-xl">{userName?.charAt(0) || 'P'}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-lg sm:text-3xl font-bold text-[var(--text)] leading-tight break-words">
              Welcome back{userName ? `, ${userName}` : '!'}
            </h1>
            {(profile?.role === 'admin' || profile?.phone === '01993879904' || profile?.full_name?.includes('PolyGuid')) && (
              <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-[1.125rem] h-[1.125rem] shrink-0" size={16} />
            )}
          </div>
          <p className="text-[11px] sm:text-base text-gray-500 dark:text-gray-400">Continue your learning journey with the best resources.</p>
        </div>
      </header>

      {/* Top Section: Saved Items Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <GlassmorphicCard 
          hoverEffect 
          onClick={() => navigate('/saved-items?type=video')}
          className="relative group cursor-pointer overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-red-500/5 to-transparent dark:from-red-500/10 border border-black/10 dark:border-white/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Youtube className="w-16 h-16 sm:w-24 sm:h-24 text-red-500" />
          </div>
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Youtube className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col max-w-[120px] sm:max-w-none">
                <h2 className="text-sm sm:text-2xl font-bold text-[var(--text)] leading-tight">Saved Videos</h2>
                <p className="hidden sm:block text-xs sm:text-sm text-gray-500 font-medium">Access your bookmarked videos.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg font-bold text-[10px] sm:text-xs shadow-md shadow-red-500/20 group-hover:bg-red-600 transition-colors shrink-0">
              <span>View All</span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard 
          hoverEffect 
          onClick={() => navigate('/saved-items?type=pdf')}
          className="relative group cursor-pointer overflow-hidden p-4 sm:p-6 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 border border-black/10 dark:border-white/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="w-16 h-16 sm:w-24 sm:h-24 text-blue-500" />
          </div>
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col max-w-[120px] sm:max-w-none">
                <h2 className="text-sm sm:text-2xl font-bold text-[var(--text)] leading-tight">Saved PDFs</h2>
                <p className="hidden sm:block text-xs sm:text-sm text-gray-500 font-medium">Access your bookmarked notes.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg font-bold text-[10px] sm:text-xs shadow-md shadow-blue-500/20 group-hover:bg-blue-600 transition-colors shrink-0">
              <span>View All</span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Bottom Section: Enrolled Courses */}
      <section className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[16px] sm:text-2xl font-bold text-[var(--text)] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">আপনার ভর্তি হওয়া কোর্সসমূহ</h2>
          <button 
            onClick={() => navigate('/courses')}
            className="text-xs sm:text-base text-[var(--primary)] hover:underline flex items-center gap-0.5 sm:gap-1 font-bold shrink-0"
          >
            সবগুলো দেখুন <ChevronRight size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard {...course} isEnrolled={true} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 flex flex-col items-center gap-4">
              <Book size={48} className="text-gray-400" strokeWidth={1} />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[var(--text)]">আপনি এখনো কোনো কোর্সে ভর্তি হননি</h3>
                <p className="text-sm text-gray-500">আপনার পছন্দের কোর্সটি বেছে নিন এবং আজই পড়াশোনা শুরু করুন!</p>
              </div>
              <button 
                onClick={() => navigate('/courses')}
                className="mt-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all text-sm hidden sm:block"
              >
                Explore Courses
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Section: Purchased Books */}
      <section className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[16px] sm:text-2xl font-bold text-[var(--text)] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">আপনার কেনা বইসমূহ</h2>
          <button 
            onClick={() => navigate('/books-pdf')}
            className="text-xs sm:text-base text-[var(--primary)] hover:underline flex items-center gap-0.5 sm:gap-1 font-bold shrink-0"
          >
            সবগুলো দেখুন <ChevronRight size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {purchasedBooks.length > 0 ? (
            purchasedBooks.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard {...course} isEnrolled={true} isBook={true} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center bg-black/5 dark:bg-white/5 rounded-3xl border border-black/10 dark:border-white/10 flex flex-col items-center gap-3">
              <Book size={40} className="text-gray-400" strokeWidth={1} />
              <p className="text-sm text-gray-500">আপনার কেনা কোনো বই এখানে নেই</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
