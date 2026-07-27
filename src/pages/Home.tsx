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
  BadgeCheck,
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
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set());
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

  // Removed wheel event listener as requested by user

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
            .select("*, profiles(full_name, polytechnic_name, avatar_url, is_verified)")
            .eq("status", "approved")
            .eq("type", "donation")
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

          const { data: donationData } = await supabase
            .from("payments")
            .select("course_id, status")
            .eq("user_id", session.user.id);
          
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
            newCache.enrollments = combinedEnrollments;
          }

          // Fetch profile for mobile greeting
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, polytechnic_name, role, is_verified, phone")
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
            .select("*, profiles(full_name, polytechnic_name, avatar_url, is_verified)")
            .eq("status", "approved")
            .eq("type", "donation")
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
    // Auto slide books and courses slider for both mobile and PC view
    const interval = setInterval(() => {
      [mobileBooksRef, scrollContainerRef].forEach(ref => {
        if (ref.current && !ref.current.matches(':hover')) {
          const { scrollLeft, scrollWidth, clientWidth } = ref.current;
          let itemWidth = window.innerWidth < 640 ? 150 : 220;
          if (scrollLeft + clientWidth >= scrollWidth - 20) {
            ref.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            ref.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
          }
        }
      });
    }, 3000); // 3 seconds interval
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
      className="flex flex-col gap-6 sm:gap-12 pb-10"
    >
      {/* Mobile Greeting and Features (Mobile Only) */}
      <div className="lg:hidden w-full bg-gradient-to-br from-indigo-50/50 via-white to-green-50/50 dark:from-[#1a1a1a] dark:via-black dark:to-[#112211] pt-4 pb-8 px-4 rounded-b-[2rem] shadow-sm mb-2 border-b border-black/5 dark:border-white/5">
        
        {/* Profile and Greeting */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center overflow-hidden border-2 border-white dark:border-[#333] bg-white dark:bg-black shadow-sm">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} className="text-[#32CD32]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
              {getGreeting()}, {profile?.full_name || "শিক্ষার্থী"}
              {(profile?.is_verified || profile?.role === 'admin' || profile?.phone === '01993879904' || profile?.full_name?.includes('PolyGuide')) && (
                <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-[1.125rem] h-[1.125rem] shrink-0" size={16} />
              )}
            </h2>
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              <Building2 size={10} className="text-[#32CD32]" />
              <span className="font-semibold truncate">
                {profile?.polytechnic_name || "পলিটেকনিক তথ্য নেই"}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid - 4 items in one line for mobile */}
        <div className="grid grid-cols-4 gap-2 px-1">
          {[
            {
              name: "Marketplace",
              icon: BookOpen,
              color: "text-blue-600 dark:text-blue-400",
              bgColor: "bg-blue-100 dark:bg-blue-950/50",
              shadowColor: "shadow-blue-500/20",
              route: "/marketplace",
            },
            {
              name: "Check Result",
              icon: FileCheck,
              color: "text-purple-600 dark:text-purple-400",
              bgColor: "bg-purple-100 dark:bg-purple-950/50",
              shadowColor: "shadow-purple-500/20",
              route: "/results",
            },
            {
              name: "Free Books",
              icon: FileText,
              color: "text-red-500 dark:text-red-400",
              bgColor: "bg-red-100 dark:bg-red-950/50",
              shadowColor: "shadow-red-500/20",
              route: "/books-pdf?type=ebook",
            },
            {
              name: "Book List",
              icon: List,
              color: "text-orange-500 dark:text-orange-400",
              bgColor: "bg-orange-100 dark:bg-orange-950/50",
              shadowColor: "shadow-orange-500/20",
              route: "/book-list",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-1.5 text-center cursor-pointer group"
            >
              <div
                className={`w-[48px] h-[48px] rounded-full flex justify-center items-center ${item.bgColor} shadow-md ${item.shadowColor} active:scale-95 transition-all duration-300 border border-white/60 dark:border-white/10`}
              >
                <item.icon size={20} className={item.color} />
              </div>
              <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 leading-tight">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Access Buttons - Balanced Design (Desktop Only) */}
      <div className="hidden lg:grid grid-cols-4 gap-2 sm:gap-6 max-w-[1600px] mx-auto w-full px-4">
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
            name: "Free Books",
            icon: FileText,
            color: "text-red-500",
            bg: "bg-red-500/5",
            path: "/books-pdf?type=ebook",
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

      {/* 4. Semester-wise Section - Positioned right after Quick Access buttons with gap */}
      <section className="flex flex-col gap-4 sm:gap-6 px-4 pt-2 pb-4">
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] text-center tracking-tight">
            আপনার সেমিস্টার সিলেক্ট করুন
          </h2>
          <div className="w-10 sm:w-16 h-1 bg-[var(--primary)] rounded-full opacity-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-[1600px] mx-auto w-full">
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

      {/* 5. Popular Courses Section - Responsive Layout */}
      <section
        ref={coursesRef}
        className="flex flex-col gap-3 sm:gap-5 px-4 max-w-[1600px] mx-auto w-full"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            জনপ্রিয় কোর্স সমূহ
          </h2>
          <button
            onClick={() => navigate("/courses", { replace: false })}
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
                className="flex gap-2 sm:gap-4 overflow-x-auto lg:overflow-x-hidden pb-4 snap-x hide-scrollbar scroll-smooth"
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
                        purchaseStatus={pendingCourseIds.has(course.id) ? 'pending' : undefined}
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
      <section className="flex flex-col gap-3 sm:gap-5 px-4 max-w-[1600px] mx-auto w-full pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            জনপ্রিয় বই সমূহ
          </h2>
          <button
            onClick={() => navigate("/books-pdf?type=all", { replace: false })}
            className="text-[9px] sm:text-[10px] font-black text-[var(--primary)] hover:underline uppercase tracking-wider"
          >
            সবগুলো দেখুন
          </button>
        </div>

        <div className="relative group">
          {allCourses.filter(
            (c) => c.pinned_pdf_position !== null && c.pinned_pdf_position > 0,
          ).length > 0 ? (
            <>
              <div
                ref={mobileBooksRef}
                className="flex gap-2 sm:gap-4 overflow-x-auto lg:overflow-x-hidden pb-4 snap-x hide-scrollbar scroll-smooth"
              >
                {allCourses
                  .filter(
                    (c) => c.pinned_pdf_position !== null && c.pinned_pdf_position > 0,
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
                        purchaseStatus={pendingCourseIds.has(course.id) ? 'pending' : undefined}
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
                এখনো কোনো জনপ্রিয় বই পিন করা হয়নি
              </h2>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
