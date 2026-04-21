import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Send, Trash2, User, MessageSquare, X } from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { supabase } from '../lib/supabase';
import { getEmbedUrl } from '../lib/utils';

export default function VideoPlayer() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  useEffect(() => {
    fetchContentAndComments();
    checkUser();
  }, [contentId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        setCurrentUserProfile(profile);
        if (profile.role === 'admin') setIsAdmin(true);
      }
    }
  };

  const fetchContentAndComments = async () => {
    if (!contentId) return;
    
    // Content
    const { data: contentData } = await supabase
      .from('course_content')
      .select('*')
      .eq('id', contentId)
      .single();
    
    if (contentData) setContent(contentData);

    // Comments without join (fixes PGRST200 foreign key error)
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });
    
    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, polytechnic_name')
        .in('id', userIds);
        
      const profilesMap: any = {};
      profilesData?.forEach(p => { profilesMap[p.id] = p; });
      
      const mergedComments = commentsData.map(c => ({
        ...c,
        profiles: profilesMap[c.user_id]
      }));
      setComments(mergedComments);
    } else {
      setComments([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        content_id: contentId,
        user_id: user.id,
        text: newComment
      }])
      .select('*');

    if (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } else if (data) {
      const newCommentData = {
        ...data[0],
        profiles: currentUserProfile
      };
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Delete this comment?')) return;
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comment:', error);
    } else {
      setComments(prev => prev.filter(c => c.id !== id));
    }
  };

  if (!content) {
    return <div className="p-8 text-center text-[var(--text)]">Loading video...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 max-w-5xl mx-auto pb-12"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[var(--primary)] transition-colors w-fit"
      >
        <ChevronLeft size={20} /> Back to Course
      </button>

      <div className="flex flex-col gap-4">
        {/* Video Player */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <iframe
            src={getEmbedUrl(content.url, content.source)}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={content.title}
          />
        </div>
        
        <div className="flex flex-col gap-2 px-2">
          <h1 className="text-2xl font-bold text-[var(--text)]">{content.title}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
            {new Date(content.created_at).toLocaleDateString()} • {content.type}
          </div>
          {content.description && (
            <div className="mt-4 bg-black/5 dark:bg-white/5 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <h3 className="font-bold mb-1 uppercase text-[10px] tracking-widest text-gray-400">Description</h3>
              {content.description}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <GlassmorphicCard className="p-6 mt-4">
        <h2 className="text-xl font-bold text-[var(--text)] mb-6">
          {comments.length} Comments
        </h2>
        
        <form onSubmit={handleAddComment} className="flex gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
            <User size={20} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-b border-black/10 dark:border-white/10 focus:border-[var(--primary)] p-2 text-[var(--text)] focus:outline-none transition-all placeholder:text-gray-400"
            />
            <div className={`flex justify-end transition-all ${newComment ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md active:scale-95"
              >
                Comment
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          {comments.map((comment) => {
            const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : (comment.profiles || {});
            const displayName = comment.user_id === user?.id ? 'You' : (profile?.full_name || 'Student');
            return (
              <div key={comment.id} className="flex gap-4 group">
                <div 
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 overflow-hidden cursor-pointer"
                  onClick={() => comment.user_id !== user?.id && setSelectedProfile({ ...profile, id: comment.user_id })}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`font-bold text-[var(--text)] text-sm ${comment.user_id !== user?.id ? 'cursor-pointer hover:underline' : ''}`}
                        onClick={() => comment.user_id !== user?.id && setSelectedProfile({ ...profile, id: comment.user_id })}
                      >
                        {displayName}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {(isAdmin || comment.user_id === user?.id) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-[var(--text)] mt-1 text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </GlassmorphicCard>

      {/* Profile Popup */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProfile(null)}>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 w-full max-w-sm relative"
          >
            <button 
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[var(--text)] bg-gray-100 dark:bg-white/5 rounded-full"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col items-center gap-4 mt-2">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border-4 border-[var(--primary)]/20 flex items-center justify-center">
                {selectedProfile.avatar_url ? (
                  <img src={selectedProfile.avatar_url} alt={selectedProfile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--text)]">{selectedProfile.full_name || 'Student'}</h3>
                {selectedProfile.polytechnic_name && (
                  <p className="text-sm text-gray-500 mt-1">{selectedProfile.polytechnic_name}</p>
                )}
              </div>
              
              <button 
                onClick={() => navigate(`/messages?userId=${selectedProfile.id}`)}
                className="mt-2 w-full py-2.5 bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <MessageSquare size={18} /> Message
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

