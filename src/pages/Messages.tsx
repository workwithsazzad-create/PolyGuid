import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Send, User, ChevronLeft } from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { useSearchParams } from 'react-router-dom';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchConversations(session.user.id);
    }
  };

  const fetchConversations = async (currentUserId: string) => {
    try {
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

      const uniqueUsersMap = new Map();
      const otherUserIds = new Set<string>();
      
      // First pass: identify the other users
      data?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        otherUserIds.add(otherUserId);
        
        // Keep only the latest message for the unique map
        if (!uniqueUsersMap.has(otherUserId)) {
          uniqueUsersMap.set(otherUserId, {
            id: otherUserId,
            lastMessage: msg.content,
            timestamp: msg.created_at,
            full_name: 'Student', // Default placeholder
            avatar_url: null
          });
        }
      });

      // Include initialUserId if present
      if (initialUserId) {
        otherUserIds.add(initialUserId);
        if (!uniqueUsersMap.has(initialUserId)) {
          uniqueUsersMap.set(initialUserId, {
            id: initialUserId,
            lastMessage: 'Start a conversation...',
            timestamp: new Date().toISOString(),
            full_name: 'Student',
            avatar_url: null
          });
        }
      }

      // Fetch profiles for all other users
      if (otherUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(otherUserIds));
          
        if (!profilesError && profilesData) {
          profilesData.forEach(p => {
            if (uniqueUsersMap.has(p.id)) {
              const u = uniqueUsersMap.get(p.id);
              u.full_name = p.full_name || 'Student';
              u.avatar_url = p.avatar_url;
            }
          });
        }
      }

      // Convert map to array and sort by timestamp
      const convList = Array.from(uniqueUsersMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setConversations(convList);
      
      if (initialUserId) {
        const target = convList.find(c => c.id === initialUserId);
        if (target) setSelectedUser(target);
      } else if (convList.length > 0) {
        setSelectedUser(convList[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages(selectedUser.id);
      
      // Mark messages from this user to me as read
      markAsRead(selectedUser.id);
      
      let initialLoadDone = false;

      // Subscribe to all inserts to catch messages from others, but specifically append if it's from the selected user
      const channel = supabase
        .channel(`messages_${user.id}_${selectedUser.id}_${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.id}` 
        }, payload => {
            // Update messages list if it's from the current open thread
            if (payload.new.sender_id === selectedUser.id) {
                setMessages(prev => [...prev, payload.new]);
                scrollToBottom();
                
                // Automatically mark it as read since the chat is open
                markAsRead(selectedUser.id);
            }
            
            // Refresh conversation list to show new message preview/order
            if (initialLoadDone) {
              fetchConversations(user.id);
            }
        })
        .subscribe(() => {
          initialLoadDone = true;
        });
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, user]);

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId)
        .eq('read', false);
    } catch {
      // safe ignore
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    const msg = newMessage;
    setNewMessage(''); // optimistic clear
    
    // Optimistic UI update
    const tempMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: msg,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    const { error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: msg
      }]);

    if (error) {
      console.error('Error sending message:', error);
      // Rollback optimistic update on error would go here
    } else {
      // Re-fetch conversations to update last message
      fetchConversations(user.id);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--primary)] animate-pulse font-bold">Loading Messages...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto"
    >
      <div className="flex bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 flex-1">
        
        {/* Sidebar Contacts List */}
        <div className={`w-full md:w-80 border-r border-black/10 dark:border-white/10 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/20">
            <h2 className="text-xl font-bold text-[var(--text)]">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No conversations yet.</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => setSelectedUser(conv)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-black/5 dark:border-white/5 ${selectedUser?.id === conv.id ? 'bg-[var(--primary)]/10 border-l-4 border-l-[var(--primary)]' : 'hover:bg-black/5 dark:hover:bg-white/5 border-l-4 border-l-transparent'}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} alt={conv.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={24} /></div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-[var(--text)] text-sm truncate">{conv.full_name}</h4>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-[#141414] ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] flex items-center gap-3 shadow-sm">
                <button 
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-[var(--primary)]"
                  onClick={() => setSelectedUser(null)}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                  )}
                </div>
                <h3 className="font-bold text-[var(--text)]">{selectedUser.full_name}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Send a message to start the conversation
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isMe 
                              ? 'bg-[var(--primary)] text-white rounded-tr-sm' 
                              : 'bg-white dark:bg-[#2a2a2a] text-[var(--text)] rounded-tl-sm border border-black/5 dark:border-white/5 shadow-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-black/10 dark:border-white/10">
                <form onSubmit={sendMessage} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 dark:bg-black/20 border border-transparent focus:border-[var(--primary)]/30 rounded-full px-6 py-3 pr-12 text-sm text-[var(--text)] focus:outline-none transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1 bottom-1 aspect-square bg-[var(--primary)] hover:bg-[#28a428] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-[var(--primary)] shadow-sm"
                  >
                    <Send size={16} className="-ml-0.5" />
                  </button>
                </form>
              </div>
            </>
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
    </motion.div>
  );
}
