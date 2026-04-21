import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Trash2, User, MessageSquare, X, BadgeCheck, FileText } from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { supabase } from '../lib/supabase';
import { getEmbedUrl } from '../lib/utils';

export default function PdfViewer() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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

    // Comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });
    
    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, polytechnic_name, role')
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

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    if (e) e.preventDefault();
    const text = parentId ? replyText : newComment;
    if (!text.trim() || !user) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        content_id: contentId,
        user_id: user.id,
        text: text,
        parent_id: parentId
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
      setComments([...comments, newCommentData]);
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // Attempt to delete replies first to avoid FK constraint errors if cascade is missing
    const { error: replyError } = await supabase
      .from('comments')
      .delete()
      .eq('parent_id', commentId);

    if (replyError) {
      console.warn('Could not cleanly delete replies:', replyError);
    }

    // Use .select() to verify if the row was actually deleted
    const { data, error: commentError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .select();
    
    if (commentError) {
      console.error('Error deleting comment:', commentError);
      return;
    } 
    
    if (!data || data.length === 0) {
      console.error('Delete failed: Database blocked the action (0 rows deleted). Please ensure RLS policies are correct and you have permission.');
      return;
    }

    // Success, update UI
    setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
  };

  if (!content) return <div className="p-8 text-center">Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 max-w-5xl mx-auto pb-12"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[var(--primary)] transition-colors w-fit"
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PDF Viewer Side */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="w-full aspect-[4/5] sm:aspect-[3/4] bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10">
            <iframe 
              src={getEmbedUrl(content.url, 'pdf')} 
              className="w-full h-full border-none"
              title={content.title}
            />
          </div>
          
          <div className="px-2">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">{content.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              <FileText size={12} /> PDF DOCUMENT • {new Date(content.created_at).toLocaleDateString()}
            </div>
            {content.description && (
              <div className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {content.description}
              </div>
            )}
          </div>
        </div>

        {/* Comments Side */}
        <div className="w-full lg:w-[350px] flex flex-col gap-4">
          <GlassmorphicCard className="p-4 flex flex-col gap-4 h-fit max-h-[600px]">
            <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
              <MessageSquare size={18} /> Comments ({comments.length})
            </h3>
            
            {user ? (
              <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a question or leave a comment..."
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                  rows={3}
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-[var(--primary)] text-white py-2 px-4 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#28a428] transition-colors self-end"
                >
                  Post Comment
                </button>
              </form>
            ) : (
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl text-center text-sm text-gray-500">
                Please login to participate in the discussion.
              </div>
            )}

            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {comments.filter(c => !c.parent_id).map((comment) => {
                const profile = comment.profiles;
                const displayName = profile?.full_name || 'Student';
                const commentReplies = comments.filter(r => r.parent_id === comment.id);
                
                return (
                  <div key={comment.id} className="flex flex-col gap-3">
                    <div className="flex gap-3 group">
                      <div 
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 overflow-hidden cursor-pointer"
                        onClick={() => comment.user_id !== user?.id && setSelectedProfile({ ...profile, id: comment.user_id })}
                      >
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <span 
                              className={`font-bold text-[var(--text)] text-xs truncate ${comment.user_id !== user?.id ? 'cursor-pointer hover:underline' : ''}`}
                              onClick={() => comment.user_id !== user?.id && setSelectedProfile({ ...profile, id: comment.user_id })}
                            >
                              {displayName}
                            </span>
                            {profile?.role === 'admin' && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-3.5 h-3.5 shrink-0" size={14} />}
                          </div>
                        </div>
                        <p className="text-[var(--text)] mt-1 text-xs leading-relaxed break-words">{comment.text}</p>
                        
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                           {comment.user_id !== user?.id && (
                             <button 
                               onClick={() => navigate(`/messages?userId=${comment.user_id}`)}
                               className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-[var(--primary)] rounded-full transition-all text-[10px] font-bold uppercase tracking-tight"
                               title="Send Message"
                             >
                               <MessageSquare size={12} /> <span className="hidden sm:inline">Message</span>
                             </button>
                           )}

                           <button 
                             onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                             className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all text-[10px] font-bold uppercase tracking-tight ${replyingTo === comment.id ? 'text-[var(--primary)]' : 'text-gray-500'}`}
                           >
                             Reply
                           </button>

                           {(isAdmin || comment.user_id === user?.id) && (
                             <button 
                               onClick={() => handleDeleteComment(comment.id)}
                               className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-full transition-all text-[10px] font-bold uppercase tracking-tight"
                               title="Delete"
                             >
                               <Trash2 size={12} /> <span className="hidden sm:inline">Delete</span>
                             </button>
                           )}
                        </div>

                        {replyingTo === comment.id && (
                          <div className="mt-3 flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-gray-400" />
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                              <input
                                autoFocus
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Add a reply..."
                                className="w-full bg-transparent border-b border-black/10 dark:border-white/10 focus:border-[var(--primary)] p-1 text-[10px] text-[var(--text)] focus:outline-none transition-all placeholder:text-gray-400"
                              />
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                  className="px-2 py-1 text-[9px] font-bold text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full uppercase transition-all"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleAddComment(null as any, comment.id)}
                                  disabled={!replyText.trim()}
                                  className="bg-[var(--primary)] hover:bg-[#28a428] text-white px-2 py-1 rounded-full text-[9px] font-bold transition-all disabled:opacity-50 uppercase tracking-tighter"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Indented Replies */}
                        {commentReplies.length > 0 && (
                          <div className="mt-2 flex flex-col gap-3 pl-3 border-l border-black/5 dark:border-white/5">
                            {commentReplies.map(reply => {
                               const rProfile = reply.profiles;
                               const rDisplayName = rProfile?.full_name || 'Student';
                               return (
                                 <div key={reply.id} className="flex gap-2 group">
                                   <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 overflow-hidden">
                                     {rProfile?.avatar_url ? (
                                       <img src={rProfile.avatar_url} alt={rDisplayName} className="w-full h-full object-cover" />
                                     ) : (
                                       <User size={12} />
                                     )}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-1">
                                        <span className="font-bold text-[var(--text)] text-[10px] truncate">{rDisplayName}</span>
                                        {rProfile?.role === 'admin' && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-3 h-3" size={12} />}
                                     </div>
                                     <p className="text-[var(--text)] mt-0.5 text-[10px] leading-relaxed break-words">{reply.text}</p>
                                     <div className="flex flex-wrap items-center gap-1 mt-1">
                                         {reply.user_id !== user?.id && (
                                           <button 
                                             onClick={() => navigate(`/messages?userId=${reply.user_id}`)}
                                             className="flex items-center gap-1.5 px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-[var(--primary)] rounded-full transition-all text-[9px] font-bold uppercase tracking-tight"
                                             title="Send Message"
                                           >
                                             <MessageSquare size={10} /> <span className="hidden sm:inline">Msg</span>
                                           </button>
                                         )}

                                         <button 
                                           onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                           className="px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-[var(--primary)] rounded-full transition-all text-[9px] font-bold uppercase tracking-tight"
                                         >
                                           Reply
                                         </button>

                                         {(isAdmin || reply.user_id === user?.id) && (
                                           <button 
                                             onClick={() => handleDeleteComment(reply.id)}
                                             className="p-1 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-full transition-all"
                                             title="Delete"
                                           >
                                             <Trash2 size={10} />
                                           </button>
                                         )}
                                     </div>
                                   </div>
                                 </div>
                               );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-xs">No comments yet.</p>
              )}
            </div>
          </GlassmorphicCard>
        </div>
      </div>

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
                <h3 className="text-xl font-bold text-[var(--text)] flex items-center justify-center gap-1">
                  {selectedProfile.full_name || 'Student'}
                  {selectedProfile.role === 'admin' && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-[1.125rem] h-[1.125rem] shrink-0" size={18} />}
                </h3>
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
