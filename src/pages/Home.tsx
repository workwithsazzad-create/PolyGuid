import React, { useRef, useState, useEffect } from 'react';
import { motion, animate, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Calculator, FileText, List, Users, Building2, PlayCircle, Heart, Copy, Check, X, Search, FileCheck } from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import CourseCard from '@/src/components/ui/CourseCard';
import { supabase } from '@/src/lib/supabase';
import { useNavigate } from 'react-router-dom';

const AnimatedCounter = ({ value, suffix = "" }: { value: number, suffix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString() + suffix;
      }
    });

    return () => controls.stop();
  }, [value, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
};

const DEMO_COURSES = [
  {
    id: "demo-1",
    title: "কম্পিউটার টেকনোলজি ১ম পর্ব",
    description: "ডিপ্লোমা ইন কম্পিউটার ইঞ্জিনিয়ারিং এর ১ম পর্বের প্রোফেশনাল কোর্স।",
    price: 500,
    originalPrice: 1000,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=CT+1st",
    classes: 24
  },
  {
    id: "demo-2",
    title: "সিভিল টেকনোলজি ৩য় পর্ব",
    description: "সিভিল ইঞ্জিনিয়ারিং এর ৩য় পর্বের সকল গুরুত্বপূর্ণ বিষয় নিয়ে সাজানো এই কোর্স।",
    price: 700,
    originalPrice: 1200,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Civil+3rd",
    classes: 30
  },
  {
    id: "demo-3",
    title: "ইলেকট্রিক্যাল টেকনোলজি (ফ্রি কোর্স)",
    description: "ইলেকট্রিক্যাল বেসিক নলেজ এবং টেকনিক্যাল স্কিল বৃদ্ধিতে এই ফ্রি কোর্স।",
    price: 0,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Electrical+Free",
    classes: 15
  },
  {
    id: "demo-4",
    title: "মেকানিক্যাল ইঞ্জিনিয়ারিং বেসিকস",
    description: "মেকানিক্যাল ইঞ্জিনিয়ারিং এর ফান্ডামেন্টাল কনসেপ্ট শিখুন খুব সহজে।",
    price: 0,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Mechanical",
    classes: 12
  },
  {
    id: "demo-5",
    title: "আর্কিটেকচার ২য় পর্ব",
    description: "আর্কিটেকচার ড্রয়িং এবং ডিজাইন এর ওপর বিশেষ কোর্স।",
    price: 600,
    originalPrice: 800,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Archi+2nd",
    classes: 20
  },
  {
    id: "demo-6",
    title: "অটোমোবাইল টেকনোলজি",
    description: "আধুনিক অটোমোবাইল ইঞ্জিন এবং সিস্টেম সম্পর্কে বিস্তারিত জানুন।",
    price: 0,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Auto+Free",
    classes: 10
  }
];

const SEMESTERS = [
  "১ম সেমিস্টার", "২য় সেমিস্টার", "৩য় সেমিস্টার", "৪র্থ সেমিস্টার",
  "৫ম সেমিস্টার", "৬ষ্ঠ সেমিস্টার", "৭ম সেমিস্টার"
];

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop";

