import React from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import Footer from '@/src/components/Footer';
import { Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full px-4"
      >
        <div className="bg-black text-white py-12 px-8 rounded-t-[40px] relative overflow-hidden flex flex-col items-center">
           <h1 className="text-3xl font-bold z-10">প্রাইভেসি পলিসি</h1>
           <div className="absolute bottom-0 w-[120%] h-20 bg-[var(--bg)] rounded-[100%] translate-y-1/2" />
        </div>

        <GlassmorphicCard className="p-8 sm:p-12 space-y-10 rounded-t-none">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <h2 className="text-4xl font-bold text-[var(--text)]">Privacy Policy</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Welcome to PolyGuid. We value your privacy and we are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website our services, or interact with us.
              </p>
            </div>
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0">
               <div className="absolute inset-0 bg-[var(--primary)]/10 rounded-full animate-pulse" />
               <Shield size={120} className="text-[var(--primary)] drop-shadow-2xl" />
            </div>
          </div>

          <div className="grid gap-10">
            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">1. Information Collection And Use</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We collect various sorts of information for various purposes in order to offer and improve our Service to you. Your email address, name, phone number, address, and other personal information may be gathered.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">2. Use of Data</h3>
              <p className="text-gray-600 dark:text-gray-400">
                PolyGuid collects data for a variety of purposes, including delivering the Service, identifying and connecting with you, responding to your requests/inquiries, and improving our services.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">3. Data Retention</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We will only keep your Personal Data for as long as it is required for the reasons outlined in this Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">4. Data Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We care about the security of your data, but keep in mind that no form of internet transmission or electronic storage is completely safe. We make every effort to protect your Personal Data using commercially acceptable measures.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">5. Your Rights</h3>
              <p className="text-gray-600 dark:text-gray-400">
                At any moment, you have the right to access or update your personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">6. Service Providers</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We may use third-party firms and individuals to help us arrange our Service, deliver the Service on our behalf, or analyze how our Service is utilized.
              </p>
            </section>

            <section className="space-y-3 pt-6 border-t border-black/5 dark:border-white/5">
              <h3 className="text-xl font-bold text-red-500">7. Changes to This Privacy Policy</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We reserve the right to change our Privacy Policy at any moment. Any changes will be communicated to you by posting the revised Privacy Policy on this page.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-xl font-bold text-red-500">8. Contact Us</h3>
              <p className="text-gray-600 dark:text-gray-400">
                If you have any queries regarding this Privacy Statement, please write us at
              </p>
              <a href="mailto:support@polyguid.com.bd" className="text-[var(--primary)] font-bold hover:underline">
                support@polyguid.com.bd
              </a>
            </section>
          </div>
        </GlassmorphicCard>
      </motion.div>
      <Footer />
    </div>
  );
}
