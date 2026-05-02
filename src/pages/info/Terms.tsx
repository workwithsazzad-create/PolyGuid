import React from 'react';
import { motion } from 'motion/react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import Footer from '@/src/components/Footer';

export default function Terms() {
  return (
    <div className="flex flex-col gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full px-4"
      >
        <h1 className="text-3xl font-bold text-[var(--text)] mb-8 text-center italic">ব্যবহারকারীর শর্তাবলি</h1>
        
        <GlassmorphicCard className="p-8 sm:p-12 space-y-8">
          <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-justify font-medium">
            <p>
              <span className="font-bold text-[var(--text)]">Acceptance of Terms:</span> By using PolyGuid products and services, you agree to be governed by the terms and conditions set forth below. If you do not agree with any of these terms, please hold back from using our platform.
            </p>

            <p>
              As a PolyGuid user, you are responsible for keeping your account credentials secure and ensuring their proper use. While using our platform, you must also follow all applicable rules and regulations.
            </p>

            <p>
              <span className="font-bold text-[var(--text)]">User Responsibilities:</span> As a PolyGuid user, you are responsible for keeping your account credentials secure and ensuring their proper use. While using our platform, you must also follow all applicable rules and regulations.
            </p>

            <p>
              <span className="font-bold text-[var(--text)]">Intellectual Property:</span> PolyGuid is the only owner of all intellectual property rights pertaining to its goods and services, including but not limited to trademarks, copyrights, and confidential information. Users must obtain PolyGuid prior written permission before copying, editing, or distributing any content.
            </p>

            <p>
              <span className="font-bold text-[var(--text)]">Prohibited Conduct:</span> Users are not permitted to engage in any behavior that violates applicable laws or infringes on the rights of others. Harassment, spamming, unauthorized account access, and any other action that disrupts or interferes with the proper operation of PolyGuid's platform are all prohibited.
            </p>

            <p>
              <span className="font-bold text-[var(--text)]">User Content:</span> Users can add content to the PolyGuid platform, such as comments or posts. Users are granting PolyGuid a non-exclusive, royalty-free, perpetual, and worldwide right to use, reproduce, alter, adapt, and distribute the content for promotional and educational purposes by doing so.
            </p>

            <p>
              <span className="font-bold text-[var(--text)]">Disclaimers:</span> PolyGuid aims to provide accurate and up-to-date information, however we cannot guarantee the content on our site is comprehensive or correct. Users understand that they are using our products and services at their own risk.
            </p>

            <p>
              PolyGuid will not be liable for any direct, indirect, incidental, consequential, or punitive damages resulting from the use or inability to utilize our products or services, even if we have been told of the possibility of such damages.
            </p>
          </div>
        </GlassmorphicCard>
      </motion.div>
      <Footer />
    </div>
  );
}
