import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ExternalLink, 
  Calendar, 
  Search, 
  ChevronRight, 
  RefreshCw,
  Info,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Capacitor } from '@capacitor/core';

interface Notice {
  id: string;
  title: string;
  date: string;
  link: string;
  isNew: boolean;
}

const GlassmorphicCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "glass border border-[var(--glass-border)] rounded-3xl overflow-hidden shadow-xl",
    className
  )}>
    {children}
  </div>
);

export default function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('readNoticeIds');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use relative path for web/dev environments
      const isWeb = Capacitor.getPlatform() === 'web' || 
                   (typeof window !== 'undefined' && 
                    (window.location.hostname === 'localhost' || 
                     window.location.hostname.includes('run.app') || 
                     window.location.hostname.includes('ais-dev-')));
      
      const baseUrl = isWeb ? '' : 'https://polyguide.vercel.app';
      
      console.log('Fetching notices from:', `${baseUrl}/api/bteb-notices`);
        
      const response = await fetch(`${baseUrl}/api/bteb-notices`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setNotices(data);
      setLastUpdated(new Date());

      // Update badge count manually based on new items not in readNoticeIds
      updateBadgeCount(data, readNoticeIds);
    } catch (err: any) {
      console.error('Notice Fetch Error:', err);
      setError(err.message || 'নোটিশ লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const updateBadgeCount = (allNotices: Notice[], readIds: string[]) => {
    const unread = allNotices.filter(n => n.isNew && !readIds.includes(n.id)).length;
    window.dispatchEvent(new CustomEvent('notice-count-changed', { detail: { count: unread } }));
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const markAllAsRead = () => {
    const allIds = notices.map(n => n.id);
    setReadNoticeIds(allIds);
    localStorage.setItem('readNoticeIds', JSON.stringify(allIds));
    updateBadgeCount(notices, allIds);
  };

  const markAsRead = (id: string) => {
    if (readNoticeIds.includes(id)) return;
    const newReadIds = [...readNoticeIds, id];
    setReadNoticeIds(newReadIds);
    localStorage.setItem('readNoticeIds', JSON.stringify(newReadIds));
    updateBadgeCount(notices, newReadIds);
  };

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700 px-6 lg:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#32CD32]/20 rounded-2xl flex items-center justify-center hidden sm:flex">
              <Bell className="text-[#32CD32]" size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[var(--text)]">Notice Board</h1>
              <p className="text-[10px] sm:text-sm text-gray-500 font-medium">BTEB Official Notice Updates</p>
            </div>
          </div>
          {notices.some(n => n.isNew && !readNoticeIds.includes(n.id)) && (
            <button 
              onClick={markAllAsRead}
              className="mt-2 sm:mt-0 text-[#32CD32] hover:text-[#28a428] text-sm font-bold tracking-tight px-2 py-1 transition-colors relative z-10"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#32CD32] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-[#32CD32]/30 transition-all font-medium"
            />
          </div>
          <button 
            onClick={fetchNotices}
            disabled={loading}
            className="p-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={20} className={cn("text-[var(--text)]", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        
        {/* Full Width Notice List */}
        <div className="w-full space-y-4">
          <GlassmorphicCard className="p-1 sm:p-4">
            <div className="flex items-center justify-between px-4 py-4 border-b border-black/5 dark:border-white/5 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Live Feed</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="space-y-4 py-12">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="px-4 flex flex-col gap-2">
                        <div className="h-5 bg-black/10 dark:bg-white/10 rounded-full w-3/4 animate-pulse" />
                        <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full w-1/4 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="py-20 text-center space-y-6 px-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full text-red-500 mb-2">
                      <Info size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-[var(--text)]">নোটিশ লোড করা সম্ভব হয়নি</h3>
                      <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                        {error}. ইন্টারনেট কানেকশন চেক করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।
                      </p>
                    </div>
                    <button 
                      onClick={fetchNotices}
                      className="px-8 py-3 bg-[var(--primary)] text-white font-bold rounded-2xl shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all text-sm"
                    >
                      আবার চেষ্টা করুন
                    </button>
                    <div className="pt-4">
                      <a 
                        href="https://bteb.gov.bd/site/view/notices" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-[#32CD32] font-bold underline"
                      >
                        সরাসরি BTEB ওয়েবসাইট দেখুন
                      </a>
                    </div>
                  </div>
                ) : filteredNotices.length > 0 ? (
                  filteredNotices.map((notice, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={notice.id}
                      className={cn(
                        "group border-b border-black/5 dark:border-white/5 last:border-0",
                        readNoticeIds.includes(notice.id) && "opacity-60"
                      )}
                    >
                      <a 
                        href={notice.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => markAsRead(notice.id)}
                        className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#32CD32]/5 transition-all w-full text-left relative overflow-hidden"
                      >
                        <div className="shrink-0 mt-1">
                          {notice.isNew && !readNoticeIds.includes(notice.id) ? (
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                              <TrendingUp size={18} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#32CD32] group-hover:bg-[#32CD32]/10 transition-colors">
                              <Calendar size={18} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-1.5 ml-[-8px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-tighter">
                              {notice.date}
                            </span>
                            {notice.isNew && !readNoticeIds.includes(notice.id) && (
                              <span className="bg-red-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded shadow-[0_2px_10px_rgba(239,68,68,0.3)] animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                          <h3 className={cn(
                            "text-sm md:text-lg font-semibold text-[var(--text)] group-hover:text-[#32CD32] transition-colors leading-snug md:leading-normal",
                            readNoticeIds.includes(notice.id) && "font-medium"
                          )}>
                            {notice.title}
                          </h3>
                        </div>

                        <div className="shrink-0 flex items-center self-center text-gray-300 group-hover:text-[#32CD32] transition-all transform group-hover:translate-x-1">
                          <ChevronRight size={20} />
                        </div>
                      </a>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full text-gray-400">
                      <Search size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">নির্ধারিত নোটিশ খুঁজে পাওয়া যায়নি</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
}
