import React from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import Footer from '@/src/components/Footer';

export default function Refund() {
  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full px-4"
      >
        <h1 className="text-3xl font-bold text-[var(--text)] mb-8 text-center italic">রিফান্ড পলিসি</h1>
        
        <GlassmorphicCard className="p-8 sm:p-12 space-y-8">
          <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-justify font-medium">
             <h2 className="text-2xl font-bold text-[var(--text)]">Refund & Cancellation Policy</h2>
             
             <p>
                At PolyGuid, we strive to provide the best learning experience. Please read our refund policy carefully before making any purchase.
             </p>

             <section className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--primary)]">1. Digital Products</h3>
                <p>
                   Since our courses and digital materials are instantly accessible upon purchase, we generally do not offer refunds once the content has been accessed or downloaded.
                </p>
             </section>

             <section className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--primary)]">2. Exceptional Cases</h3>
                <p>
                   Refunds may be considered in specific cases, such as:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                   <li>Duplicate payments for the same course.</li>
                   <li>Technical issues on our end that prevent access to the content for an extended period.</li>
                </ul>
             </section>

             <section className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--primary)]">3. Refund Request Process</h3>
                <p>
                   To request a refund, please contact our support team within 48 hours of purchase with your transaction details.
                </p>
                <a href="mailto:support@polyguid.com.bd" className="text-[var(--primary)] font-bold hover:underline">
                   support@polyguid.com.bd
                </a>
             </section>

             <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                <p className="text-sm text-gray-500">
                   Note: PolyGuid reserves the right to modify this policy at any time without prior notice.
                </p>
             </section>
          </div>
        </GlassmorphicCard>
      </motion.div>
      <Footer />
    </div>
  );
}
