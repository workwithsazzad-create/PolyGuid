import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import Footer from '@/src/components/Footer';
import { supabase } from '@/src/lib/supabase';

export default function About() {
  const [content, setContent] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'page_about').maybeSingle()
      .then(({ data }) => setContent(data?.value || ''));
  }, []);

  return (
    <div className="flex flex-col gap-8 bg-[var(--background)] min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full px-4 pt-6 sm:pt-10 mb-10"
      >
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] mb-6 sm:mb-8 text-center">আমাদের সম্পর্কে</h1>

        <GlassmorphicCard className="p-4 sm:p-12 min-h-[300px] border-black/5 dark:border-white/5">
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            className="prose dark:prose-invert max-w-none w-full text-gray-700 dark:text-gray-300 leading-relaxed font-medium break-words overflow-x-hidden text-sm sm:text-base" 
          />
        </GlassmorphicCard>
      </motion.div>
      <Footer />
    </div>
  );
}
