import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, Facebook, Youtube, Instagram, Globe, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

interface FooterProps {
  showMobile?: boolean;
}

const Footer = ({ showMobile = true }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState({
    contact_email: "workwithsazzad@gmail.com",
    contact_phone: "09677723301",
    contact_address: "৭৮ গ্রিন রোড, ঢাকা ১২১৫",
    social_fb: "#",
    social_ig: "#",
    social_yt: "#",
    social_whatsapp: "8801993879904",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('key, value').in('key', [
        'contact_email', 'contact_phone', 'contact_address', 'social_fb', 'social_ig', 'social_yt', 'social_whatsapp'
      ]);
      if (data) {
        const newSettings = { ...settings };
        data.forEach(item => {
          if (item.value) (newSettings as any)[item.key] = item.value;
        });
        setSettings(newSettings);
      }
    };
    fetchSettings();
  }, []);

  const getWaLink = (num: string) => {
    if (!num || num === "#") return "https://wa.me/8801993879904";
    if (num.startsWith("http")) return num;
    const cleanNum = num.replace(/\D/g, "");
    return `https://wa.me/${cleanNum}`;
  };

  return (
    <footer className={`${showMobile ? 'block' : 'hidden lg:block'} w-full bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/5 pt-12 pb-12 sm:pb-8 px-4 sm:px-6 lg:px-8 relative z-10`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8 lg:gap-12">
        {/* Brand Section */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-bold tracking-tight font-sans">
              <span className="text-[#32CD32]">P</span>
              <span className="text-[var(--text)]">oly</span>
              <span className="text-[#32CD32]">G</span>
              <span className="text-[var(--text)]">uide</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs font-medium">
            বাংলাদেশের প্রথম কমিউনিটি বেসড লার্নিং প্ল্যাটফর্ম। আমাদের লক্ষ্য দক্ষ ইঞ্জিনিয়ার তৈরি করা।
          </p>
          <div className="flex items-center gap-3">
            {[
              { icon: Facebook, link: settings.social_fb, color: 'hover:text-blue-500' },
              { icon: MessageCircle, link: getWaLink(settings.social_whatsapp), color: 'hover:text-emerald-500' },
              { icon: Instagram, link: settings.social_ig, color: 'hover:text-pink-500' },
              { icon: Youtube, link: settings.social_yt, color: 'hover:text-red-500' },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                className={`w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 ${social.color} transition-colors border border-black/5 dark:border-white/10`}
              >
                <social.icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Info Links */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text)] opacity-80">তথ্যসমূহ</h3>
          <ul className="flex flex-col gap-3">
            {[
              { name: 'আমাদের সম্পর্কে', path: '/about' },
              { name: 'প্রাইভেসি পলিসি', path: '/privacy' },
              { name: 'ব্যবহারকারীর শর্তাবলি', path: '/terms' },
              { name: 'রিফান্ড পলিসি', path: '/refund' }
            ].map((item, i) => (
              <li key={i}>
                <Link to={item.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors font-medium">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Courses Links */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text)] opacity-80">কোর্স</h3>
          <ul className="flex flex-col gap-3">
            {['ডিপ্লোমা ইন ইঞ্জিনিয়ারিং', 'ডিপ্লোমা ইন টেক্সটাইল', 'ফ্রি কোর্স'].map((item, i) => (
              <li key={i}>
                <Link to="/courses" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors font-medium">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Section */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text)] opacity-80">ঠিকানা</h3>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                <Mail size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Email Us</span>
                <a href={`mailto:${settings.contact_email}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors font-semibold">
                  {settings.contact_email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Head Office</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold leading-tight">
                  {settings.contact_address}
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                <Phone size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Call Now</span>
                <a href={`tel:${settings.contact_phone}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors font-semibold">
                  {settings.contact_phone}
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] sm:text-xs text-gray-400 font-medium text-center sm:text-left">
            স্বত্ব © {currentYear} পলিগাইড লিমিটেড কর্তৃক সর্বস্বত্ব সংরক্ষিত
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Globe size={14} />
              <span className="text-[10px] sm:text-xs font-medium">Dhaka, BD</span>
            </div>
          </div>
        </div>
    </footer>
  );
};

export default Footer;
