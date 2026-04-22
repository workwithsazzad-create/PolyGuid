import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import { Youtube, FileText, Play, Eye, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SavedItems() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [savedPdfs, setSavedPdfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab state: 'video', 'pdf', or 'all' if no filter needed.
  // We'll use 'all' on desktop, but let's filter if query param is set.
  const activeType = searchParams.get('type') || 'video'; // Default to video if none specified

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.warn('Auth check failed:', authError.message);
          return;
        }
        if (user) {
          const { data: savedData, error: savedError } = await supabase
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
          
          if (savedError) throw savedError;
          
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
        console.error('SavedItems fetch error:', error);
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
      className="flex flex-col gap-6 lg:gap-8 pb-12 w-full max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-1.5 sm:p-2 rounded-xl bg-black/5 dark:bg-white/5 text-gray-500 hover:text-[var(--text)] transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[var(--text)] leading-tight whitespace-nowrap">আপনার সংরক্ষিত কন্টেন্ট</h1>
        </div>

        {/* Custom Tabs */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setSearchParams({ type: 'video' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeType === 'video' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-[var(--text)]'}`}
          >
            <Youtube size={16} /> Videos
          </button>
          <button
            onClick={() => setSearchParams({ type: 'pdf' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeType === 'pdf' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-[var(--text)]'}`}
          >
            <FileText size={16} /> PDFs
          </button>
        </div>
      </div>

      <div>
        {/* Saved Videos View */}
        {activeType === 'video' && (
          <GlassmorphicCard className="flex flex-col gap-4 p-5 lg:p-8 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Youtube className="text-red-500 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Saved Videos</h2>
                <p className="text-sm text-gray-500 font-medium">{savedVideos.length} videos saved</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-h-[300px]">
              {savedVideos.length > 0 ? (
                savedVideos.map((video, index) => (
                  <div key={video.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/50 dark:bg-black/20 hover:bg-white border border-black/5 dark:border-white/5 dark:hover:border-white/10 rounded-2xl transition-all group">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider truncate mb-1">
                        {video.courseTitle}
                      </span>
                      <span className="text-base font-bold text-[var(--text)] line-clamp-2">
                        {index + 1}. {video.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate(`/play/${video.id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shrink-0 active:scale-95 w-full sm:w-auto"
                    >
                      <Play size={16} fill="currentColor" /> <span>Play Video</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 opacity-50 flex flex-col items-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                  <Youtube size={48} strokeWidth={1} className="text-gray-400" />
                  <p className="text-base font-medium">No saved videos yet</p>
                </div>
              )}
            </div>
          </GlassmorphicCard>
        )}

        {/* Saved PDFs View */}
        {activeType === 'pdf' && (
          <GlassmorphicCard className="flex flex-col gap-4 p-5 lg:p-8 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <FileText className="text-blue-500 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Saved PDFs</h2>
                <p className="text-sm text-gray-500 font-medium">{savedPdfs.length} documents saved</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-h-[300px]">
              {savedPdfs.length > 0 ? (
                savedPdfs.map((pdf, index) => (
                  <div key={pdf.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/50 dark:bg-black/20 hover:bg-white border border-black/5 dark:border-white/5 dark:hover:border-white/10 rounded-2xl transition-all group">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-wider truncate mb-1">
                        {pdf.courseTitle}
                      </span>
                      <span className="text-base font-bold text-[var(--text)] line-clamp-2">
                        {index + 1}. {pdf.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate(`/pdf/${pdf.id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shrink-0 active:scale-95 w-full sm:w-auto"
                    >
                      <Eye size={16} /> <span>Read PDF</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 opacity-50 flex flex-col items-center gap-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                  <FileText size={48} strokeWidth={1} className="text-gray-400" />
                  <p className="text-base font-medium">No saved PDFs yet</p>
                </div>
              )}
            </div>
          </GlassmorphicCard>
        )}
      </div>
    </motion.div>
  );
}
