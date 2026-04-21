import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import CourseCard from '@/src/components/ui/CourseCard';
import { Youtube, FileText, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

const DEMO_COURSES = [
  {
    title: "কম্পিউটার টেকনোলজি ১ম পর্ব",
    description: "ডিপ্লোমা ইন কম্পিউটার ইঞ্জিনিয়ারিং এর ১ম পর্বের প্রোফেশনাল কোর্স।",
    price: 500,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=CT+1st",
    classes: 24,
    exams: 6
  },
  {
    title: "সিভিল টেকনোলজি ৩য় পর্ব",
    description: "সিভিল ইঞ্জিনিয়ারিং এর ৩য় পর্বের সকল গুরুত্বপূর্ণ বিষয় নিয়ে সাজানো এই কোর্স।",
    price: 700,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Civil+3rd",
    classes: 30,
    exams: 8
  },
  {
    title: "ইলেকট্রিক্যাল টেকনোলজি (ফ্রি কোর্স)",
    description: "ইলেকট্রিক্যাল বেসিক নলেজ এবং টেকনিক্যাল স্কিল বৃদ্ধিতে এই ফ্রি কোর্স।",
    price: 0,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Electrical+Free",
    classes: 15,
    exams: 3
  },
  {
    title: "মেকানিক্যাল ইঞ্জিনিয়ারিং বেসিকস",
    description: "মেকানিক্যাল ইঞ্জিনিয়ারিং এর ফান্ডামেন্টাল কনসেপ্ট শিখুন খুব সহজে।",
    price: 0,
    thumbnail: "https://placehold.co/600x400/1a1a1a/32CD32?text=Mechanical",
    classes: 12,
    exams: 2
  }
];

export default function Dashboard() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (data?.full_name) {
          setUserName(data.full_name);
        }
      }
    };
    fetchProfile();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      <header className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Welcome back{userName ? `, ${userName}` : ' to PolyGuid'}!</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Continue your learning journey with the best resources.</p>
      </header>

      {/* Top Section: YouTube & PDF Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <GlassmorphicCard hoverEffect className="relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Youtube className="w-20 h-20 sm:w-[120px] sm:h-[120px] text-[var(--primary)]" />
          </div>
          <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Youtube className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">YouTube Playlist</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Access all free video lectures and tutorials.</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--primary)] font-semibold mt-1 sm:mt-2 text-sm sm:text-base">
              <span>Watch Now</span>
              <ChevronRight size={18} />
            </div>
          </div>
        </GlassmorphicCard>

        <GlassmorphicCard hoverEffect className="relative group cursor-pointer overflow-hidden">
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-20 h-20 sm:w-[120px] sm:h-[120px] text-[var(--primary)]" />
          </div>
          <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">Pdf Section</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Download lecture notes, books, and resources.</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--primary)] font-semibold mt-1 sm:mt-2 text-sm sm:text-base">
              <span>Browse Files</span>
              <ChevronRight size={18} />
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Bottom Section: Courses */}
      <section className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">কোর্স সমূহ</h2>
          <button className="text-sm sm:text-base text-[#32CD32] hover:underline flex items-center gap-1">
            View All <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {DEMO_COURSES.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CourseCard {...course} />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
