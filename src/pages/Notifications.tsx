import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, Trash2, Clock, User, FileText, MessageSquare } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string; // 'admin', 'message', 'notice', etc.
  read: boolean;
  created_at: string;
  data?: any;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const fetchNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={20} className="text-blue-500" />;
      case 'notice': return <FileText size={20} className="text-[#32CD32]" />;
      case 'admin': return <Bell size={20} className="text-purple-500" />;
      default: return <Bell size={20} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#32CD32] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] flex items-center gap-3">
            <Bell className="text-[#32CD32]" />
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">আপনার সকল নোটিফিকেশন এখানে দেখতে পাবেন</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all font-medium text-sm text-[var(--text)]"
          >
            <Check size={16} />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={cn(
                "glass p-4 rounded-2xl flex gap-4 transition-all cursor-pointer border",
                notification.read 
                  ? "border-black/5 dark:border-white/5 opacity-70" : "border-[#32CD32]/20 shadow-[0_4px_20px_rgba(50,205,50,0.05)]"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                notification.read ? "bg-black/5 dark:bg-white/5" : "bg-black/10 dark:bg-white/10"
              )}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={cn("font-semibold text-[var(--text)]", !notification.read && "text-[#32CD32]")}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{notification.body}</p>
              </div>
              {!notification.read && (
                <div className="w-3 h-3 bg-[#32CD32] rounded-full self-center shrink-0 shadow-[0_0_10px_rgba(50,205,50,0.5)]" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
            <Bell size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">কোনো নোটিফিকেশন নেই</h3>
            <p className="text-gray-500 mt-2">নতুন কিছু আসলে এখানে দেখতে পাবেন</p>
          </div>
        )}
      </div>
    </div>
  );
}
