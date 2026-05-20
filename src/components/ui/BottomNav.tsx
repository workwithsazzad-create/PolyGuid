import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Home, BookOpen, MessageSquare, Bell, LayoutGrid } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { Badge } from '@capawesome/capacitor-badge';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function BottomNav() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Hide bottom nav if we are in a message conversation on mobile
  const isMessageConversation = location.pathname === '/messages' && (searchParams.has('userId') || searchParams.has('communityId'));

  useEffect(() => {
    let unreadChannel: any;
    let isMounted = true;

    const fetchMessageCount = async (userId: string) => {
      if (!isMounted) return;
      try {
        let totalUnread = 0;

        // 1. Personal messages
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('read', false);
        if (error) throw error;
        totalUnread += (count || 0);

        // 2. Group messages
        try {
          const { data: enrolled } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', userId);
            
          if (enrolled && enrolled.length > 0) {
            const courseIds = enrolled.map(e => e.course_id);
            
            let readsMap = new Map();
            try {
              const { data: readsData } = await supabase
                .from('community_reads')
                .select('course_id, last_read_at')
                .eq('user_id', userId);
                
              readsData?.forEach(r => {
                 readsMap.set(r.course_id, new Date(r.last_read_at).getTime());
              });
            } catch (readsErr) {
              // Table might not exist, fallback to localStorage only
            }

            const { data: commMsgs } = await supabase
              .from('community_messages')
              .select('course_id, created_at, sender_id')
              .in('course_id', courseIds)
              .neq('sender_id', userId);

            commMsgs?.forEach(msg => {
              const msgTime = new Date(msg.created_at).getTime();
              let lastRead = readsMap.get(msg.course_id);
              if (!lastRead) {
                const localViewed = localStorage.getItem(`last_viewed_group_${msg.course_id}`);
                lastRead = localViewed ? new Date(localViewed).getTime() : 0;
              }
              if (msgTime > lastRead) {
                totalUnread++;
              }
            });
          }
        } catch (groupErr) {
          console.error("Error calculating group unread:", groupErr);
        }

        if (isMounted) setUnreadCount(totalUnread);
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
      
      fetchMessageCount(userId);
      fetchNotificationCount(userId);

      // Listen for manual triggers
      const handleBadgeRefresh = (e: any) => {
        if (e.detail?.count !== undefined) {
          setUnreadNotificationCount(e.detail.count);
        } else {
          fetchMessageCount(userId);
          fetchNotificationCount(userId);
        }
      };
      window.addEventListener('unread-count-changed', handleBadgeRefresh);
      window.addEventListener('notifications-changed', handleBadgeRefresh);

      const channelId = `bottom_nav_unread_badges_${userId}_${Math.random().toString(36).substring(7)}`;
      unreadChannel = supabase
        .channel(channelId)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}` 
        }, () => {
            fetchMessageCount(userId);
        })
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}` 
        }, () => {
            fetchMessageCount(userId);
        })
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'community_messages'
        }, () => {
            fetchMessageCount(userId);
        })
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${userId}` 
        }, () => {
            fetchNotificationCount(userId);
        })
        .subscribe();
        
      // Fallback polling
      const interval = setInterval(() => {
        if (isMounted) {
          fetchMessageCount(userId);
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
    
    return () => {
      isMounted = false;
      if (unreadChannel) supabase.removeChannel(unreadChannel);
    };
  }, []);

  // Update App Icon Badge
  useEffect(() => {
    const updateAppBadge = async () => {
      try {
        const total = unreadCount + unreadNotificationCount;
        await Badge.set({ count: total });
      } catch (e) {}
    };
    updateAppBadge();
  }, [unreadCount, unreadNotificationCount]);

  // Request permissions fallback
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {}
    };
    requestPermissions();
  }, []);

  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
    { name: 'Inbox', icon: MessageSquare, path: '/messages', badge: unreadCount },
    { name: 'Notification', icon: Bell, path: '/notifications', badge: unreadNotificationCount },
    { name: 'More', icon: LayoutGrid, path: '/more' },
  ];

  if (isMessageConversation) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 flex items-center justify-around px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200",
            isActive 
              ? "text-[var(--primary)]" 
              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
          )}
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-300",
                isActive ? "bg-[var(--primary)]/10 -translate-y-1" : ""
              )}>
                <item.icon size={22} className={cn(isActive ? "stroke-[2.5px]" : "stroke-2")} />
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs font-medium transition-all duration-300 absolute bottom-1.5",
                isActive ? "opacity-100 translate-y-0" : "opacity-70 translate-y-1"
              )}>
                {item.name}
              </span>
              
              {/* Badge */}
              {item.badge ? (
                <span className="absolute top-1 right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm animate-pulse">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
