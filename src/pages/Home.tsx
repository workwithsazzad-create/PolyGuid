import React, { useRef, useState, useEffect } from "react";
import { motion, animate, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calculator,
  FileText,
  List,
  Users,
  Building2,
  PlayCircle,
  Heart,
  Copy,
  Check,
  X,
  FileCheck,
  User,
} from "lucide-react";
import GlassmorphicCard from "@/src/components/ui/GlassmorphicCard";
import CourseCard from "@/src/components/ui/CourseCard";
import { supabase } from "@/src/lib/supabase";
import { getDirectLink } from "@/src/lib/utils";
import { useNavigate } from "react-router-dom";
import Footer from "@/src/components/Footer";
import {
  homeCache as globalHomeCache,
  prefetchHomeData,
  setHomeCache,
} from "@/src/services/dataService";
import PaymentModal from "@/src/components/ui/PaymentModal";

const AnimatedCounter = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString() + suffix;
      },
    });

    return () => controls.stop();
  }, [value, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
};

const SEMESTERS = [
  "১ম সেমিস্টার",
  "২য় সেমিস্টার",
  "৩য় সেমিস্টার",
  "৪র্থ সেমিস্টার",
  "৫ম সেমিস্টার",
  "৬ষ্ঠ সেমিস্টার",
  "৭ম সেমিস্টার",
];

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop";

