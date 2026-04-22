import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Star, BookmarkCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getEmbedUrl } from '../lib/utils';

export default function PdfViewer() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent();
    checkUser();
  }, [contentId]);

  const checkUser = async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) return;
      if (session) {
        setUser(session.user);
        
        // Check if already saved
        const { data: saved } = await supabase
          .from('saved_items')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('content_id', contentId)
          .maybeSingle();
        
        if (saved) setIsSaved(true);
      }
    } catch (e) {
      console.error('checkUser fetch error:', e);
    }
  };

  const toggleSave = async () => {
    if (!user || !content) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_items')
          .insert([{
            user_id: user.id,
            content_id: contentId,
            item_type: 'pdf'
          }]);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchContent = async () => {
    if (!contentId) return;
    
    try {
      // Content
      const { data: contentData, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('id', contentId)
        .single();
      
      if (error) throw error;
      if (contentData) setContent(contentData);
    } catch (e) {
      console.error('fetchContent error:', e);
    }
  };

  if (!content) return <div className="p-8 text-center text-white bg-black min-h-screen">Loading PDF...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col w-full h-full"
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 bg-[#1a1a1a] border-b border-white/10 text-white shadow-xl shrink-0">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0 text-gray-300 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm md:text-lg font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-xl">
              {content.title}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">
              PolyGuid PDF Viewer
            </p>
          </div>
        </div>
        
        {/* Right: Save */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Save Button */}
          <button 
            onClick={toggleSave}
            disabled={isSaving}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-bold text-xs shrink-0 shadow-sm ${isSaved ? 'bg-[var(--primary)] text-white hover:bg-[#28a428]' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Star size={16} />}
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save for later'}</span>
          </button>

        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 w-full bg-[#0a0a0a] relative flex items-center justify-center">
        <iframe 
          src={getEmbedUrl(content.url, 'pdf')} 
          className="w-full h-full border-none"
          title={content.title}
          allowFullScreen
        />
      </div>
    </motion.div>
  );
}
