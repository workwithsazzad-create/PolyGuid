import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import Footer from '@/src/components/Footer';
import { supabase } from '@/src/lib/supabase';

export default function Refund() {
  const [content, setContent] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'page_refund').maybeSingle()
      .then(({ data }) => setContent((data?.value || '').replace(/PolyGuid/gi, 'PolyGuide')));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full px-4 pt-10"
      >
        <h1 className="text-3xl font-bold text-[var(--text)] mb-8 text-center">রিফান্ড পলিসি</h1>
        
        <GlassmorphicCard className="p-8 sm:p-12 min-h-[300px]">
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            className="prose dark:prose-invert max-w-none w-full text-gray-700 dark:text-gray-300 leading-relaxed font-medium" 
          />
        </GlassmorphicCard>
      </motion.div>
      <Footer />
    </div>
  );
}