export default function Home() {
  const navigate = useNavigate();
  const coursesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileBooksRef = useRef<HTMLDivElement>(null);

  // Initialize from cache but allow loadAllData to refresh them
  const [bannerUrl, setBannerUrl] = useState<string>(
    globalHomeCache?.bannerUrl || DEFAULT_BANNER,
  );
  const [allCourses, setAllCourses] = useState<any[]>(
    globalHomeCache?.allCourses || [],
  );
  const [stats, setStats] = useState(
    globalHomeCache?.stats || {
      courses: 150,
      students: 20000,
      polytechnics: 49,
    },
  );
  const [isLoading, setIsLoading] = useState(!globalHomeCache);
  const [enrollments, setEnrollments] = useState<any[]>(
    globalHomeCache?.enrollments || [],
  );
  const [realUserCount, setRealUserCount] = useState(0);
  const [profile, setProfile] = useState<any>(globalHomeCache?.profile || null);

  // Donation State
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationNumber, setDonationNumber] = useState(
    globalHomeCache?.donationNumber || "01993879904",
  );
  const [approvedDonations, setApprovedDonations] = useState<any[]>(
    globalHomeCache?.approvedDonations || [],
  );
  const [currentDonationIndex, setCurrentDonationIndex] = useState(0);

  const getGreeting = () => {
    return "Welcome";
  };

  useEffect(() => {
    const fetchUserCount = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (count !== null) setRealUserCount(count);
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    let subscription: any = null;
    let profileSubscription: any = null;
    let isMounted = true;

    const loadAllData = async () => {
      // Only show top-level loading if we don't have cached data
      if (!globalHomeCache && isMounted) {
        setIsLoading(true);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Real-time subscription for profile changes
        if (session) {
          const profileChannelId = `profile_realtime_${session.user.id}_${Math.random().toString(36).substring(7)}`;
          profileSubscription = supabase
            .channel(profileChannelId)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${session.user.id}`,
              },
              (payload) => {
                if (isMounted) {
                  setProfile(payload.new);
                  // Update cache as well
                  const updatedCache = { ...globalHomeCache, profile: payload.new };
                  setHomeCache(updatedCache);
                }
              }
            )
            .subscribe();
        }

        let coursesRes, bannerRes, statsRes, donationsRes;

        try {
          coursesRes = await supabase
            .from("courses")
            .select("*")
            .order("created_at", { ascending: false });
        } catch (e) {
          coursesRes = { data: null, error: e };
        }

        try {
          bannerRes = await supabase
            .from("site_settings")
            .select("key, value")
            .eq("key", "home_banner")
            .maybeSingle();
        } catch (e) {
          bannerRes = { data: null, error: e };
        }

        try {
          statsRes = await supabase
            .from("site_settings")
            .select("key, value")
            .in("key", [
              "stat_courses",
              "stat_students",
              "stat_polytechnics",
              "donation_number",
              "pinned_courses",
              "pinned_pdfs",
            ]);
        } catch (e) {
          statsRes = { data: null, error: e };
        }

        try {
          donationsRes = await supabase
            .from("donations")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });
        } catch (e) {
          donationsRes = { data: null, error: e };
        }

        const coursesData = coursesRes.data;
        const bannerData = bannerRes.data;
        const statsData = statsRes.data;
        const donationsData = donationsRes.data;

        if (!isMounted) return;

        // Initialize new cache from existing global cache if available
        const newCache: any = globalHomeCache ? { ...globalHomeCache } : {};

        if (donationsData) {
          setApprovedDonations(donationsData);
          newCache.approvedDonations = donationsData;
        }

        let pinnedMap: Record<string, number> = {};
        let pinnedPdfsMap: Record<string, number> = {};
        if (statsData) {
          statsData.forEach((item: any) => {
            if (item.key === "pinned_courses") {
              try {
                pinnedMap = JSON.parse(item.value);
              } catch (e) {}
            }
            if (item.key === "pinned_pdfs") {
              try {
                pinnedPdfsMap = JSON.parse(item.value);
              } catch (e) {}
            }
          });
        }

        if (coursesData) {
          const processedCourses = coursesData.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            price: c.price,
            originalPrice: c.original_price,
            thumbnail:
              c.thumbnail_url ||
              "https://placehold.co/600x400/1a1a1a/32CD32?text=New+Course",
            classes: c.classes_count,
            categories: c.categories || [],
            pinned_position: pinnedMap[c.id] || null,
            pinned_pdf_position: pinnedPdfsMap[c.id] || null,
          }));
          setAllCourses(processedCourses);
          newCache.allCourses = processedCourses;
        }

        if (session) {
          const { data: enrollmentsData } = await supabase
            .from("enrollments")
            .select("course_id")
            .eq("user_id", session.user.id);

          if (enrollmentsData) {
            setEnrollments(enrollmentsData);
            newCache.enrollments = enrollmentsData;
          }

          // Fetch profile for mobile greeting
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, polytechnic_name")
            .eq("id", session.user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
            newCache.profile = profileData;
          }
        }

        if (bannerData?.value) {
          setBannerUrl(bannerData.value);
          newCache.bannerUrl = bannerData.value;
        }

        if (statsData) {
          // Always start with fresh defaults to ensure database overrides actually happen
          const newStats = { courses: 150, students: 20000, polytechnics: 49 };
          let newDonationNumber = "01993879904";

          statsData.forEach((item: any) => {
            if (item.key === "stat_courses" && item.value)
              newStats.courses = parseInt(item.value, 10) || 150;
            if (item.key === "stat_students" && item.value)
              newStats.students =
                (parseInt(item.value, 10) || 0) + realUserCount;
            if (item.key === "stat_polytechnics" && item.value)
              newStats.polytechnics = parseInt(item.value, 10) || 49;
            if (item.key === "donation_number" && item.value)
              newDonationNumber = item.value;
          });

          setStats(newStats);
          setDonationNumber(newDonationNumber);
          newCache.stats = newStats;
          newCache.donationNumber = newDonationNumber;
        }

        // Global cache update
        setHomeCache(newCache);

        const fetchDonationsData = async () => {
          const { data } = await supabase
            .from("donations")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });
          if (isMounted && data) setApprovedDonations(data);
        };

        // Realtime subscription for donations
        const channelId = `donations_changes_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        subscription = supabase
          .channel(channelId)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "donations" },
            () => {
              fetchDonationsData();
            },
          )
          .subscribe();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
      if (subscription) supabase.removeChannel(subscription);
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);

  const scrollToCourses = () => {
    coursesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (approvedDonations.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentDonationIndex((prev) => (prev + 1) % approvedDonations.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [approvedDonations.length]);

  useEffect(() => {
    // Auto slide books and courses slider for mobile view
    if (window.innerWidth >= 1024) return; // Only on mobile
    const interval = setInterval(() => {
      [mobileBooksRef, scrollContainerRef].forEach(ref => {
        if (ref.current) {
          const { scrollLeft, scrollWidth, clientWidth } = ref.current;
          let itemWidth = window.innerWidth < 640 ? 150 : 220;
          if (scrollLeft + clientWidth >= scrollWidth - 20) {
            ref.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            ref.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
          }
        }
      });
    }, 1000); // Fast enough, though 0.5s clashes with smooth scrolling CSS duration
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-pulse">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-10 sm:gap-20 pb-0"
    >
      {/* 1. Hero Banner (Desktop Only) */}
      <div className="max-w-7xl mx-auto w-full px-4 hidden lg:block">
        <div className="relative w-full rounded-2xl sm:rounded-[32px] overflow-hidden group bg-[#1a1a1a] shadow-2xl">
          <motion.div
            key={bannerUrl}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-full"
          >
            <img
              src={getDirectLink(bannerUrl)}
              alt="Banner"
              referrerPolicy="no-referrer"
              className="w-full h-auto block transition-transform duration-700 group-hover:scale-105 relative z-0"
            />
            <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10 pointer-events-none" />

            <div className="absolute bottom-[8%] left-[6%] sm:bottom-8 sm:left-12 md:bottom-10 md:left-16 z-20 hidden lg:block">
              <button
                onClick={scrollToCourses}
                className="w-fit bg-[var(--primary)] text-white font-black h-5 xs:h-7 sm:h-11 px-3 xs:px-5 sm:px-8 rounded-md sm:rounded-2xl transition-all hover:bg-[#28a428] shadow-[0_4px_12px_rgba(50,205,50,0.4)] hover:shadow-[0_8px_25px_rgba(50,205,50,0.6)] flex items-center justify-center gap-1.5 sm:gap-3 text-[7px] xs:text-[10px] sm:text-lg whitespace-nowrap active:scale-90"
              >
                Explore Courses{" "}
                <ChevronRight className="w-2.5 h-2.5 xs:w-3.5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Greeting and Features (Mobile Only) */}
      <div className="lg:hidden w-full bg-gradient-to-br from-indigo-50/50 via-white to-green-50/50 dark:from-[#1a1a1a] dark:via-black dark:to-[#112211] pt-4 pb-10 px-4 rounded-b-[2rem] shadow-sm mb-4 border-b border-black/5 dark:border-white/5">
        
        {/* Branding - Absolute corner alignment */}
        <div className="flex justify-start items-center mb-6">
          <span className="text-xl font-bold tracking-tight font-sans">
            <span className="text-[#32CD32]">P</span>
            <span className="text-gray-900 dark:text-white">oly</span>
            <span className="text-[#32CD32]">G</span>
            <span className="text-gray-900 dark:text-white">uid</span>
          </span>
        </div>

        {/* Profile and Greeting */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-full flex flex-shrink-0 items-center justify-center overflow-hidden border-2 border-white dark:border-[#333] bg-white dark:bg-black shadow-sm">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={28} className="text-[#32CD32]" />
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {getGreeting()}, {profile?.full_name || "শিক্ষার্থী"}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              <Building2 size={12} className="text-[#32CD32]" />
              <span className="font-semibold">
                {profile?.polytechnic_name || "পলিটেকনিক তথ্য নেই"}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid - Even more space and smaller refined buttons */}
        <div className="grid grid-cols-4 gap-2 mt-8 px-2">
          {[
            {
              name: "Book Buy/Sell",
              icon: BookOpen,
              color: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              shadowColor: "shadow-blue-500/20",
              route: "/marketplace",
            },
            {
              name: "Check Result",
              icon: FileCheck,
              color: "text-purple-600",
              bgColor: "bg-purple-50 dark:bg-purple-900/20",
              shadowColor: "shadow-purple-500/20",
              route: "/results",
            },
            {
              name: "Book PDF",
              icon: FileText,
              color: "text-red-500",
              bgColor: "bg-red-50 dark:bg-red-900/20",
              shadowColor: "shadow-red-500/20",
              route: "/books-pdf",
            },
            {
              name: "Book List",
              icon: List,
              color: "text-orange-500",
              bgColor: "bg-orange-50 dark:bg-orange-900/20",
              shadowColor: "shadow-orange-500/20",
              route: "/book-list",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-2.5 text-center cursor-pointer group"
            >
              <div
                className={`w-[54px] h-[54px] xs:w-[62px] xs:h-[62px] rounded-full flex justify-center items-center ${item.bgColor} shadow-xl ${item.shadowColor} active:scale-95 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl border border-white/40 dark:border-white/5 shadow-black/5`}
              >
                <item.icon size={22} className={`${item.color} group-hover:scale-110 transition-transform`} />
              </div>
              <span className="text-[10px] xs:text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-tight tracking-tight">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Analytics Section - Significant pull up */}
      <div className="max-w-7xl mx-auto w-full px-4 -mt-10 lg:-mt-10 relative z-20">
        <GlassmorphicCard className="flex justify-between items-center bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl p-4 sm:p-5 sm:rounded-[32px] border border-black/5 dark:border-white/10 shadow-lg sm:px-16 w-full">
          {[
            {
              title: "TOTAL COURSES",
              value: stats.courses,
              icon: PlayCircle,
              color: "text-blue-500",
              bgColor: "bg-blue-500/10",
            },
            {
              title: "STUDENTS JOINED",
              value: stats.students,
              icon: Users,
              color: "text-green-500",
              bgColor: "bg-green-500/10",
            },
            {
              title: "POLYTECHNIC",
              value: stats.polytechnics,
              icon: Building2,
              color: "text-purple-500",
              bgColor: "bg-purple-500/10",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex flex-row items-center justify-center gap-1.5 xs:gap-2 sm:gap-4 flex-1 relative"
            >
              <div
                className={`p-1.5 xs:p-2 sm:p-3 rounded-xl sm:rounded-2xl ${stat.bgColor} ${stat.color} shrink-0`}
              >
                <stat.icon size={16} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <h3 className="text-[11px] xs:text-xs sm:text-2xl font-black text-[var(--text)] leading-none mb-0.5 sm:mb-1">
                  <AnimatedCounter
                    value={i === 1 ? stat.value + realUserCount : stat.value}
                    suffix="+"
                  />
                </h3>
                <p className="text-[5px] xs:text-[6px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider leading-tight">
                  {stat.title.split(' ').map((word, j) => <React.Fragment key={j}>{word}<br className="sm:hidden" /></React.Fragment>)}
                </p>
              </div>
              {i < 2 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-8 sm:h-12 bg-black/5 dark:bg-white/5" />
              )}
            </div>
          ))}
        </GlassmorphicCard>
      </div>

      {/* 3. Quick Access Buttons - Balanced Design (Desktop Only) */}
      <div className="hidden lg:grid grid-cols-4 gap-2 sm:gap-6 max-w-7xl mx-auto w-full px-4">
        {[
          {
            name: "Book Buy/Sell",
            icon: BookOpen,
            color: "text-blue-500",
            bg: "bg-blue-500/5",
            path: "/marketplace",
          },
          {
            name: "Check Result",
            icon: FileCheck,
            color: "text-purple-500",
            bg: "bg-purple-500/5",
            path: "/results",
          },
          {
            name: "Book PDF",
            icon: FileText,
            color: "text-red-500",
            bg: "bg-red-500/5",
            path: "/books-pdf",
          },
          {
            name: "Book List",
            icon: List,
            color: "text-orange-500",
            bg: "bg-orange-500/5",
            path: "/book-list",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            onClick={() => item.path && navigate(item.path)}
            className="p-2 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer text-center bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl sm:rounded-3xl shadow-sm hover:shadow-xl transition-all group"
          >
            <div
              className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}
            >
              <item.icon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className="font-extrabold text-[8px] sm:text-[12px] text-[var(--text)] tracking-tight leading-tight line-clamp-1">
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>

      {/* 5. Popular Courses Section - Responsive Layout */}
      <section
        ref={coursesRef}
        className="flex flex-col gap-3 sm:gap-5 px-4 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            জনপ্রিয় কোর্স সমূহ
          </h2>
          <button
            onClick={() => navigate("/courses")}
            className="text-[9px] sm:text-[10px] font-black text-[var(--primary)] hover:underline uppercase tracking-wider"
          >
            সবগুলো দেখুন
          </button>
        </div>

        <div className="relative group">
          {allCourses.filter(
            (c) => c.pinned_position !== null && c.pinned_position > 0,
          ).length > 0 ? (
            <>
              <div
                ref={scrollContainerRef}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar scroll-smooth"
              >
                {allCourses
                  .filter(
                    (c) => c.pinned_position !== null && c.pinned_position > 0,
                  )
                  .sort((a, b) => a.pinned_position - b.pinned_position)
                  .map((course, i) => (
                    <div
                      key={i}
                      className="min-w-[130px] sm:min-w-[180px] max-w-[140px] sm:max-w-[200px] snap-start"
                    >
                      <CourseCard
                        {...course}
                        isEnrolled={enrollments.some(
                          (e) => e.course_id === course.id,
                        )}
                      />
                    </div>
                  ))}
              </div>
              <div className="hidden lg:block">
                <button
                  onClick={() =>
                    scrollContainerRef.current &&
                    (scrollContainerRef.current.scrollLeft -= 220)
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-9 h-9 rounded-full bg-white dark:bg-[#1a1a1a] shadow-lg flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-all z-10 border border-black/5"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    scrollContainerRef.current &&
                    (scrollContainerRef.current.scrollLeft += 220)
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-9 h-9 rounded-full bg-white dark:bg-[#1a1a1a] shadow-lg flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-all z-10 border border-black/5"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
              <BookOpen size={40} className="text-gray-500" strokeWidth={1} />
              <h2 className="text-sm font-medium text-gray-400">
                এখনো কোনো জনপ্রিয় কোর্স পিন করা হয়নি
              </h2>
            </div>
          )}
        </div>
      </section>

      {/* 5.5 Popular Books Section */}
      <section className="flex flex-col gap-3 sm:gap-5 px-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            জনপ্রিয় বই সমূহ
          </h2>
          <button
            onClick={() => navigate("/books-pdf")}
            className="text-[9px] sm:text-[10px] font-black text-[var(--primary)] hover:underline uppercase tracking-wider"
          >
            সবগুলো দেখুন
          </button>
        </div>

        <div className="relative group">
          {/* We will filter books from courses that have 'বই' or 'Book' category, or show placeholder */}
          {allCourses.filter(
            (c) =>
              c.pinned_pdf_position !== null && (
                      c.categories?.includes("বই") ||
                      c.categories?.includes("Book") ||
                      c.title?.includes("বই")
                    ),
          ).length > 0 ? (
            <>
              <div
                ref={mobileBooksRef}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar scroll-smooth"
              >
                {allCourses
                  .filter(
                    (c) =>
                      c.pinned_pdf_position !== null && (
                      c.categories?.includes("বই") ||
                      c.categories?.includes("Book") ||
                      c.title?.includes("বই")
                    ),
                  )
                  .sort((a, b) => (a.pinned_pdf_position || 99) - (b.pinned_pdf_position || 99))
                  .map((course, i) => (
                    <div
                      key={i}
                      className="min-w-[130px] sm:min-w-[180px] max-w-[140px] sm:max-w-[200px] snap-start"
                    >
                      <CourseCard
                        {...course}
                        isBook={true}
                        isEnrolled={enrollments.some(
                          (e) => e.course_id === course.id,
                        )}
                      />
                    </div>
                  ))}
              </div>
              <div className="hidden lg:block">
                <button
                  onClick={() =>
                    mobileBooksRef.current &&
                    (mobileBooksRef.current.scrollLeft -= 220)
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-9 h-9 rounded-full bg-white dark:bg-[#1a1a1a] shadow-lg flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-all z-10 border border-black/5"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    mobileBooksRef.current &&
                    (mobileBooksRef.current.scrollLeft += 220)
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-9 h-9 rounded-full bg-white dark:bg-[#1a1a1a] shadow-lg flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-all z-10 border border-black/5"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
              <BookOpen size={40} className="text-gray-500" strokeWidth={1} />
              <h2 className="text-sm font-medium text-gray-400">
                খুব শীঘ্রই বই যুক্ত করা হবে
              </h2>
            </div>
          )}
        </div>
      </section>

      {/* 4. Semester-wise Section */}
      <section className="flex flex-col gap-4 sm:gap-6 px-4 pb-8">
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] text-center tracking-tight">
            আপনার সেমিস্টার সিলেক্ট করুন
          </h2>
          <div className="w-10 sm:w-16 h-1 bg-[var(--primary)] rounded-full opacity-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-7xl mx-auto w-full">
          {SEMESTERS.map((semester, i) => (
            <GlassmorphicCard
              key={i}
              hoverEffect
              onClick={() =>
                navigate(`/semester/${encodeURIComponent(semester)}`)
              }
              className="p-3 sm:p-4 flex items-center justify-center cursor-pointer text-center transition-all bg-white/40 dark:bg-black/10 border-black/5 dark:border-white/5 h-[40px] sm:h-[60px]"
            >
              <span className="font-bold text-[var(--text)] text-[10px] sm:text-xs">
                {semester}
              </span>
            </GlassmorphicCard>
          ))}
        </div>
      </section>

      {/* 6. Words for Students (Description) - Full Width Compact */}
      <section className="hidden lg:block px-4 max-w-7xl mx-auto w-full">
        <div className="bg-black/5 dark:bg-white/10 rounded-[20px] sm:rounded-[32px] p-5 sm:p-8 md:p-10">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[var(--primary)] rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-tight">
                শিক্ষার্থীদের উদ্দেশ্যে কিছু কথা
              </h2>
            </div>
            <div className="space-y-4 text-xs sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed text-justify font-medium">
              <p>
                PolyGuid (পলিগাইড)-এর পক্ষ থেকে তোমাদের সবাইকে জানাই আন্তরিক
                অভিনন্দন। আমরা বিশ্বাস করি, আজকের পলিটেকনিক শিক্ষার্থীরাই আগামী
                দিনের দক্ষ প্রকৌশলী হিসেবে দেশকে এগিয়ে নিয়ে যাবে। তোমাদের এই
                কঠিন ও পরিশ্রমী শিক্ষাসফরকে কিছুটা সহজ এবং ডিজিটাল করার লক্ষ্যেই
                আমাদের এই বিশেষ প্ল্যাটফর্মের যাত্রা শুরু।
              </p>
              <p>
                PolyGuid এমন একটি প্ল্যাটফর্ম যেখানে তোমরা তোমাদের প্রয়োজনীয় সকল
                স্টাডি ম্যাটেরিয়ালস, নোটস এবং বুক-পিডিএফ ফাইল এক জায়গায় খুঁজে
                পাবে। আমাদের মূল লক্ষ্য হলো দেশের প্রতিটি প্রান্তের পলিটেকনিক
                শিক্ষার্থীদের জন্য মানসম্মত শিক্ষা উপকরণ সরবরাহ করা। আমাদের এই
                প্ল্যাটফর্মের সিংহভাগ রিসোর্স এবং ফাইলসমূহ শিক্ষার্থীদের জন্য
                সম্পূর্ণ বিনামূল্যে (Free) রাখা হয়েছে, যাতে অর্থের অভাবে কারো
                পড়াশোনা থেমে না থাকে। তবে, আমাদের সেবার মান আরও উন্নত করা এবং
                প্ল্যাটফর্মের স্থায়িত্ব নিশ্চিত করার লক্ষ্যে কিছু বিশেষায়িত
                সার্ভিস বা কন্টেন্ট অত্যন্ত সাশ্রয়ী মূল্যে প্রিমিয়াম (Paid)
                ক্যাটাগরিতেও রাখা হয়েছে।
              </p>
              <p>
                আমরা অত্যন্ত সততা এবং পেশাদারিত্বের সাথে তোমাদের জানাতে চাই যে,
                Polyguid কোনো প্রকার ‘পাইরেসি’ বা নীতিবহির্ভূত কাজে বিশ্বাস করে
                না। আমরা অন্য কোনো ব্যক্তি বা প্রতিষ্ঠানের বিশেষায়িত পেইড কোর্স
                বা প্রিমিয়াম কন্টেন্ট অবৈধভাবে শেয়ার করি না। আমাদের প্ল্যাটফর্মে
                যে সকল ফ্রি ম্যাটেরিয়াল দেওয়া হয়, তা মূলত ইন্টারনেটে পাবলিকলি
                এভেইলএবল (Publicly Available) বা উন্মুক্তভাবে পাওয়া যায় এমন
                তথ্যের একটি সুসংগঠিত সংস্করণ মাত্র। আমরা ডিজিটাল কপিরাইট এবং
                মেধাস্বত্বের প্রতি পূর্ণ সম্মান প্রদর্শন করি। অন্য কোনো
                প্ল্যাটফর্মের ব্যবসায়িক ক্ষতি বা তাদের প্রাইভেসিতে হস্তক্ষেপ করা
                আমাদের উদ্দেশ্য নয়; বরং আমরা কেবল ছড়িয়ে থাকা উন্মুক্ত
                রিসোর্সগুলোকে তোমাদের সুবিয়ার জন্য সহজভাবে সাজিয়ে উপস্থাপন করি।
              </p>
              <p>
                আমাদের একমাত্র লক্ষ্য হলো একটি সুস্থ এবং সহযোগিতামূলক শিক্ষা
                ব্যবস্থা গড়ে তোলা। আমরা চাই প্রতিটি শিক্ষার্থী যেন Polyguid-কে
                তাদের একজন বিশ্বস্ত এবং নির্ভরযোগ্য 'লার্নিং পার্টনার' হিসেবে
                পাশে পায়। তোমাদের সাফল্যের প্রতিটি ধাপে আমরা আমাদের সর্বোচ্চ
                সহযোগিতা নিয়ে পাশে থাকতে প্রতিশ্রুতিবদ্ধ।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Donation Section - Compact */}
      <section className="flex flex-col gap-6 px-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex-1 p-3 sm:p-4 flex items-center justify-between overflow-hidden bg-white/40 dark:bg-black/20 rounded-[16px] sm:rounded-[24px] shadow-sm min-h-[70px] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4 z-10 w-full">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                <Heart className="w-5 h-5 fill-red-500 animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden relative h-[45px] flex items-center">
                <AnimatePresence mode="wait">
                  {approvedDonations.length > 0 ? (
                    <motion.div
                      key={currentDonationIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="absolute w-full"
                    >
                      <p className="text-[10px] sm:text-sm text-[var(--text)] font-semibold leading-tight">
                        Thank you{" "}
                        <span className="text-[var(--primary)]">
                          {approvedDonations[currentDonationIndex].student_name}
                        </span>{" "}
                        from{" "}
                        <span className="text-gray-500 dark:text-gray-400">
                          {
                            approvedDonations[currentDonationIndex]
                              .polytechnic_name
                          }
                        </span>{" "}
                        for your support! 🎉
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div className="absolute w-full">
                      <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
                        Be the first to support PolyGuid!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDonateModal(true)}
            className="shrink-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-3 sm:py-4 rounded-[16px] sm:rounded-[24px] shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 text-xs sm:text-sm whitespace-nowrap"
          >
            <Heart className="w-4 h-4 fill-white" /> Donate Now
          </button>
        </div>
      </section>

      {/* 8. Footer */}
      <Footer />

      {/* Donate Modal */}
      <PaymentModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        type="donation"
        paymentNumber={donationNumber}
      />
    </motion.div>
  );
}
