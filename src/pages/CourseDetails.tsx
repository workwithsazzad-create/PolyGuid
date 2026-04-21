import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, PlayCircle, FileText, Lock, Eye, X, Video as VideoIcon } from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { supabase } from '../lib/supabase';
import { getDirectLink } from '../lib/utils';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Contents
      const { data: contentsData } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: true });
      
      if (contentsData) {
        setContents(contentsData);
      }

      // Course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (courseData) {
        const videoCount = contentsData?.filter(c => c.type === 'video').length || 0;
        setCourse({
          ...courseData,
          price: courseData.price,
          originalPrice: courseData.original_price,
          classes: videoCount,
          thumbnail: courseData.thumbnail_url
        });
      }

      // Enrollment
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('course_id', id)
          .maybeSingle();
        
        if (enrollmentData) {
          setIsEnrolled(true);
        }
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Please login to enroll in courses.');
      return;
    }

    if (course?.is_free) {
      const { error } = await supabase
        .from('enrollments')
        .insert([{ user_id: session.user.id, course_id: id }]);

      if (error) {
        console.error('Error enrolling:', error);
        alert('Failed to enroll. Please try again.');
      } else {
        setIsEnrolled(true);
      }
    } else {
      alert('Payment gateway integration coming soon for paid courses.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--text)]">Loading course...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-[var(--text)]">Course not found.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 max-w-4xl mx-auto pb-12"
    >
      <button 
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 text-gray-500 hover:text-[var(--primary)] transition-colors w-fit"
      >
        <ChevronLeft size={20} /> Back to Home
      </button>

      <GlassmorphicCard className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <div className="w-full md:w-1/3 aspect-video bg-black/20 rounded-xl overflow-hidden flex-shrink-0 relative">
          <img 
            src={getDirectLink(course.thumbnail)} 
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">{course.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><PlayCircle size={16}/> {course.classes} Classes</span>
          </div>
          
          {course.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
              {course.description}
            </p>
          )}
          
          {!isEnrolled && (
            <button 
              onClick={handleEnroll}
              className="mt-4 bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 w-fit"
            >
              {course.isFree ? 'Enroll Now for Free' : 'Buy Now'}
            </button>
          )}
        </div>
      </GlassmorphicCard>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[var(--text)]">Course Content</h2>
        
        <div className="flex flex-col gap-3">
          {contents.map((content, i) => (
            <GlassmorphicCard key={content.id} className="p-4 flex items-center justify-between hover:border-[var(--primary)]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${content.type === 'video' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {content.type === 'video' ? <VideoIcon size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-[var(--text)]">{i + 1}. {content.title}</h4>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{content.type}</p>
                </div>
              </div>
              
              {isEnrolled ? (
                <button 
                  onClick={() => {
                    if (content.type === 'video') {
                      navigate(`/play/${content.id}`);
                    } else {
                      navigate(`/pdf/${content.id}`);
                    }
                  }}
                  className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <Eye size={18} /> View
                </button>
              ) : (
                <div className="p-2 text-gray-400 flex items-center gap-2 text-sm">
                  <Lock size={16} /> Locked
                </div>
              )}
            </GlassmorphicCard>
          ))}
          {contents.length === 0 && (
            <p className="text-center text-gray-500 py-8">No content available yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
