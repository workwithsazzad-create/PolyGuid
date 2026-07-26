import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate } from "motion/react";
import {
  Download,
  ChevronRight,
  PlayCircle,
  Users,
  Building2,
  Star,
  Facebook,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  BookOpen,
  LogIn,
  FileCheck,
  FileText,
  Heart,
  BadgeCheck,
  User,
  GraduationCap,
  ShoppingBag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { getDirectLink } from "@/src/lib/utils";
import Logo from "@/src/components/ui/Logo";
import Footer from "@/src/components/Footer";
import CourseCard from "@/src/components/ui/CourseCard";
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

// Real & Curated Student Reviews
const REVIEWS = [
  {
    id: 1,
    name: "তানভীর আহমেদ",
    polytechnic: "ঢাকা পলিটেকনিক ইনস্টিটিউট",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    text: "পলিগাইডের নোট এবং ভিডিও ক্লাসগুলো ডিপ্লোমা সেমিস্টার ফাইনাল পরীক্ষার প্রস্তুতির জন্য এক অবিশ্বাস্য সাহায্যকারী! ধন্যবাদ পলিগাইড টিমকে।",
  },
  {
    id: 2,
    name: "সাকিব হাসান",
    polytechnic: "চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    text: "কম দামে কিংবা সম্পূর্ণ ফ্রিতে এত সুন্দর গোছানো কোর্স ও বই পাওয়ার একমাত্র বিশ্বস্ত মাধ্যম হলো পলিগাইড।",
  },
  {
    id: 3,
    name: "ফারজানা আক্তার",
    polytechnic: "রাজশাহী পলিটেকনিক ইনস্টিটিউট",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rating: 4,
    text: "প্রাইভেট কোচিং ছাড়া শুধু পলিগাইডের সাহায্যে এ ক্লাসরুম ও টেস্ট এক্সাম দিয়ে এবার সেমিস্টারে জিপিএ ৪.০০ পেয়েছি!",
  },
  {
    id: 4,
    name: "মারুফ হোসেন",
    polytechnic: "রংপুর পলিটেকনিক ইনস্টিটিউট",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    text: "আমাদের সেমিস্টারের প্রয়োজনীয় সকল বইয়ের পিডিএফ এক ক্লিকে ড্যাশবোর্ডে পাওয়া যায়। অ্যাপ ইউজার এক্সপেরিয়েন্স দারুণ!",
  },
  {
    id: 5,
    name: "সাব্বির রহমান",
    polytechnic: "বগুড়া পলিটেকনিক ইনস্টিটিউট",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    rating: 4,
    text: "বাংলাদেশের পলিটেকনিক শিক্ষার্থীদের জন্য এটাই সেরা লার্নিং প্ল্যাটফর্ম। সবাই এক কমিউনিটিতে যুক্ত থেকে অনেক সাহায্য পাওয়া যায়।",
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [apkUrl, setApkUrl] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    courses: 20,
    students: 308,
    polytechnics: 10,
  });
  const [socialLinks, setSocialLinks] = useState({
    facebook: "#",
    whatsapp: "8801993879904",
  });
  const [showApkErrorModal, setShowApkErrorModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationNumber, setDonationNumber] = useState("01993879904");
  const [approvedDonations, setApprovedDonations] = useState<any[]>([]);
  const [currentDonationIndex, setCurrentDonationIndex] = useState(0);
  const [userSession, setUserSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchLandingData = async () => {
      try {
        // Fetch site settings
        const { data: settingsData } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", [
            "home_banner",
            "apk_url",
            "stat_courses",
            "stat_students",
            "stat_polytechnics",
            "social_fb",
            "social_whatsapp",
            "contact_phone",
            "donation_number",
            "pinned_courses",
            "pinned_pdfs",
          ]);

        let pinnedMap: Record<string, number> = {};
        let pinnedPdfsMap: Record<string, number> = {};

        if (settingsData && isMounted) {
          const newStats = { courses: 20, students: 308, polytechnics: 10 };
          const newSocial = { facebook: "#", whatsapp: "8801993879904" };

          settingsData.forEach((item) => {
            if (item.key === "home_banner" && item.value) setBannerUrl(item.value);
            if (item.key === "apk_url" && item.value) setApkUrl(item.value);
            if (item.key === "stat_courses" && item.value) newStats.courses = parseInt(item.value, 10) || 20;
            if (item.key === "stat_students" && item.value) newStats.students = parseInt(item.value, 10) || 308;
            if (item.key === "stat_polytechnics" && item.value) newStats.polytechnics = parseInt(item.value, 10) || 10;
            if (item.key === "social_fb" && item.value) newSocial.facebook = item.value;
            if (item.key === "social_whatsapp" && item.value) newSocial.whatsapp = item.value;
            if (item.key === "donation_number" && item.value) setDonationNumber(item.value);
            if (item.key === "pinned_courses" && item.value) {
              try {
                pinnedMap = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
              } catch (e) {
                console.error("Error parsing pinned_courses:", e);
              }
            }
            if (item.key === "pinned_pdfs" && item.value) {
              try {
                pinnedPdfsMap = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
              } catch (e) {
                console.error("Error parsing pinned_pdfs:", e);
              }
            }
          });

          setStats(newStats);
          setSocialLinks(newSocial);
        }

        // Fetch courses (matching main home page)
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });

        if (coursesData && isMounted) {
          const mapped = coursesData.map((c: any) => ({
            ...c,
            pinned_position: pinnedMap[c.id] || null,
            pinned_pdf_position: pinnedPdfsMap[c.id] || null,
          }));
          setCourses(mapped);
        }

        // Fetch approved donations
        try {
          const { data: donationsData } = await supabase
            .from("donations")
            .select(`
              *,
              profiles:user_id (
                full_name,
                polytechnic_name,
                avatar_url,
                is_verified
              )
            `)
            .eq("status", "approved")
            .order("created_at", { ascending: false });

          if (donationsData && isMounted) {
            setApprovedDonations(donationsData);
          }
        } catch (donErr) {
          console.error("Error fetching donations:", donErr);
        }
      } catch (err) {
        console.error("Error loading landing page data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLandingData();
    return () => { isMounted = false; };
  }, []);

  // Donation cycling effect
  useEffect(() => {
    if (approvedDonations.length > 1) {
      const interval = setInterval(() => {
        setCurrentDonationIndex((prev) => (prev + 1) % approvedDonations.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [approvedDonations]);

  // Auto sliding animation for reviews & courses
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      [reviewsScrollRef, coursesScrollRef].forEach((ref) => {
        if (ref.current && !ref.current.matches(":hover")) {
          const { scrollLeft, scrollWidth, clientWidth } = ref.current;
          const scrollStep = window.innerWidth < 640 ? 240 : 280;
          if (scrollLeft + clientWidth >= scrollWidth - 20) {
            ref.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            ref.current.scrollBy({ left: scrollStep, behavior: "smooth" });
          }
        }
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDownloadApp = () => {
    if (apkUrl && apkUrl.trim() !== "") {
      window.open(apkUrl, "_blank");
    } else {
      setShowApkErrorModal(true);
    }
  };

  const getWaUrl = (val: string) => {
    if (!val) return "https://wa.me/8801993879904";
    if (val.startsWith("http")) return val;
    const clean = val.replace(/\D/g, "");
    return `https://wa.me/${clean}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#32CD32] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#32CD32] animate-pulse">
            PolyGuide লোড হচ্ছে...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text)] relative selection:bg-[#32CD32]/20 flex flex-col font-sans">
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-black/40 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(userSession ? "/home" : "/login")}>
          <Logo showText={true} />
        </div>

        <div className="flex items-center gap-3">
          {userSession ? (
            <button
              onClick={() => navigate("/home")}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#32CD32] hover:bg-[#28a428] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-[#32CD32]/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <User size={16} />
              <span>প্রোফাইল</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#32CD32] hover:bg-[#28a428] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-[#32CD32]/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <LogIn size={16} />
              <span>লগইন</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Top Hero Banner (Clean Banner without Overlay Text) */}
      <section className="relative w-full overflow-hidden bg-transparent">
        <div className="relative w-full max-w-[1920px] mx-auto">
          {bannerUrl ? (
            <img
              src={getDirectLink(bannerUrl)}
              alt="PolyGuide Banner"
              referrerPolicy="no-referrer"
              className="w-full h-auto min-h-[160px] sm:min-h-[300px] max-h-[520px] object-cover block"
            />
          ) : (
            <div className="w-full h-[220px] sm:h-[350px] bg-gradient-to-r from-emerald-900 via-black to-green-950" />
          )}
        </div>

        {/* Animated Wave Edge SVG at Bottom of Banner */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-[32px] sm:h-[56px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <motion.path
              animate={{
                d: [
                  "M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z",
                  "M0,30 C200,-10 400,80 600,20 C800,-30 1000,70 1200,20 L1200,120 L0,120 Z",
                  "M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z"
                ]
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="fill-[var(--background)] opacity-80"
            />
            <motion.path
              animate={{
                d: [
                  "M0,20 C300,70 600,-20 900,60 C1050,100 1150,20 1200,40 L1200,120 L0,120 Z",
                  "M0,40 C250,-20 550,80 850,20 C1000,50 1100,10 1200,30 L1200,120 L0,120 Z",
                  "M0,20 C300,70 600,-20 900,60 C1050,100 1150,20 1200,40 L1200,120 L0,120 Z"
                ]
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="fill-[#32CD32] opacity-40"
            />
          </svg>
        </div>
      </section>

      {/* 3. Analytics Counter Bar */}
      <section className="max-w-6xl mx-auto w-full px-4 mt-6 sm:mt-10 relative z-30 mb-12">
        <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/10 shadow-xl grid grid-cols-3 gap-2 sm:gap-6 divide-x divide-black/5 dark:divide-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left px-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
                <AnimatedCounter value={stats.courses} suffix="+" />
              </h3>
              <p className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                TOTAL COURSES
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left px-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
                <AnimatedCounter value={stats.students} suffix="+" />
              </h3>
              <p className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                STUDENTS JOINED
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left px-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
                <AnimatedCounter value={stats.polytechnics} suffix="+" />
              </h3>
              <p className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                POLYTECHNIC
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Action Row: Download App & Get Started */}
      <section className="max-w-6xl mx-auto w-full px-4 mb-14">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900/20 via-black/40 to-green-900/20 border border-[#32CD32]/20 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="space-y-1.5 text-center sm:text-left z-10">
            <span className="text-[11px] font-bold uppercase text-[#32CD32] tracking-wider">
              মোবাইল অ্যাপ নামান
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              পলিগাইড অ্যান্ড্রয়েড অ্যাপ ডাউনলোড করুন
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md">
              যেকোনো স্থান থেকে সহজে ক্লাস, লাইভ টেস্ট এবং ফ্রি পিডিএফ অ্যাক্সেস করতে অ্যাপ নামিয়ে নিন।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0 z-10 w-full sm:w-auto">
            <button
              onClick={handleDownloadApp}
              className="flex-1 sm:flex-none px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 font-bold text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2.5"
            >
              <Download size={18} className="text-[#32CD32]" />
              <span>Download App (APK)</span>
            </button>

            {userSession ? (
              <button
                onClick={() => navigate("/home")}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-[#32CD32] hover:bg-[#28a428] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#32CD32]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>প্রোফাইলে যান</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-[#32CD32] hover:bg-[#28a428] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#32CD32]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 5. Join Us Social Media Section */}
      <section className="max-w-6xl mx-auto w-full px-4 mb-16">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest">কমিউনিটি</span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
            আমাদের সাথে যুক্ত হোন (Join Us)
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            ফেসবুক কমিউনিটি ও হোয়াটসঅ্যাপে আপডেট পেতে এখনই যুক্ত থাকুন
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Facebook */}
          <a
            href={socialLinks.facebook !== "#" ? socialLinks.facebook : "https://facebook.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Facebook size={24} className="fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">Facebook Group / Page</h3>
                <p className="text-xs text-blue-100 opacity-90">Join Us on Facebook</p>
              </div>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>

          {/* WhatsApp */}
          <a
            href={getWaUrl(socialLinks.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <MessageCircle size={24} className="fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">WhatsApp Support & Group</h3>
                <p className="text-xs text-emerald-100 opacity-90">Join Us on WhatsApp</p>
              </div>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* 6. Student Reviews Continuous Marquee */}
      <section className="max-w-7xl mx-auto w-full px-4 mb-20 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest">রিভিউ</span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              শিক্ষার্থীদের মতামত (Student Reviews)
            </h2>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs sm:text-sm bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
            <Star size={16} className="fill-amber-500" />
            <span>4.9 / 5.0 Rating</span>
          </div>
        </div>

        {/* Continuous Smooth Marquee Ticker */}
        <div className="relative overflow-hidden w-full py-2">
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-4 sm:gap-6 w-max"
            animate={{ x: ["0%", "-33.333%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25,
                ease: "linear",
              },
            }}
          >
            {[...REVIEWS, ...REVIEWS, ...REVIEWS].map((rev, index) => (
              <div
                key={`${rev.id}-${index}`}
                className="min-w-[280px] sm:min-w-[340px] max-w-[360px] bg-white/70 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between shrink-0"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#32CD32]/40"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">
                      {rev.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                      {rev.polytechnic}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. Popular Courses Section (Only pinned courses or video courses, centered if <= 3) */}
      <section className="max-w-7xl mx-auto w-full px-4 mb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest">কোর্সসমূহ</span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              জনপ্রিয় কোর্সসমূহ
            </h2>
          </div>
          <button
            onClick={() => navigate(userSession ? "/courses" : "/login")}
            className="text-xs sm:text-sm font-bold text-[#32CD32] hover:underline flex items-center gap-1"
          >
            সবগুলো দেখুন <ChevronRight size={16} />
          </button>
        </div>

        {(() => {
          const pinnedCoursesList = courses
            .filter((c) => c.pinned_position !== null && c.pinned_position > 0)
            .sort((a, b) => (a.pinned_position || 99) - (b.pinned_position || 99));

          const popularCoursesList = pinnedCoursesList.length > 0
            ? pinnedCoursesList
            : courses.filter((c) => !c.is_book && (!c.pinned_pdf_position || c.pinned_pdf_position === 0));

          return (
            <div
              ref={coursesScrollRef}
              className={`flex items-stretch gap-3 sm:gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory ${
                popularCoursesList.length <= 3 ? "justify-center" : "justify-start"
              }`}
              style={{ scrollbarWidth: "none" }}
            >
              {popularCoursesList.length > 0 ? (
                popularCoursesList.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(userSession ? `/course/${course.id}` : "/login")}
                    className="w-[220px] sm:w-[260px] shrink-0 snap-start cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <CourseCard
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      price={course.price || 0}
                      originalPrice={course.original_price}
                      thumbnail={course.thumbnail_url}
                      classes={course.classes_count || 12}
                      isBook={false}
                    />
                  </div>
                ))
              ) : (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    onClick={() => navigate("/login")}
                    className="w-[220px] sm:w-[260px] bg-white/70 dark:bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-black/5 dark:border-white/10 shadow-sm cursor-pointer shrink-0"
                  >
                    <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800 rounded-xl mb-3 flex items-center justify-center">
                      <BookOpen className="text-gray-400" size={32} />
                    </div>
                    <h3 className="font-bold text-sm">ডিপ্লোমা সেমিস্টার স্পেশাল কোর্স</h3>
                    <p className="text-xs text-[#32CD32] font-bold mt-2">৳০ (ফ্রি)</p>
                  </div>
                ))
              )}
            </div>
          );
        })()}
      </section>

      {/* 8. Why PolyGuide is Unique ("পলিগাইড কেন ভিন্নধর্মী ?") */}
      <section className="max-w-7xl mx-auto w-full px-4 mb-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#32CD32] uppercase tracking-widest">বৈশিষ্ট্যসমূহ</span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mt-1">
            পলিগাইড কেন ভিন্নধর্মী ?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
            পলিটেকনিক শিক্ষার্থীদের প্রতিটি ধাপে সহযোগিতার জন্য আমাদের বিশেষ ফিচার ও সার্ভিসসমূহ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Animated PolyGuide Logo Card (Compact & Floating) */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-xl shadow-[#32CD32]/10 flex items-center justify-center max-w-[220px] sm:max-w-[260px] w-full mx-auto"
            >
              <img
                src="/hero.png"
                alt="PolyGuide Logo"
                className="w-full h-auto object-contain drop-shadow-md"
              />
            </motion.div>
          </div>

          {/* Right Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <ShoppingBag size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  পুরানো বই কেনাবেচা (Marketplace)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  পলিগাইডের বুক মার্কেটপ্লেসে শিক্ষার্থীরা খুব সহজেই তাদের পুরনো সেমিস্টারের বই কেনা এবং বিক্রি করতে পারে।
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <FileCheck size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  ইনস্ট্যান্ট রেজাল্ট চেক (Result Check)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  সেমিস্টার পরীক্ষার ফলাফল খুব সহজেই রোল বা রেজি নম্বর দিয়ে মুহূর্তেই দেখার সুবিধা।
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  বিনামূল্যে বই ও নোট (Free Books & PDFs)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  সকল ডিপার্টমেন্ট ও সেমিস্টারের ই-বুক, সাজেশন, প্রশ্নব্যাংক ও নোট পিডিএফ সম্পূর্ণ ফ্রিতে ড্যাশবোর্ডে সংরক্ষিত।
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/70 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-[#32CD32]/10 text-[#32CD32] flex items-center justify-center shrink-0">
                <GraduationCap size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  লাইভ ক্লাস ও অনলাইন এক্সাম
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  অভিজ্ঞ শিক্ষকদের দ্বারা লাইভ ও রেকর্ড ভিডিও ক্লাস এবং নিজেকে যাচাই করতে অনলাইন কুইজ টেস্ট।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Words for Students (শিক্ষার্থীদের উদ্দেশ্যে কিছু কথা) */}
      <section className="max-w-7xl mx-auto w-full px-4 mb-20">
        <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-black/5 dark:border-white/10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#32CD32] rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                শিক্ষার্থীদের উদ্দেশ্যে কিছু কথা
              </h2>
            </div>
            <div className="space-y-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-justify font-medium">
              <p>
                PolyGuide (পলিগাইড)-এর পক্ষ থেকে তোমাদের সবাইকে জানাই আন্তরিক
                অভিনন্দন। আমরা বিশ্বাস করি, আজকের পলিটেকনিক শিক্ষার্থীরাই আগামী
                দিনের দক্ষ প্রকৌশলী হিসেবে দেশকে এগিয়ে নিয়ে যাবে। তোমাদের এই
                কঠিন ও পরিশ্রমী শিক্ষাসফরকে কিছুটা সহজ এবং ডিজিটাল করার লক্ষ্যেই
                আমাদের এই বিশেষ প্ল্যাটফর্মের যাত্রা শুরু।
              </p>
              <p>
                PolyGuide এমন একটি প্ল্যাটফর্ম যেখানে তোমরা তোমাদের প্রয়োজনীয় সকল
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
                PolyGuide কোনো প্রকার ‘পাইরেসি’ বা নীতিবহির্ভূত কাজে বিশ্বাস করে
                না। আমরা অন্য কোনো ব্যক্তি বা প্রতিষ্ঠানের বিশেষায়িত পেইড কোর্স
                বা প্রিমিয়াম কন্টেন্ট অবৈধভাবে শেয়ার করি না। আমাদের প্ল্যাটফর্মে
                যে সকল ফ্রি ম্যাটেরিয়াল দেওয়া হয়, তা মূলত ইন্টারনেটে পাবলিকলি
                এভেইলএবল (Publicly Available) বা উন্মুক্তভাবে পাওয়া যায় এমন
                তথ্যের একটি সুসংগঠিত সংস্করণ মাত্র। আমরা ডিজিটাল কপিরাইট এবং
                মেধাস্বত্বের প্রতি পূর্ণ সম্মান প্রদর্শন করি।
              </p>
              <p>
                আমাদের একমাত্র লক্ষ্য হলো একটি সুস্থ এবং সহযোগিতামূলক শিক্ষা
                ব্যবস্থা গড়ে তোলা। আমরা চাই প্রতিটি শিক্ষার্থী যেন PolyGuide-কে
                তাদের একজন বিশ্বস্ত এবং নির্ভরযোগ্য 'লার্নিং পার্টনার' হিসেবে
                পাশে পায়।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Donation Section */}
      <section className="max-w-7xl mx-auto w-full px-4 mb-20">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="flex-1 p-4 flex items-center justify-between overflow-hidden bg-white/70 dark:bg-black/30 backdrop-blur-md rounded-2xl shadow-sm min-h-[70px] border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-4 z-10 w-full">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                <Heart className="w-6 h-6 fill-red-500 animate-pulse" />
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
                      className="absolute w-full flex items-center gap-3 sm:gap-4"
                    >
                      {approvedDonations[currentDonationIndex].profiles?.avatar_url ? (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 border-[#32CD32]/20 shrink-0 shadow-sm">
                          <img 
                            src={approvedDonations[currentDonationIndex].profiles.avatar_url} 
                            alt={approvedDonations[currentDonationIndex].profiles?.full_name || 'Donor'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#32CD32]/10 flex items-center justify-center border-2 border-[#32CD32]/20 shrink-0 shadow-sm">
                          <User size={20} className="text-[#32CD32]" />
                        </div>
                      )}
                      
                      <div className="flex flex-col shrink-0 pr-4 sm:pr-6 md:pr-8">
                        <span className="text-[#32CD32] font-bold inline-flex items-center gap-1 text-[13px] sm:text-[15px] leading-tight">
                          {approvedDonations[currentDonationIndex].profiles?.full_name || approvedDonations[currentDonationIndex].student_name || 'Anonymous'}
                          {approvedDonations[currentDonationIndex].profiles?.is_verified && (
                            <BadgeCheck size={14} className="text-blue-500 fill-blue-500/20 shrink-0" />
                          )}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] sm:text-[11px] tracking-wider mt-0.5">
                          ({approvedDonations[currentDonationIndex].profiles?.polytechnic_name || approvedDonations[currentDonationIndex].polytechnic_name || 'RPI'})
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-[13px] text-gray-800 dark:text-gray-200 font-semibold leading-relaxed">
                          Thank you <span className="text-[#32CD32] font-bold">{approvedDonations[currentDonationIndex].profiles?.full_name?.split(' ')[0] || approvedDonations[currentDonationIndex].student_name?.split(' ')[0] || 'friend'}</span> from <strong>{approvedDonations[currentDonationIndex].profiles?.polytechnic_name || approvedDonations[currentDonationIndex].polytechnic_name || 'Polytechnic'}</strong> for your support! 🎉
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div className="absolute w-full">
                      <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
                        Be the first to support PolyGuide!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDonateModal(true)}
            className="shrink-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-4 rounded-2xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 text-xs sm:text-sm whitespace-nowrap"
          >
            <Heart className="w-4 h-4 fill-white" /> Donate Now
          </button>
        </div>
      </section>

      {/* 11. Donate Payment Modal */}
      <PaymentModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        type="donation"
        paymentNumber={donationNumber}
      />

      {/* 9. Footer */}
      <Footer showMobile={true} />

      {/* APK Missing Error Modal */}
      <AnimatePresence>
        {showApkErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#181818] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-black/10 dark:border-white/10 relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  APK ফাইল পাওয়া যায়নি
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  APK upload নেই, contact with PolyGuide
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={getWaUrl(socialLinks.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#32CD32] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#32CD32]/20 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span>Contact with PolyGuide</span>
                </a>

                <button
                  onClick={() => setShowApkErrorModal(false)}
                  className="w-full py-2.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
