import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, PlayCircle, FileText, Lock, Eye, X, Video as VideoIcon, Users, DollarSign, BookOpen } from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import PaymentModal from '../components/ui/PaymentModal';
import { supabase } from '../lib/supabase';
import { getDirectLink } from '../lib/utils';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState('01993879904');

  useEffect(() => {
    fetchCourseData();
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('key, value');
    if (data) {
      const num = data.find(s => s.key === 'donation_number')?.value;
      if (num) setPaymentNumber(num);
    }
  };

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
      
      // Enrollment Count
      const { count: realCount } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', id);

      if (courseData) {
        const videoCount = contentsData?.filter(c => c.type === 'video').length || 0;
        
        // Extract meta info from description
        const metaMatch = courseData.description?.match(/\[meta:fake_user_count:(\d+)\]/);
        const affiliateMatch = courseData.description?.match(/\[meta:affiliate_link:([^\]]+)\]/);
        const fakeCount = metaMatch ? parseInt(metaMatch[1]) : 0;
        let cleanDesc = courseData.description?.replace(/\[meta:fake_user_count:\d+\]/g, '') || '';
        cleanDesc = cleanDesc.replace(/\[meta:affiliate_link:[^\]]+\]/g, '').trim();

        setCourse({
          ...courseData,
          description: cleanDesc,
          affiliateLink: affiliateMatch ? affiliateMatch[1] : null,
          price: courseData.price,
          originalPrice: courseData.original_price,
          classes: videoCount,
          thumbnail: courseData.thumbnail_url,
          totalUsers: (realCount || 0) + fakeCount
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
    // Increment the fake count in the description safely without blocking for any buy action
    // jotojon user buy now e click korbe ekta kore user barte thakbe fake er pore
    try {
      const { data, error: fetchError } = await supabase.from('courses').select('description').eq('id', id).single();
      if (!fetchError && data && data.description) {
         const match = data.description.match(/\[meta:fake_user_count:(\d+)\]/);
         const currentFake = match ? parseInt(match[1]) : 0;
         let newDesc = data.description;
         if (match) {
           newDesc = newDesc.replace(/\[meta:fake_user_count:\d+\]/, `[meta:fake_user_count:${currentFake + 1}]`);
         } else {
           newDesc += `\n\n[meta:fake_user_count:1]`;
         }
         await supabase.from('courses').update({ description: newDesc }).eq('id', id);
         
         // Update local state immediately for visual feedback
         setCourse(prev => prev ? {...prev, totalUsers: (prev.totalUsers || 0) + 1} : prev);
      }
    } catch(e) {
      console.error('Error incrementing user count:', e);
    }
    
    if (course?.affiliateLink) {
      window.open(course.affiliateLink, '_blank');
      return;
    }

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
      setShowPaymentModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-pulse">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
        className="flex items-center gap-2 text-gray-500 hover:text-[var(--primary)] transition-colors w-fit hidden lg:flex"
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
        
        <div className="flex flex-col gap-2 sm:gap-4 flex-1">
          <h1 className="text-xl md:text-3xl font-black text-[var(--text)] leading-tight">{course.title}</h1>
          <div className="flex items-center gap-4 text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider">
            {!(course.categories?.includes("বই") || course.categories?.includes("Book") || course.affiliateLink) && (
              <span className="flex items-center gap-1"><PlayCircle size={14}/> {course.classes} Classes</span>
            )}
            {!course.affiliateLink && (
              <span className="flex items-center gap-1"><Users size={14}/> {course.totalUsers} Students</span>
            )}
          </div>
          
          {!isEnrolled && (
            <div className="flex flex-col mt-4">
              {course.affiliateLink && course.totalUsers > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-red-500 mb-2">
                  <Users size={16} />
                  <span>{course.totalUsers} Students Bought</span>
                </div>
              )}
              <button 
                onClick={handleEnroll}
                className="bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 w-fit"
              >
                {(course.categories?.includes("বই") || course.categories?.includes("Book") || course.affiliateLink) 
                  ? (course.isFree && !course.affiliateLink ? 'Get Book for Free' : 'Buy Now') 
                  : (course.isFree ? 'Enroll Now for Free' : 'Buy Now')}
              </button>
            </div>
          )}

          {course.description && (
            <div className="mt-4 border-t border-black/5 dark:border-white/5 pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          )}
        </div>
      </GlassmorphicCard>

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type="course"
        courseId={id}
        courseTitle={course.title}
        price={course.price}
        paymentNumber={paymentNumber}
      />

      <div className="flex flex-col gap-4">
        {course.affiliateLink ? (
          <GlassmorphicCard className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <BookOpen size={48} className="text-gray-300 dark:text-gray-600 mb-2" />
            <h2 className="text-lg font-bold text-[var(--text)]">এটি একটি হার্ডকপি বই</h2>
            <p className="text-gray-500 text-sm">এটির কোনো পিডিএফ কন্টেন্ট নেই। Buy Now এ ক্লিক করে বইটি অর্ডার করতে পারবেন।</p>
          </GlassmorphicCard>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[var(--text)]">
              {(course.categories?.includes("বই") || course.categories?.includes("Book")) ? 'Book Content' : 'Course Content'}
            </h2>
            
            <div className="flex flex-col gap-3">
              {contents.map((content, i) => (
                <GlassmorphicCard key={content.id} className="p-4 flex items-center justify-between hover:border-[var(--primary)]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${content.type === 'video' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {content.type === 'video' ? <VideoIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text)]">{content.title}</h4>
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
          </>
        )}
      </div>
    </motion.div>
  );
}
