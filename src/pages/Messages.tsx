import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  User, 
  ChevronLeft, 
  BadgeCheck, 
  MoreVertical, 
  Search, 
  Image as ImageIcon, 
  ArrowLeft,
  Check,
  CheckCheck,
  BellOff,
  Trash2,
  Ban,
  MessageCircle,
  MessageSquare,
  X
} from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { getEmbedUrl, getDirectLink } from '../lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const initialCommunityId = searchParams.get('communityId');
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChatRef = useRef<string | null>(null);
  const selectedUserRef = useRef<any>(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    let globalChannel: any;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchConversations(session.user.id);
        
        globalChannel = supabase
          .channel(`global_messages_${session.user.id}_${Math.random().toString(36).substring(7)}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${session.user.id}`
          }, () => {
             fetchConversations(session.user.id);
             window.dispatchEvent(new CustomEvent('unread-count-changed'));
          })
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `sender_id=eq.${session.user.id}`
          }, () => {
             fetchConversations(session.user.id);
          })
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'community_messages'
          }, () => {
             fetchConversations(session.user.id);
             window.dispatchEvent(new CustomEvent('unread-count-changed'));
          })
          .subscribe();
      }
    };

    init();

    return () => {
      if (globalChannel) supabase.removeChannel(globalChannel);
    };
  }, []);

  const checkUser = async () => {
    // Kept to avoid undefined, but we moved logic to init
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }
  };

  const fetchConversations = async (currentUserId: string) => {
    try {
      let supportAdminId: string | null = null;
      if (searchParams.get('action') === 'support') {
        const { data: adminData } = await supabase.from('profiles').select('id').eq('phone', '01993879904').limit(1).maybeSingle();
        if (adminData) {
          supportAdminId = adminData.id;
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }

      // Fetch communities the user has joined
      let communityData: any[] = [];
      let communityReadsMap = new Map<string, number>();

      try {
        // Fetch real read receipts from db if present
        const { data: readsData } = await supabase
          .from('community_reads')
          .select('course_id, last_read_at')
          .eq('user_id', currentUserId);
        
        readsData?.forEach(r => {
           communityReadsMap.set(r.course_id, new Date(r.last_read_at).getTime());
        });
      } catch(e) {}

      // Fetch from BOTH enrollments AND course_communities to be safe
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select(`
          course_id, 
          courses (id, title, thumbnail_url)
        `)
        .eq('user_id', currentUserId);
      
      const { data: joined } = await supabase
        .from('course_communities')
        .select(`
          course_id, 
          joined_at,
          courses (id, title, thumbnail_url)
        `)
        .eq('user_id', currentUserId);

      const combined = new Map();
      enrolled?.forEach((e: any) => {
        if (e.courses) {
          combined.set(e.course_id, { course_id: e.course_id, courses: e.courses, joined_at: new Date().toISOString() });
        }
      });
      joined?.forEach((j: any) => {
        if (j.courses) {
          combined.set(j.course_id, { course_id: j.course_id, courses: j.courses, joined_at: j.joined_at });
        }
      });
      communityData = Array.from(combined.values());

      const uniqueUsersMap = new Map();
      const otherUserIds = new Set<string>();
      
      // Community processing
      const communityCourseIds = new Set<string>();
      try {
        if (communityData && communityData.length > 0) {
          communityData.forEach((comm: any) => {
             const c = Array.isArray(comm.courses) ? comm.courses[0] : comm.courses;
             if (c) {
               communityCourseIds.add(c.id);
               // Track unread for groups using last viewed timestamp from DB or localStorage
               let lastViewedTimestamp = communityReadsMap.get(c.id);
               if (!lastViewedTimestamp) {
                 const localViewed = localStorage.getItem(`last_viewed_group_${c.id}`);
                 if (localViewed) lastViewedTimestamp = new Date(localViewed).getTime();
               }
               const mapKey = `comm_${c.id}`;
               uniqueUsersMap.set(mapKey, {
                 id: c.id,
                 isCommunity: true,
                 lastMessage: 'Welcome to the community',
                 timestamp: comm.joined_at || new Date().toISOString(),
                 full_name: `${c.title} Community`,
                 avatar_url: c.thumbnail_url ? getDirectLink(c.thumbnail_url) : null,
                 unread: false,
                 lastViewedAt: lastViewedTimestamp || 0
               });
             }
          });
          
          // Fetch latest community messages for timestamps and unread logic
          if (communityCourseIds.size > 0) {
            const { data: latestCommMsgs } = await supabase
              .from('community_messages')
              .select('course_id, text, created_at, sender_id')
              .in('course_id', Array.from(communityCourseIds))
              .order('created_at', { ascending: false });
              
            if (latestCommMsgs) {
              const seenCourses = new Set();
              latestCommMsgs.forEach(msg => {
                if (!seenCourses.has(msg.course_id)) {
                  seenCourses.add(msg.course_id);
                  const u = uniqueUsersMap.get(`comm_${msg.course_id}`);
                  if (u) {
                    u.lastMessage = msg.text;
                    u.timestamp = msg.created_at;
                    // Mark as unread if the latest message is newer than last viewed
                    if (new Date(msg.created_at).getTime() > u.lastViewedAt && msg.sender_id !== currentUserId) {
                      u.unread = true;
                    }
                  }
                }
              });
            }
          }
        }
      } catch(e) {}
      
      // First pass: identify the other users
      data?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        otherUserIds.add(otherUserId);
        
        const mapKey = `user_${otherUserId}`;
        if (!uniqueUsersMap.has(mapKey)) {
          uniqueUsersMap.set(mapKey, {
            id: otherUserId,
            isCommunity: false,
            lastMessage: msg.content,
            timestamp: msg.created_at,
            full_name: 'Student', 
            avatar_url: null,
            unread: msg.receiver_id === currentUserId && !msg.read
          });
        }
      });

      // Include initialUserId if present
      if (initialUserId || supportAdminId) {
        const idToUse = supportAdminId || initialUserId;
        if (idToUse) {
          otherUserIds.add(idToUse);
          const mapKey = `user_${idToUse}`;
          if (!uniqueUsersMap.has(mapKey)) {
            uniqueUsersMap.set(mapKey, {
              id: idToUse,
              isCommunity: false,
              lastMessage: 'Start a conversation...',
              timestamp: new Date().toISOString(),
              full_name: 'Support API',
              avatar_url: null,
              unread: false,
              isSupport: true
            });
          }
        }
      }

      // Fetch profiles for all other users
      if (otherUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role, is_verified')
          .in('id', Array.from(otherUserIds));
          
        if (!profilesError && profilesData) {
          profilesData.forEach(p => {
            const mapKey = `user_${p.id}`;
            if (uniqueUsersMap.has(mapKey)) {
              const u = uniqueUsersMap.get(mapKey);
              u.full_name = p.full_name || 'Student';
              u.avatar_url = p.avatar_url ? getDirectLink(p.avatar_url) : null;
              u.is_verified = p.is_verified || p.role === 'admin';
            }
          });
        }
      }

      // Convert map to array and sort by timestamp
      const convList = Array.from(uniqueUsersMap.entries()).map(([key, value]) => ({
        ...(value as any),
        mapKey: key
      })).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setConversations(convList);
      
      // WhatsApp style: do not auto-select the first conversation. 
      // Only select if there is a specific initialUserId or initialCommunityId in the URL and we haven't selected one yet.
      if (!selectedUser) {
        if (initialCommunityId) {
          const target = convList.find(c => c.id === initialCommunityId && c.isCommunity);
          if (target) setSelectedUser(target);
        } else if (initialUserId || supportAdminId) {
          const selId = supportAdminId || initialUserId;
          const target = convList.find(c => c.id === selId && !c.isCommunity);
          if (target) setSelectedUser(target);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const isSupport = searchParams.get('action') === 'support';
    if (!initialUserId && !initialCommunityId && !isSupport) {
      if (selectedUser) setSelectedUser(null);
    } else {
      if (conversations.length > 0) {
        if (initialCommunityId) {
          const target = conversations.find(c => c.id === initialCommunityId && c.isCommunity);
          if (target && (!selectedUser || selectedUser.id !== target.id || !selectedUser.isCommunity)) {
            setSelectedUser(target);
          }
        } else if (initialUserId || isSupport) {
          // Action=support doesn't have initialUserId initially, but fetchConversations finds the admin ID
          const selId = initialUserId || conversations.find(c => c.isSupport)?.id;
          if (selId) {
            const target = conversations.find(c => c.id === selId && !c.isCommunity);
            if (target && (!selectedUser || selectedUser.id !== target.id || selectedUser.isCommunity)) {
              setSelectedUser(target);
            }
          }
        }
      }
    }
  }, [initialUserId, initialCommunityId, conversations, selectedUser, searchParams]);

  useEffect(() => {
    let channel: any;
    if (selectedUser && user) {
      setLoadingChat(true);
      // Clear messages immediately when switching to avoid seeing previous conversation's messages
      setMessages([]);
      currentChatRef.current = selectedUser.id;
      
      if (selectedUser.isCommunity) {
        setBlockedByMe(false);
        setBlockedByOther(false);
        fetchMessages(selectedUser.id, true);
        markAsRead(selectedUser.id);
        
        channel = supabase
          .channel(`community_messages_${selectedUser.id}_${Math.random().toString(36).substring(7)}`)
          .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'community_messages',
              filter: `course_id=eq.${selectedUser.id}` 
          }, async payload => {
              if (selectedUserRef.current?.id !== payload.new.course_id) return;
              
              const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, role, is_verified').eq('id', payload.new.sender_id).maybeSingle();
              const newMsg: any = {
                  ...payload.new,
                  content: payload.new.text,
                  sender_name: profile?.full_name || 'Member',
                  sender_avatar: profile?.avatar_url ? getDirectLink(profile.avatar_url) : null,
                  sender_role: profile?.role,
                  sender_verified: profile?.is_verified || profile?.role === 'admin'
              };
              setMessages(prev => {
                 // Safely replace the temporary message that matches this content
                 const tempIndex = prev.findIndex(m => m.id.toString().includes('-temp-') && m.content === newMsg.content);
                 if (tempIndex !== -1) {
                   const next = [...prev];
                   next[tempIndex] = newMsg;
                   return next;
                 }
                 if (prev.some((m: any) => m.id === newMsg.id)) return prev;
                 if (currentChatRef.current !== payload.new.course_id) return prev;
                 return [...prev, newMsg];
              });
              scrollToBottom('smooth');
          })
          .subscribe();
      } else {
        fetchMessages(selectedUser.id, false);
        markAsRead(selectedUser.id);
        
        channel = supabase
          .channel(`messages_${user.id}_${selectedUser.id}_${Math.random().toString(36).substring(7)}`)
          .on('postgres_changes', { 
              event: 'DELETE', 
              schema: 'public', 
              table: 'messages'
          }, payload => {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          })
          .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages',
              filter: `receiver_id=eq.${user.id}` 
          }, payload => {
              if (payload.new.sender_id === selectedUserRef.current?.id) {
                  setMessages(prev => {
                     if (prev.some(m => m.id === payload.new.id)) return prev;
                     return [...prev, payload.new];
                  });
                  scrollToBottom('smooth');
                  markAsRead(selectedUser.id);
              }
          })
          .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages',
              filter: `sender_id=eq.${user.id}` 
          }, payload => {
              if (payload.new.receiver_id === selectedUserRef.current?.id) {
                  setMessages(prev => {
                     // Safely replace the temporary message that matches this content
                     const tempIndex = prev.findIndex(m => m.id.toString().includes('-temp-') && m.content === payload.new.content);
                     if (tempIndex !== -1) {
                       const next = [...prev];
                       next[tempIndex] = payload.new;
                       return next;
                     }
                     if (prev.some(m => m.id === payload.new.id)) return prev;
                     return [...prev, payload.new];
                  });
                  scrollToBottom('smooth');
              }
          })
          .subscribe();
      }
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedUser, user]);

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    
    if (selectedUser?.isCommunity) {
      localStorage.setItem(`last_viewed_group_${senderId}`, new Date().toISOString());
      try {
        await supabase
          .from('community_reads')
          .upsert({ user_id: user.id, course_id: senderId, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,course_id' });
      } catch (e) {
        console.error('Save to community_reads failed:', e);
      }
    }

    // Optimistically update the UI to remove the unread indicator instantly
    setConversations(prev => prev.map(conv => 
      conv.id === senderId ? { ...conv, unread: false } : conv
    ));
    
    // Notify navigation components to refresh badges
    window.dispatchEvent(new CustomEvent('unread-count-changed'));

    if (selectedUser?.isCommunity) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId)
        .eq('read', false);
        
      if (!error) {
        // Dispatch again after successful DB update to be sure
        window.dispatchEvent(new CustomEvent('unread-count-changed'));
      }
    } catch {
      // safe ignore
    }
  };

  const [selectedProfileInfo, setSelectedProfileInfo] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchMessages = async (otherUserId: string, isCommunity: boolean = false) => {
    if (!user) return;
    
    setLoadingChat(true);

    if (isCommunity) {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          id,
          course_id,
          sender_id,
          content:text,
          created_at
        `)
        .eq('course_id', otherUserId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching community messages:', error);
      } else {
        // Fetch profiles
        let mappedData = (data as any[]) || [];
        if (mappedData.length > 0) {
          const senderIds = Array.from(new Set(mappedData.map(d => d.sender_id)));
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role, is_verified, phone, polytechnic_name')
            .in('id', senderIds);
            
          if (profiles) {
            const profileMap = new Map(profiles.map(p => [p.id, p]));
            mappedData = mappedData.map(d => {
              const p = profileMap.get(d.sender_id);
              return {
                ...d,
                sender_name: p?.full_name || 'Member',
                sender_avatar: p?.avatar_url ? getDirectLink(p.avatar_url) : null,
                sender_role: p?.role,
                sender_verified: p?.is_verified || p?.role === 'admin',
                sender_phone: p?.phone,
                sender_polytechnic: p?.polytechnic_name
              };
            });
          }
        }
        if (currentChatRef.current === otherUserId) {
          setMessages(mappedData);
          scrollToBottom('auto');
        }
      }
    } else {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        if (currentChatRef.current === otherUserId) {
          setMessages(data || []);
          scrollToBottom('auto');
        }
        
        // Cleanup notifications whenever we enter a chat
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           await supabase.from('notifications').delete().eq('user_id', session.user.id).eq('type', 'message');
        }
      }
    }
    setLoadingChat(false);
  };

  useEffect(() => {
    const cleanupNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Delete all message notifications for this user
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', session.user.id)
        .eq('type', 'message');
    };
    
    cleanupNotifications();
  }, []);

  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        // Secondary fallback to scroll parent container effectively
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior
          });
        }
      }
    }, 100);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);
  
  // Need to check for blocks when component mounts or user switches
  useEffect(() => {
    let blockChannel: any;
    if (selectedUser && user) {
        checkBlockStatus(selectedUser.id);

        // Real-time subscription to block status changes
        const blockChannelId = `blocks_status_${user.id}_${selectedUser.id}_${Math.random().toString(36).substring(7)}`;
        blockChannel = supabase
          .channel(blockChannelId)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'blocks'
          }, (payload: any) => {
            // Unblock (DELETE) doesn't reliably include blocked_id without replica identity full,
            // so we just re-verify block status dynamically on *any* block change.
            checkBlockStatus(selectedUser.id);
          })
          .subscribe();
    }
    return () => {
      if (blockChannel) supabase.removeChannel(blockChannel);
    };
  }, [selectedUser, user]);

  const checkBlockStatus = async (otherUserId: string) => {
    const { data: blocksByMe } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherUserId);
      
    const { data: blocksByOther } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', otherUserId)
      .eq('blocked_id', user.id);
      
    setBlockedByMe(!!blocksByMe && blocksByMe.length > 0);
    setBlockedByOther(!!blocksByOther && blocksByOther.length > 0);
  };
  
  const toggleBlock = async (otherUserId: string) => {
     if (!blockedByMe) {
        const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherUserId });
        if (error) {
          console.error("Failed to block user:", error);
          alert("Failed to block. Admin permissions or RLS policy issue.");
        }
     } else {
        const { error } = await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', otherUserId);
        if (error) {
          console.error("Failed to unblock user:", error);
          alert("Failed to unblock. Admin permissions or RLS policy issue.");
        }
     }
     checkBlockStatus(otherUserId);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      // Real-time listener will handle UI update
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const selectUser = (conv: any) => {
    setMessages([]);
    setLoadingChat(true);
    setSelectedUser(conv);
    if (conv) {
      if (conv.isCommunity) {
        setSearchParams({ communityId: conv.id });
      } else {
        setSearchParams({ userId: conv.id });
      }
    } else {
      setSearchParams({});
    }
  };

  const deleteConversation = async (otherUserId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);

      if (error) throw error;
      fetchConversations(user.id);
      if (selectedUser?.id === otherUserId) {
        selectUser(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete conversation');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    const msgContent = newMessage.trim();
    setNewMessage(''); 
    
    // Notify navigation components to refresh badges
    window.dispatchEvent(new CustomEvent('unread-count-changed'));

    // Optimistic update
    const tempId = `msg-temp-${Date.now()}`;
    const optimisticMsg = {
        id: tempId,
        sender_id: user.id,
        receiver_id: selectedUser.id,
        course_id: selectedUser.isCommunity ? selectedUser.id : undefined,
        content: msgContent,
        created_at: new Date().toISOString(),
        read: false
    };
    
    // @ts-ignore
    setMessages(prev => {
        // Prevent double optimistic update if something already triggered it
        if (prev.some(m => m.content === msgContent && m.id.toString().includes('-temp-'))) return prev;
        return [...prev, optimisticMsg];
    });
    scrollToBottom('smooth');

    if (selectedUser.isCommunity) {
      const { error } = await supabase
        .from('community_messages')
        .insert([{
          sender_id: user.id,
          course_id: selectedUser.id,
          text: msgContent
        }]);

      if (error) {
        console.error('Error sending community message:', error);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert("Failed to send message: " + error.message);
      } else {
        // Community messages don't affect direct message sidebar order immediately via fetchConversations
        // but we might want to refresh timestamps
        setConversations(prev => prev.map(c => 
          c.id === selectedUser.id 
            ? { ...c, lastMessage: msgContent, timestamp: new Date().toISOString() } 
            : c
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } else {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: msgContent
        }]);

      if (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert("Failed to send message: " + error.message);
      } else {
        fetchConversations(user.id);
      }
    }
  };

  const personalConversations = conversations.filter(c => !c.isCommunity);
  const groupConversations = conversations.filter(c => c.isCommunity);

  if (loading) {
    return <div className="p-8 text-center text-[var(--primary)] animate-pulse font-bold">Loading Messages...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col md:h-[calc(100vh-140px)] md:max-w-6xl md:mx-auto overflow-hidden bg-white dark:bg-[#1a1a1a] md:bg-transparent md:mt-2 ${selectedUser ? 'h-[calc(100dvh-56px)]' : 'h-[calc(100dvh-120px)]'}`}
    >
      <div className="flex bg-white dark:bg-[#1a1a1a] md:rounded-2xl md:shadow-2xl md:border border-black/10 dark:border-white/10 flex-1 relative overflow-hidden h-full">
        
        {/* Sidebar Contacts List */}
        <div className={`w-full md:w-80 border-r border-black/10 dark:border-white/10 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/20 shrink-0">
            <h2 className="text-xl font-bold text-[var(--text)]">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No conversations yet.</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.mapKey}
                  className={`flex flex-col border-b border-black/5 dark:border-white/5 ${selectedUser?.id === conv.id && selectedUser.isCommunity === conv.isCommunity ? 'bg-[var(--primary)]/10 border-l-4 border-l-[var(--primary)]' : 'hover:bg-black/5 dark:hover:bg-white/5 border-l-4 border-l-transparent'}`}
                >
                  <div 
                    onClick={() => selectUser(conv)}
                    className="flex items-center gap-3 p-4 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {conv.avatar_url ? (
                        <img src={conv.avatar_url} alt={conv.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={24} /></div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center gap-1">
                        <div className="flex items-center gap-1 truncate">
                          <h4 className={`text-sm truncate flex items-center gap-1 ${conv.unread ? 'font-bold text-[var(--text)]' : 'font-semibold text-gray-600 dark:text-gray-300'}`}>
                              <span className="truncate">{conv.full_name}</span>
                              {(conv.is_verified || conv.role === 'admin') && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-4 h-4 shrink-0" size={16} />}
                          </h4>
                          {conv.isCommunity && <span className={`text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${conv.unread ? 'bg-[var(--primary)] animate-pulse' : 'bg-gray-400'}`}>Group</span>}
                        </div>
                        {conv.unread && <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full shrink-0"></div>}
                      </div>
                      <p className={`text-xs truncate ${conv.unread ? 'font-bold text-[var(--primary)]' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-[#141414] ${!selectedUser ? 'hidden md:flex' : 'flex'} relative h-full overflow-hidden`}>
          {selectedUser ? (
            <div 
              key={`${selectedUser.id}-${selectedUser.isCommunity}`}
              className="flex flex-col h-full overflow-hidden relative"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] flex items-center justify-between gap-3 shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-black/5 dark:border-white/5">
                    {selectedUser.avatar_url ? (
                      <img src={getDirectLink(selectedUser.avatar_url)} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                    )}
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-1 truncate">
                      <h3 className="font-bold text-[var(--text)] truncate">{selectedUser.full_name}</h3>
                      {(selectedUser.is_verified || selectedUser.role === 'admin') && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-4 h-4 shrink-0" size={16} />}
                      {selectedUser.isCommunity && <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ml-1">Community</span>}
                    </div>
                    {selectedUser.isCommunity && (
                       <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Group Conversation</span>
                    )}
                  </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-[60]"
                    >
                      {selectedUser.isCommunity ? (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to exit this group?')) {
                              const { error } = await supabase.from('course_communities').delete().eq('course_id', selectedUser.id).eq('user_id', user.id);
                              if (!error) {
                                setSelectedUser(null);
                                setSearchParams({});
                                fetchConversations(user.id);
                              }
                            }
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                          <X size={16} /> Exit Group
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to ${blockedByMe ? 'unblock' : 'block'} this user?`)) {
                                toggleBlock(selectedUser.id);
                                setShowDropdown(false);
                              }
                            }}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
                          >
                            <Ban size={16} /> {blockedByMe ? 'Unblock User' : 'Block User'}
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this conversation? This will delete messages for both sides.')) {
                                deleteConversation(selectedUser.id);
                              }
                              setShowDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-black/5 dark:border-white/5 flex items-center gap-2"
                          >
                            <Trash2 size={16} /> Delete Chat
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div 
                key={`msg-list-${selectedUser.id}-${selectedUser.isCommunity}`}
                className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-3 bg-gray-50 dark:bg-[#141414] min-h-0"
              >
                {loadingChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Send a message to start the conversation
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const isTemp = msg.id.toString().includes('-temp-');
                    return (
                      <div key={msg.id || i} className={`flex items-end gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isTemp ? 'opacity-70 focus-within:opacity-100' : ''}`}>
                        {/* Profile Pic */}
                        {!isMe && selectedUser.isCommunity && (
                          <div 
                            onClick={() => {
                              setSelectedProfileInfo({
                                id: msg.sender_id,
                                full_name: msg.sender_name,
                                avatar_url: msg.sender_avatar,
                                role: msg.sender_role,
                                is_verified: msg.sender_verified,
                                phone: msg.sender_phone,
                                polytechnic: msg.sender_polytechnic
                              });
                              setShowProfileModal(true);
                            }}
                            className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform"
                          >
                            {msg.sender_avatar ? (
                              <img src={getDirectLink(msg.sender_avatar)} alt={msg.sender_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={14} /></div>
                            )}
                          </div>
                        )}
                        
                        <div 
                          onClick={() => {
                            if (isMe && !isTemp && window.confirm('Delete this message for everyone?')) {
                              if (!selectedUser.isCommunity) deleteMessage(msg.id);
                            }
                          }}
                          className={`max-w-[75%] md:max-w-[70%] px-4 py-2 rounded-2xl cursor-pointer select-none transition-all active:scale-[0.98] flex flex-col ${
                            isMe 
                              ? 'bg-[var(--primary)] text-white rounded-tr-sm shadow-md' 
                              : 'bg-white dark:bg-[#2a2a2a] text-[var(--text)] rounded-tl-sm border border-black/5 dark:border-white/5 shadow-sm'
                          }`}
                        >
                          {!isMe && selectedUser.isCommunity && (
                            <span 
                              className="text-xs font-bold text-gray-800 dark:text-white cursor-pointer hover:underline mb-1 inline-flex items-center gap-1"
                              onClick={() => {
                                setSelectedProfileInfo({
                                  id: msg.sender_id,
                                  full_name: msg.sender_name,
                                  avatar_url: msg.sender_avatar,
                                  is_verified: msg.sender_verified,
                                  role: msg.sender_role,
                                  phone: msg.sender_phone,
                                  polytechnic: msg.sender_polytechnic
                                });
                                setShowProfileModal(true);
                              }}
                            >
                              {msg.sender_name || 'Member'}
                              {msg.sender_verified && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-3.5 h-3.5" size={14} />}
                            </span>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-[#1a1a1a] border-t border-black/10 dark:border-white/10 shrink-0 pb-4 md:pb-3">
                {blockedByMe || blockedByOther ? (
                    <div className="text-center p-3 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        {blockedByMe ? 'You have blocked this conversation.' : 'You have been blocked by this user.'}
                    </div>
                ) : (
                    <form onSubmit={sendMessage} className="flex gap-2 relative max-w-4xl mx-auto w-full">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 dark:bg-black/40 border border-transparent focus:border-[var(--primary)]/30 rounded-2xl px-5 py-3 pr-12 text-sm text-[var(--text)] focus:outline-none transition-all shadow-inner"
                    />
                    <button 
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[var(--primary)] hover:bg-[#28a428] text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-[var(--primary)] shadow-sm"
                    >
                        <Send size={18} className="-ml-0.5" />
                    </button>
                    </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Send size={40} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-medium">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Profile Modal */}
      {showProfileModal && selectedProfileInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-[32px] w-full max-w-[340px] overflow-hidden shadow-2xl relative p-8 flex flex-col items-center"
             >
                {/* Close Button */}
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
 
                {/* Avatar with Solid Green Ring */}
                <div className="w-28 h-28 rounded-full border-[3px] border-[#31bb4b] p-1.5 mb-6">
                   <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 shadow-sm">
                      {selectedProfileInfo.avatar_url ? (
                        <img src={getDirectLink(selectedProfileInfo.avatar_url)} alt={selectedProfileInfo.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><User size={40} /></div>
                      )}
                   </div>
                </div>

                {/* Name and Verified Badge */}
                <div className="flex items-center justify-center gap-1.5 mb-1 px-4">
                   <h3 className="text-2xl font-bold text-[#1c1e21] tracking-tight text-center">{selectedProfileInfo.full_name}</h3>
                   {selectedProfileInfo.is_verified && <BadgeCheck className="text-[#0866ff] fill-[#0866ff] text-white w-5 h-5 shrink-0" />}
                </div>

                {/* Institution Name */}
                <p className="font-semibold text-[#8d949e] text-sm tracking-tight mb-10 text-center uppercase">
                  {selectedProfileInfo.polytechnic || 'Engineering Student'}
                </p>

                {/* Message Button */}
                <button 
                  onClick={async () => {
                    const profileId = selectedProfileInfo.id;
                    const findInHistory = conversations.find(c => c.id === profileId && !c.isCommunity);
                    
                    if (findInHistory) {
                      setSelectedUser(findInHistory);
                      setSearchParams({ userId: profileId });
                    } else {
                      // Fetch full profile info to be sure
                      const { data: fullP } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle();
                      
                      const newTempUser = {
                        id: profileId,
                        full_name: fullP?.full_name || selectedProfileInfo.full_name,
                        avatar_url: fullP?.avatar_url || selectedProfileInfo.avatar_url,
                        is_verified: fullP?.is_verified || fullP?.role === 'admin' || selectedProfileInfo.is_verified,
                        role: fullP?.role || selectedProfileInfo.role || 'student',
                        lastMessage: 'Start a conversation...',
                        timestamp: new Date().toISOString()
                      };
                      setSelectedUser(newTempUser);
                      setConversations(prev => {
                        if (prev.some(c => c.id === newTempUser.id && !c.isCommunity)) return prev;
                        return [newTempUser, ...prev];
                      });
                      setSearchParams({ userId: profileId });
                    }
                    setShowProfileModal(false);
                  }}
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
                >
                  <MessageSquare size={18} className="fill-white" />
                  Message
                </button>
             </motion.div>
        </div>
      )}
    </motion.div>
  );
}
