import React from 'react';
import { Mail, MapPin, Phone, Facebook, Youtube, Instagram, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7hXz1Z0A1iE_7mZ0z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z/s1600/PolyGuid%20Logo.png";

  return (
    <footer className="w-full bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/5 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8 lg:gap-12">
        {/* Brand Section */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="PolyGuid Logo" 
              className="h-10 sm:h-12 w-auto object-contain dark:brightness-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="text-xl font-bold tracking-tight text-[var(--text)]">PolyGuid</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs font-medium">
            বাংলাদেশের প্রথম কমিউনিটি বেসড লার্নিং প্ল্যাটফর্ম। আমাদের লক্ষ্য দক্ষ ইঞ্জিনিয়ার তৈরি করা।
          </p>
          <div className="flex items-center gap-4">
            {[
              { icon: Facebook, link: '#', color: 'hover:text-blue-500' },
              { icon: Instagram, link: '#', color: 'hover:text-pink-500' },
              { icon: Youtube, link: '#', color: 'hover:text-red-500' },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.link}
                whileHover={{ y: -3 }}
                className={`w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-400 ${social.color} transition-colors`}
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
                <a href="mailto:workwithsazzad@gmail.com" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors font-semibold">
                  workwithsazzad@gmail.com
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
                  ৭৮ গ্রিন রোড, ঢাকা ১২১৫
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                <Phone size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Call Now</span>
                <a href="tel:09677723301" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--primary)] transition-colors font-semibold">
                  09677723301
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
