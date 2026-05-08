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
  History,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import Logo from './Logo';
import { useTheme } from '../ThemeProvider';
import { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';

interface SidebarProps {
  isAdmin?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isAdmin = false, isOpen = false, onClose }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNoticeCount, setNewNoticeCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Student Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Message', icon: MessageSquare, path: '/messages' },
    { name: 'Notice Board', icon: BookOpen, path: '/notices' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Order History', icon: History, path: '/orders' },
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
    let unreadChannel: any;
    let isMounted = true;

    const fetchCount = async (userId: string) => {
      if (!isMounted) return;
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('read', false);
          
        if (error) throw error;
        if (isMounted) setUnreadCount(count || 0);
      } catch (e) {
        console.error("Error fetching message count:", e);
      }
    };

    const fetchNotificationCount = async (userId: string) => {
      if (!isMounted) return;
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false);
          
        if (error) throw error;
        if (isMounted) setUnreadNotificationCount(count || 0);
      } catch (e) {
        console.error("Error fetching notification count:", e);
      }
    };

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMounted) return;
      
      const userId = session.user.id;
      
      // Initial fetch
      fetchCount(userId);
      fetchNotificationCount(userId);

      // Listen for manual triggers from other components
      const handleBadgeRefresh = () => {
        if (isMounted) {
          fetchCount(userId);
          fetchNotificationCount(userId);
        }
      };
      window.addEventListener('unread-count-changed', handleBadgeRefresh);
      window.addEventListener('notifications-changed', handleBadgeRefresh);

      // Subscribe to changes
      unreadChannel = supabase
        .channel(`sidebar_unread_badges_${userId}_${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}` 
        }, async (payload) => {
            fetchCount(userId);
            // Local notification for new message
            try {
              const newMessage = payload.new as any;
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'New Message',
                    body: newMessage.message || newMessage.content || 'You have a new message',
                    id: Math.floor(Math.random() * 100000),
                    smallIcon: 'ic_stat_name', // Common icon name for Android
                    schedule: { at: new Date(Date.now() + 100) },
                  }
                ]
              });
            } catch (err) {}
        })
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}` 
        }, () => {
            fetchCount(userId);
        })
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${userId}` 
        }, async (payload) => {
            fetchNotificationCount(userId);
            if (payload.eventType === 'INSERT') {
              try {
                const newNotification = payload.new as any;
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: newNotification.title || 'New Notification',
                      body: newNotification.message || '',
                      id: Math.floor(Math.random() * 100000),
                      smallIcon: 'ic_stat_name',
                      schedule: { at: new Date(Date.now() + 100) },
                    }
                  ]
                });
              } catch (err) {
                // ignore errors
              }
            }
        })
        .subscribe();
        
      // Fallback polling every 10 seconds for badges
      const interval = setInterval(() => {
        if (isMounted) {
          fetchCount(userId);
          fetchNotificationCount(userId);
        }
      }, 10000);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('unread-count-changed', handleBadgeRefresh);
        window.removeEventListener('notifications-changed', handleBadgeRefresh);
      };
    };

    setupRealtime();
    
    // Request permissions on init with extra check
    const requestPermissions = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {}
    };
    requestPermissions();

    return () => {
      isMounted = false;
      if (unreadChannel) supabase.removeChannel(unreadChannel);
    };
  }, []);

  // Separate useEffect for Badge update
  useEffect(() => {
    const updateAppBadge = async () => {
      try {
        const total = unreadCount + unreadNotificationCount;
        await Badge.set({ count: total });
      } catch (e) {}
    };
    updateAppBadge();
  }, [unreadCount, unreadNotificationCount]);

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
            {item.name === 'Notifications' && unreadNotificationCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
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
