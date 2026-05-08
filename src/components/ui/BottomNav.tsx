import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, MessageSquare, Bell, LayoutGrid } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';

export default function BottomNav() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    let channel: any;

    const checkUnread = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fetchMessageCount = async () => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', session.user.id)
          .eq('read', false);
        setUnreadCount(count || 0);
      };

      const fetchNotificationCount = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('read', false);
        setUnreadNotificationCount(count || 0);
      };

      await fetchMessageCount();
      await fetchNotificationCount();

      const channelId = `bottom_nav_${session.user.id}_${Math.random().toString(36).substring(7)}`;
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${session.user.id}` 
        }, () => {
            fetchMessageCount();
        })
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}` 
        }, () => {
            fetchNotificationCount();
        })
        .subscribe();
    };
    
    checkUnread();
    
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Dashboard', icon: BookOpen, path: '/dashboard' },
    { name: 'Inbox', icon: MessageSquare, path: '/messages', badge: unreadCount },
    { name: 'Notification', icon: Bell, path: '/notifications', badge: unreadNotificationCount },
    { name: 'More', icon: LayoutGrid, path: '/more' },
  ];

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
