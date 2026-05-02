import React from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import Footer from '@/src/components/Footer';

export default function About() {
  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full px-4"
      >
        <h1 className="text-3xl font-bold text-[var(--text)] mb-8 text-center italic">উদ্যোক্তা ও আমরা</h1>
        
        <GlassmorphicCard className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-[var(--text)]">PolyGuid-এর যাত্রা</h2>
            <div className="w-20 h-1 bg-[var(--primary)] mx-auto rounded-full" />
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
            <p className="relative">
              <span className="absolute -left-6 -top-2 text-4xl text-[var(--primary)] opacity-50 font-serif">"</span>
              প্রকৃতিকে নিজের মত করে পরিচালনা করতে করতে আমরা কয়েকজন নিজেদের ক্ষুদ্র জ্ঞানটুকু দেশের পলিটেকনিক শিক্ষার্থীদের মাঝে ছড়িয়ে দিতেই এই "PolyGuid" নামক অনলাইন প্ল্যাটফর্মটির যাত্রা শুরু করি। শিক্ষার্থীদের পড়াশোনাকে আরও সহজ এবং কার্যকর করার লক্ষ্যেই আমাদের এই পথচলা।
            </p>

            <p>
              পলিটেকনিক শিক্ষার্থীদের কারিগরি দক্ষতা উন্নয়নে এবং আধুনিক বিশ্বের সাথে তাল মিলিয়ে চলতে সহায়তা করার জন্য আমরা নিরলস কাজ করে যাচ্ছি। আমাদের টার্গেট ছিল গ্রামীণ শিক্ষার্থীরা যেন শহরের মতই উন্নত এবং কোয়ালিটি সম্পন্ন কনটেন্ট পায় এবং সকল স্তরে শিক্ষার মান যেন একই থাকে।
            </p>

            <p className="relative">
              কোন কিছুর শুরুটা যেমন হয় ০ (শূন্য) থেকে, আমাদের শুরুটাও ছিল একদম শূন্য থেকেই। আজ পলিগাইড পরিবারের লাখ লাখ সদস্যের ভালোবাসা আমাদের অনুপ্রাণিত করে আরও বড় কিছু করার। আমরা শিখতে চাই এবং শেখাতে চাই, এই লক্ষ্যেই এগিয়ে যাচ্ছে আমাদের পলিগাইড পরিবার....
              <span className="absolute -right-6 bottom-0 text-4xl text-[var(--primary)] opacity-50 font-serif">"</span>
            </p>
          </div>

          <div className="space-y-6 pt-8 border-t border-black/5 dark:border-white/5">
            <h3 className="text-xl font-bold text-center text-[var(--text)]">আমাদের লক্ষ্য ও উদ্দেশ্য</h3>
            <ul className="space-y-3 list-disc list-inside text-gray-600 dark:text-gray-400 font-medium">
              <li>শিক্ষার মানোন্নয়ন</li>
              <li>শহর থেকে গ্রাম — সবার কাছে মানসম্মত শিক্ষা পৌঁছে দেওয়া</li>
              <li>প্রযুক্তির ব্যবহারে সহজ ও স্বল্পমূল্যে শিক্ষাকে সবার নাগালে আনা</li>
              <li>শিক্ষার্থীদের ক্যারিয়ার গঠনে সহায়তা করা</li>
            </ul>
          </div>
        </GlassmorphicCard>
      </motion.div>
      <Footer />
    </div>
  );
}
