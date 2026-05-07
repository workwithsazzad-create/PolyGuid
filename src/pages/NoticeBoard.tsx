import { useState, useEffect } from 'react';
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

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bteb-notices');
      if (!response.ok) throw new Error('Failed to fetch notices');
      const data = await response.json();
      setNotices(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#32CD32]/20 rounded-2xl flex items-center justify-center">
              <Bell className="text-[#32CD32]" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">Notice Board</h1>
              <p className="text-sm text-gray-500 font-medium">BTEB Official Notice Updates</p>
            </div>
          </div>
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
                ) : filteredNotices.length > 0 ? (
                  filteredNotices.map((notice, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={notice.id}
                      className="group border-b border-black/5 dark:border-white/5 last:border-0"
                    >
                      <a 
                        href={notice.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#32CD32]/5 transition-all w-full text-left relative overflow-hidden"
                      >
                        <div className="shrink-0 mt-1">
                          {notice.isNew ? (
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
                            {notice.isNew && (
                              <span className="bg-red-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded shadow-[0_2px_10px_rgba(239,68,68,0.3)] animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm md:text-lg font-semibold text-[var(--text)] group-hover:text-[#32CD32] transition-colors leading-snug md:leading-normal">
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

function Logo({ theme, size, showText, className }: any) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 bg-[#32CD32] rounded-lg flex items-center justify-center text-white font-bold italic">
        P
      </div>
    </div>
  );
}