export default function Home() {
  const navigate = useNavigate();
  const coursesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [bannerUrl, setBannerUrl] = useState<string>(DEFAULT_BANNER);
  const [isViewAllCourses, setIsViewAllCourses] = useState(false);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ courses: 150, students: 20000, polytechnics: 49 });
  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const displayCourses = selectedSemester 
    ? allCourses.filter(c => c.categories?.includes(selectedSemester) || c.title.includes(selectedSemester))
    : allCourses;

  // Donation State
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationNumber, setDonationNumber] = useState('');
  const [approvedDonations, setApprovedDonations] = useState<any[]>([]);
  const [currentDonationIndex, setCurrentDonationIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [donateForm, setDonateForm] = useState({ name: '', polytechnic: '', trxId: '' });
  const [isSubmittingDonate, setIsSubmittingDonate] = useState(false);
  const [donateMsg, setDonateMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;

    const loadAllData = async () => {
      if (isMounted) setIsLoading(true);
      
      try {
        // 1. Fetch Courses
        const coursesPromise = supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        // 2. Fetch User's Enrollments
        const sessionPromise = supabase.auth.getSession();

        // 3. Fetch Banner
        const bannerPromise = supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'home_banner')
          .maybeSingle();

        // 4. Fetch Stats
        const statsPromise = supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['stat_courses', 'stat_students', 'stat_polytechnics', 'donation_number']);

        // 5. Fetch Donations
        const fetchDonations = async () => {
          const { data: donationsData } = await supabase
            .from('donations')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
          if (isMounted && donationsData) {
            setApprovedDonations(donationsData);
          }
        };

        const [
          { data: coursesData },
          { data: { session } },
          { data: bannerData },
          { data: statsData }
        ] = await Promise.all([coursesPromise, sessionPromise, bannerPromise, statsPromise]);

        if (!isMounted) return;

        // Process Courses
        if (coursesData) {
          setAllCourses(coursesData.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            price: c.price,
            originalPrice: c.original_price,
            thumbnail: c.thumbnail_url || "https://placehold.co/600x400/1a1a1a/32CD32?text=New+Course",
            classes: c.classes_count,
            categories: c.categories || [],
            pinned_position: c.pinned_position || null
          })));
        }

        // Process Enrollments
        if (session) {
          const { data: enrollmentsData } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', session.user.id);
          
          if (enrollmentsData) {
            setEnrollments(enrollmentsData);
          }
        }

        // Process Banner
        let currentBannerUrl = DEFAULT_BANNER;
        if (bannerData?.value) {
          currentBannerUrl = bannerData.value;
          setBannerUrl(bannerData.value);
        }

        // Process Stats
        if (statsData) {
          const newStats = { courses: 150, students: 20000, polytechnics: 49 };
          statsData.forEach(item => {
            if (item.key === 'stat_courses') newStats.courses = parseInt(item.value, 10) || 150;
            if (item.key === 'stat_students') newStats.students = parseInt(item.value, 10) || 20000;
            if (item.key === 'stat_polytechnics') newStats.polytechnics = parseInt(item.value, 10) || 49;
            if (item.key === 'donation_number') setDonationNumber(item.value);
          });
          setStats(newStats);
        }

        await fetchDonations();

        // Preload banner image to prevent flicker
        if (currentBannerUrl) {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails to load
            img.src = currentBannerUrl;
          });
        }

        // Preload first few course thumbnails
        if (coursesData && coursesData.length > 0) {
           const preloadPromises = coursesData.slice(0, 4).map(c => {
             const url = c.thumbnail_url || "https://placehold.co/600x400/1a1a1a/32CD32?text=New+Course";
             return new Promise((resolve) => {
               const img = new Image();
               img.onload = resolve;
               img.onerror = resolve;
               img.src = url;
             });
           });
           await Promise.all(preloadPromises);
        }

        // Realtime subscription for donations
        subscription = supabase
          .channel(`donations_changes_${Date.now()}_${Math.random().toString(36).substring(7)}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
            fetchDonations();
          })
          .subscribe();

      } catch (err) {
        console.error('Error fetching data from DB:', err);
      } finally {
        if (isMounted) {
          // Add a small delay to ensure React commits DOM before hiding loader
          setTimeout(() => {
            if (isMounted) setIsLoading(false);
          }, 100);
        }
      }
    };
    
    loadAllData();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const scrollToCourses = () => {
    coursesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (approvedDonations.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentDonationIndex((prev) => (prev + 1) % approvedDonations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [approvedDonations.length]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      };
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollContainer.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };
  const paginate = (newDirection: number) => {
    if (approvedDonations.length <= 0) return;
    let nextIndex = currentDonationIndex + newDirection;
    if (nextIndex < 0) nextIndex = approvedDonations.length - 1;
    if (nextIndex >= approvedDonations.length) nextIndex = 0;
    setCurrentDonationIndex(nextIndex);
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonateMsg(null);
    setIsSubmittingDonate(true);
    try {
      const { error } = await supabase.from('donations').insert([
        { 
          student_name: donateForm.name, 
          polytechnic_name: donateForm.polytechnic, 
          transaction_id: donateForm.trxId 
        }
      ]);
      if (error) throw error;
      setDonateMsg({ type: 'success', text: 'Thank you! Your submission is pending approval.' });
      setDonateForm({ name: '', polytechnic: '', trxId: '' });
      setTimeout(() => setShowDonateModal(false), 3000);
    } catch (err: any) {
      setDonateMsg({ type: 'error', text: err.message || 'Failed to submit.' });
    } finally {
      setIsSubmittingDonate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-12 pb-12"
    >
      {/* Top Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { name: 'Book Buy/Sell', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/marketplace' },
          { name: 'Check Result', icon: FileCheck, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/results' },
          { name: 'Book PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10', path: '/saved' },
          { name: 'Book List', icon: List, color: 'text-orange-500', bg: 'bg-orange-500/10', path: '/courses' },
        ].map((item, i) => (
          <GlassmorphicCard 
            key={i} 
            hoverEffect 
            onClick={() => item.path && navigate(item.path)}
            className="p-2 sm:p-4 flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-2 sm:gap-3 cursor-pointer text-left sm:text-center min-h-0"
          >
            <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl ${item.bg} ${item.color} shrink-0`}>
              <item.icon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className="font-semibold text-[var(--text)] text-[11px] sm:text-sm leading-tight">{item.name}</span>
          </GlassmorphicCard>
        ))}
      </div>


      {/* Hero Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden group bg-[#1a1a1a]">
        <motion.div
          key={bannerUrl} // Re-animate when bannerUrl changes
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full"
        >
          <img 
            src={bannerUrl} 
            alt="Banner" 
            className="w-full h-auto block transition-transform duration-700 group-hover:scale-105 relative z-0"
            onError={(e) => {
              if (bannerUrl !== DEFAULT_BANNER) {
                setBannerUrl(DEFAULT_BANNER);
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-[4%] sm:p-8 md:p-10 z-10">
            <h1 className="text-[4vw] sm:text-[21px] md:text-[24px] lg:text-[28px] leading-tight font-bold text-white mb-[1.5%] sm:mb-3">
              Your Learning Partner
            </h1>
            <button 
              onClick={scrollToCourses}
              className="w-fit bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold py-[1%] px-[2.5%] sm:py-2.5 sm:px-6 rounded-[4px] sm:rounded-xl transition-all shadow-[0_0_20px_rgba(50,205,50,0.4)] hover:shadow-[0_0_30px_rgba(50,205,50,0.6)] flex items-center gap-[1vw] sm:gap-2 text-[2.5vw] sm:text-sm md:text-base"
            >
              Explore Courses <ChevronRight size={10} className="w-[3vw] h-[3vw] sm:w-5 sm:h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[
          { title: 'Total Courses', value: stats.courses, icon: PlayCircle, color: 'text-blue-500' },
          { title: 'Students Joined', value: stats.students, icon: Users, color: 'text-green-500' },
          { title: 'Polytechnics', value: stats.polytechnics, icon: Building2, color: 'text-purple-500' },
        ].map((stat, i) => (
          <GlassmorphicCard key={i} className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 ${stat.color}`}>
              <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-3xl font-bold text-[var(--text)]">
                <AnimatedCounter value={stat.value} suffix="+" />
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
            </div>
          </GlassmorphicCard>
        ))}
      </div>

      {/* Donation Greeting Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        <GlassmorphicCard className="flex-1 p-4 sm:p-6 flex items-center justify-between overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 w-full">
            <div className="p-3 rounded-full bg-red-500/10 text-red-500 shrink-0">
              <Heart className="w-6 h-6 fill-red-500 animate-pulse" />
            </div>
            <div className="flex-1 overflow-hidden relative h-[50px] flex items-center">
              <AnimatePresence mode="wait">
                {approvedDonations.length > 0 ? (
                  <motion.div
                    key={currentDonationIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-full cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);
                      if (swipe < -swipeConfidenceThreshold) {
                        paginate(1);
                      } else if (swipe > swipeConfidenceThreshold) {
                        paginate(-1);
                      }
                    }}
                  >
                    <p className="text-sm sm:text-base text-[var(--text)] font-medium">
                      Thank you <span className="text-[var(--primary)] font-bold">{approvedDonations[currentDonationIndex].student_name}</span> from <span className="font-bold">{approvedDonations[currentDonationIndex].polytechnic_name}</span> for your generous support! 🎉
                    </p>
                  </motion.div>
                ) : (
                  <motion.div className="absolute w-full">
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                      Be the first to support PolyGuid and get featured here!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassmorphicCard>
        
        <button 
          onClick={() => setShowDonateModal(true)}
          className="shrink-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-3 sm:py-6 rounded-xl sm:rounded-2xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 hover:scale-105 text-sm sm:text-base whitespace-nowrap"
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> Donate Now
        </button>
      </div>

      {/* Department-wise Courses (Semesters) - Moved UP */}
      <section className="flex flex-col gap-4 sm:gap-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] text-center mb-2 sm:mb-4">ক্লাস অনুযায়ী কোর্স দেখুন</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto w-full">
          {SEMESTERS.map((semester, i) => (
            <GlassmorphicCard 
              key={i} 
              hoverEffect 
              onClick={() => {
                navigate(`/semester/${encodeURIComponent(semester)}`);
              }}
              className={`p-2 sm:p-4 flex items-center justify-center cursor-pointer text-center transition-all hover:bg-black/10 dark:hover:bg-white/10 hover:border-[var(--primary)]/50 ${i === SEMESTERS.length - 1 && SEMESTERS.length % 2 !== 0 ? 'col-span-2' : ''}`}
            >
              <span className="font-bold text-[var(--text)] text-xs sm:text-lg leading-tight">{semester}</span>
            </GlassmorphicCard>
          ))}
        </div>
      </section>

      {/* Popular Courses (Pinned) */}
      <section ref={coursesRef} className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">জনপ্রিয় কোর্স সমূহ</h2>
        </div>
        
        {allCourses.filter(c => c.pinned_position > 0).length > 0 ? (
          <div className="relative group">
            <div 
              ref={scrollContainerRef} 
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar scroll-smooth"
            >
              {allCourses
                .filter(c => c.pinned_position > 0)
                .sort((a, b) => a.pinned_position - b.pinned_position)
                .map((course, i) => (
                  <div key={i} className="min-w-[200px] sm:min-w-[240px] md:min-w-[260px] max-w-[300px] snap-start">
                    <CourseCard 
                      {...course} 
                      isEnrolled={enrollments.some(e => e.course_id === course.id)}
                    />
                  </div>
              ))}
            </div>
            {/* Navigation Buttons for Desktop */}
            <div className="hidden lg:block">
               <button 
                  onClick={() => {
                    if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft -= 300;
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-[var(--primary)] transition-all z-10 border border-gray-100"
               >
                  <ChevronLeft size={20} />
               </button>
               <button 
                  onClick={() => {
                    if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft += 300;
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-gray-400 hover:text-[var(--primary)] transition-all z-10 border border-gray-100"
               >
                  <ChevronRight size={20} />
               </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 opacity-50 select-none">
            <BookOpen size={48} className="text-gray-500" strokeWidth={1} />
            <h2 className="text-lg font-light text-gray-400 tracking-wider">এখনো কোনো জনপ্রিয় কোর্স পিন করা হয়নি</h2>
          </div>
        )}
      </section>

      {/* Description Section */}
      <section className="mt-4 sm:mt-8">
        <GlassmorphicCard className="p-6 sm:p-8 md:p-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--primary)] mb-4 sm:mb-6">শিক্ষার্থীদের উদ্দেশ্যে কিছু কথা:</h2>
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-black dark:text-gray-300 leading-relaxed text-justify font-medium">
            <p>
              PolyGuid (পলিগাইড)-এর পক্ষ থেকে তোমাদের সবাইকে জানাই আন্তরিক অভিনন্দন। আমরা বিশ্বাস করি, আজকের পলিটেকনিক শিক্ষার্থীরাই আগামী দিনের দক্ষ প্রকৌশলী হিসেবে দেশকে এগিয়ে নিয়ে যাবে। তোমাদের এই কঠিন ও পরিশ্রমী শিক্ষাসফরকে কিছুটা সহজ এবং ডিজিটাল করার লক্ষ্যেই আমাদের এই বিশেষ প্ল্যাটফর্মের যাত্রা শুরু।
            </p>
            <p>
              PolyGuid এমন একটি প্ল্যাটফর্ম যেখানে তোমরা তোমাদের প্রয়োজনীয় সকল স্টাডি ম্যাটেরিয়ালস, নোটস এবং বুক-পিডিএফ ফাইল এক জায়গায় খুঁজে পাবে। আমাদের মূল লক্ষ্য হলো দেশের প্রতিটি প্রান্তের পলিটেকনিক শিক্ষার্থীদের জন্য মানসম্মত শিক্ষা উপকরণ সরবরাহ করা। আমাদের এই প্ল্যাটফর্মের সিংহভাগ রিসোর্স এবং ফাইলসমূহ শিক্ষার্থীদের জন্য সম্পূর্ণ বিনামূল্যে (Free) রাখা হয়েছে, যাতে অর্থের অভাবে কারো পড়াশোনা থেমে না থাকে। তবে, আমাদের সেবার মান আরও উন্নত করা এবং প্ল্যাটফর্মের স্থায়িত্ব নিশ্চিত করার লক্ষ্যে কিছু বিশেষায়িত সার্ভিস বা কন্টেন্ট অত্যন্ত সাশ্রয়ী মূল্যে প্রিমিয়াম (Paid) ক্যাটাগরিতেও রাখা হয়েছে।
            </p>
            <p>
              আমরা অত্যন্ত সততা এবং পেশাদারিত্বের সাথে তোমাদের জানাতে চাই যে, Polyguid কোনো প্রকার ‘পাইরেসি’ বা নীতিবহির্ভূত কাজে বিশ্বাস করে না। আমরা অন্য কোনো ব্যক্তি বা প্রতিষ্ঠানের বিশেষায়িত পেইড কোর্স বা প্রিমিয়াম কন্টেন্ট অবৈধভাবে শেয়ার করি না। আমাদের প্ল্যাটফর্মে যে সকল ফ্রি ম্যাটেরিয়াল দেওয়া হয়, তা মূলত ইন্টারনেটে পাবলিকলি এভেইলএবল (Publicly Available) বা উন্মুক্তভাবে পাওয়া যায় এমন তথ্যের একটি সুসংগঠিত সংস্করণ মাত্র। আমরা ডিজিটাল কপিরাইট এবং মেধাস্বত্বের প্রতি পূর্ণ সম্মান প্রদর্শন করি। অন্য কোনো প্ল্যাটফর্মের ব্যবসায়িক ক্ষতি বা তাদের প্রাইভেসিতে হস্তক্ষেপ করা আমাদের উদ্দেশ্য নয়; বরং আমরা কেবল ছড়িয়ে থাকা উন্মুক্ত রিসোর্সগুলোকে তোমাদের সুবিধার জন্য সহজভাবে সাজিয়ে উপস্থাপন করি।
            </p>
            <p>
              আমাদের একমাত্র লক্ষ্য হলো একটি সুস্থ এবং সহযোগিতামূলক শিক্ষা ব্যবস্থা গড়ে তোলা। আমরা চাই প্রতিটি শিক্ষার্থী যেন Polyguid-কে তাদের একজন বিশ্বস্ত এবং নির্ভরযোগ্য 'লার্নিং পার্টনার' হিসেবে পাশে পায়। তোমাদের সাফল্যের প্রতিটি ধাপে আমরা আমাদের সর্বোচ্চ সহযোগিতা নিয়ে পাশে থাকতে প্রতিশ্রুতিবদ্ধ।
            </p>
          </div>
        </GlassmorphicCard>
      </section>

      {/* Donate Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full relative border border-black/10 dark:border-white/10 shadow-2xl"
            >
              <button onClick={() => setShowDonateModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[var(--text)]">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500" size={24} /> Support PolyGuid
              </h2>
              
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Send Money to this number:</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-[var(--primary)] tracking-wider">{donationNumber || '017XXXXXXXX'}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(donationNumber || '017XXXXXXXX');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 bg-white dark:bg-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 transition-colors shadow-sm dark:shadow-none border border-black/5 dark:border-transparent"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-600 dark:text-gray-400" />}
                  </button>
                </div>
                <div className="flex justify-center gap-4 items-center">
                  <div className="bg-white p-1.5 rounded-md border border-black/10 dark:border-transparent shadow-sm">
                    <img src="https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png" alt="bKash" className="h-6 object-contain" />
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-black/10 dark:border-transparent shadow-sm">
                    <img src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png" alt="Nagad" className="h-6 object-contain" />
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-black/10 dark:border-transparent shadow-sm">
                    <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D104E17A-seeklogo.com.png" alt="Rocket" className="h-6 object-contain" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleDonateSubmit} className="flex flex-col gap-4">
                <input required type="text" placeholder="Your Name" value={donateForm.name} onChange={e => setDonateForm({...donateForm, name: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-lg p-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                <input required type="text" placeholder="Polytechnic Name" value={donateForm.polytechnic} onChange={e => setDonateForm({...donateForm, polytechnic: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-lg p-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                <input required type="text" placeholder="Transaction ID (TrxID)" value={donateForm.trxId} onChange={e => setDonateForm({...donateForm, trxId: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-black/20 dark:border-white/10 rounded-lg p-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                
                {donateMsg && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${donateMsg.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-red-500/10 text-red-600 dark:text-red-500'}`}>
                    {donateMsg.text}
                  </div>
                )}

                <button disabled={isSubmittingDonate} type="submit" className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-lg hover:bg-[#28a428] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[var(--primary)]/20">
                  {isSubmittingDonate ? 'Submitting...' : 'Submit Details'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
