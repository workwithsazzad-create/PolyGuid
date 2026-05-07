import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bell, 
  BookOpen,
  FileText, 
  User, 
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Home,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import Logo from './Logo';
import { useTheme } from '../ThemeProvider';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isAdmin?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isAdmin = false, isOpen = false, onClose }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNoticeCount, setNewNoticeCount] = useState(0);
  
  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Student Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Message', icon: MessageSquare, path: '/messages' },
    { name: 'Notice Board', icon: BookOpen, path: '/notices' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  // Fetch notices to show badge
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch('/api/bteb-notices');
        if (response.ok) {
          const data = await response.json();
          const newOnes = data.filter((n: any) => n.isNew).length;
          setNewNoticeCount(newOnes);
        }
      } catch (e) {
        // Ignore failed to fetch
      }
    };
    fetchNotices();
    // Poll every 5 minutes
    const interval = setInterval(fetchNotices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let channel: any;

    const checkUnread = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const fetchCount = async () => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', session.user.id)
            .eq('read', false);
            
          setUnreadCount(count || 0);
      };

      await fetchCount();

      channel = supabase
        .channel(`sidebar_messages_${session.user.id}_${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${session.user.id}` 
        }, payload => {
            fetchCount();
        })
        .subscribe();
    };
    
    checkUnread();
    
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen w-60 sm:w-64 glass border-r border-[var(--glass-border)] flex flex-col p-4 sm:p-6 z-50 transition-transform duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="flex items-center justify-between mb-6 sm:mb-8 px-3 sm:px-4 min-h-[100px]">
        <NavLink to="/home" className="flex items-center gap-2 group">
          <Logo 
            theme={theme} 
            showText={true} 
            className="scale-100 origin-left"
            imgClassName="ml-[-18px] mr-[3px] mt-[-13px] pl-0"
            textClassName="mt-[-10px] pl-[4px] sm:pl-[6px]"
          />
        </NavLink>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 sm:gap-2 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-[var(--primary)] text-white font-semibold shadow-[0_0_20px_rgba(50,205,50,0.3)]" 
                : "text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <item.icon size={18} className={cn(
                "transition-colors sm:w-5 sm:h-5",
                "group-hover:text-[var(--primary)] text-gray-500 dark:text-gray-400"
              )} />
              <span className="text-sm sm:text-base">{item.name}</span>
            </div>
            {item.name === 'Message' && unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {item.name === 'Notice Board' && newNoticeCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-bounce">
                {newNoticeCount}
              </span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => cn(
              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 mt-3 sm:mt-4 border border-[var(--primary)]/30",
              isActive 
                ? "bg-[var(--primary)] text-white font-semibold" 
                : "text-[var(--primary)] hover:bg-[var(--primary)]/10"
            )}
          >
            <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="flex flex-col gap-1 sm:gap-2 mt-auto">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
              <Sun size={18} className={cn("absolute inset-0 text-yellow-400 transition-all duration-500 sm:w-5 sm:h-5", theme === 'dark' ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100")} />
              <Moon size={18} className={cn("absolute inset-0 text-blue-400 transition-all duration-500 sm:w-5 sm:h-5", theme === 'light' ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100")} />
            </div>
            <span className="text-sm sm:text-base">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Logout</span>
        </button>
      </div>
    </div>
  );
}
