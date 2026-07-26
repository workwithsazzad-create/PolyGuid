import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, Trash2, User, MessageSquare, X, BadgeCheck, Star, BookmarkCheck,
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, ShieldAlert,
  Settings
} from 'lucide-react';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { supabase } from '../lib/supabase';
import { 
  extractYouTubeId, 
  getProtectedYouTubeEmbedUrl, 
  obfuscateVideoUrl, 
  attachVideoProtectionListeners 
} from '../lib/videoProtection';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Player state
  const [protectedUrl, setProtectedUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('polyguide_player_volume');
    return saved !== null ? Number(saved) : 80;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('polyguide_player_muted');
    return saved === 'true';
  });
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [quality, setQuality] = useState<string>('auto');
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchContentAndComments();
    checkUser();
  }, [contentId]);

  // Anti-inspection protection
  useEffect(() => {
    const cleanup = attachVideoProtectionListeners(containerRef.current);
    return () => cleanup();
  }, [containerRef.current]);

  const checkUser = async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) return;
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

  const fetchContentAndComments = async () => {
    if (!contentId) return;
    
    // Fast path: fetch content immediately
    supabase
      .from('course_content')
      .select('*')
      .eq('id', contentId)
      .single()
      .then(({ data: contentData }) => {
        if (contentData) {
          setContent(contentData);
          const embedUrl = getProtectedYouTubeEmbedUrl(contentData.url);
          setProtectedUrl(embedUrl);
        }
      });

    // Parallel background path: fetch comments
    supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })
      .then(async ({ data: commentsData }) => {
        if (commentsData && commentsData.length > 0) {
          const userIds = [...new Set(commentsData.map(c => c.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, polytechnic_name, role, is_verified')
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
      });
  };

  // Quality Options
  const QUALITY_OPTIONS = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: 'hd1080' },
    { label: '720p', value: 'hd720' },
    { label: '480p', value: 'large' },
    { label: '360p', value: 'medium' },
    { label: '240p', value: 'small' },
  ];

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!protectedUrl) return;

    const videoId = extractYouTubeId(content?.url || '');
    if (!videoId) return;

    const initPlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onReady: (event: any) => {
                setDuration(event.target.getDuration() || 0);
                // Apply stored volume & mute immediately on ready
                try {
                  const savedVol = localStorage.getItem('polyguide_player_volume');
                  const savedMuted = localStorage.getItem('polyguide_player_muted');
                  const initVol = savedVol !== null ? Number(savedVol) : volume;
                  const initMuted = savedMuted === 'true';
                  event.target.setVolume(initVol);
                  if (initMuted) {
                    event.target.mute();
                  } else {
                    event.target.unMute();
                  }
                } catch (e) {}

                // Autoplay video immediately
                try {
                  event.target.playVideo();
                  setIsPlaying(true);
                } catch (e) {}
              },
              onStateChange: (event: any) => {
                // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
                if (event.data === 1) setIsPlaying(true);
                else if (event.data === 2 || event.data === 0) setIsPlaying(false);
              }
            }
          });
        } catch (e) {
          console.warn('YT Player init fallback to postMessage:', e);
        }
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else {
      initPlayer();
    }

    // Interval to poll current play time smoothly
    progressIntervalRef.current = setInterval(() => {
      if (!isScrubbing && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
        } catch (e) {}
      }
    }, 250);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [protectedUrl, content, isScrubbing]);

  // PostMessage Command Fallback Helper
  const sendPostMessageCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      } else {
        sendPostMessageCommand('pauseVideo');
      }
      setIsPlaying(false);
      triggerCenterAnimation('pause');
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      } else {
        sendPostMessageCommand('playVideo');
      }
      setIsPlaying(true);
      triggerCenterAnimation('play');
    }
  };

  const triggerCenterAnimation = (type: 'play' | 'pause') => {
    setCenterAnimation(type);
    setTimeout(() => setCenterAnimation(null), 600);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(newTime, true);
    } else {
      sendPostMessageCommand('seekTo', [newTime, true]);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);
    try {
      localStorage.setItem('polyguide_player_volume', String(newVol));
      localStorage.setItem('polyguide_player_muted', String(muted));
    } catch (e) {}

    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(newVol);
      if (muted) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } else {
      sendPostMessageCommand('setVolume', [newVol]);
      if (muted) sendPostMessageCommand('mute');
      else sendPostMessageCommand('unMute');
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    try {
      localStorage.setItem('polyguide_player_muted', String(nextMute));
    } catch (e) {}

    if (nextMute) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      } else {
        sendPostMessageCommand('mute');
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
      } else {
        sendPostMessageCommand('unMute');
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      ytPlayerRef.current.setPlaybackRate(speed);
    } else {
      sendPostMessageCommand('setPlaybackRate', [speed]);
    }
  };

  const handleQualityChange = (qValue: string) => {
    setQuality(qValue);
    setShowQualityMenu(false);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackQuality === 'function') {
      ytPlayerRef.current.setPlaybackQuality(qValue);
    } else {
      sendPostMessageCommand('setPlaybackQuality', [qValue]);
    }
  };

  const skipSeconds = (seconds: number) => {
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(target);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(e => console.error(e));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(e => console.error(e));
      setIsFullscreen(false);
    }
  };

  // Keyboard controls inside video container
  const handleKeyDownControls = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      skipSeconds(5);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      skipSeconds(-5);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
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
            item_type: 'video'
          }]);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
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
      setComments(prev => [newCommentData, ...prev]);
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
    }
  };

  const handleDeleteComment = async (id: string) => {
    await supabase.from('comments').delete().eq('parent_id', id);
    const { data, error } = await supabase.from('comments').delete().eq('id', id).select();

    if (error || !data || data.length === 0) {
      console.error('Error deleting comment');
      return;
    }
    setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
  };

  if (!content) {
    return <div className="p-8 text-center text-[var(--text)]">Loading video...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto pb-12 px-2 sm:px-0 select-none"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[var(--primary)] transition-colors w-fit hidden lg:flex"
      >
        <ChevronLeft size={20} /> Back to Course
      </button>

      <div className="flex flex-col gap-4">
        {/* Secure Protected Video Player Box */}
        <div 
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDownControls}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group focus:outline-none"
        >
          {/* Underlying YouTube Embed with controls disabled */}
          {protectedUrl ? (
            <iframe
              ref={iframeRef}
              id="yt-player-iframe"
              src={protectedUrl}
              className="w-full h-full border-none pointer-events-none scale-[1.01]"
              allow="autoplay; encrypted-media; picture-in-picture"
              title={content.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              Video URL Protected
            </div>
          )}

          {/* Transparent Interactive Click Shield - Blocks all direct access to YouTube native UI */}
          <div 
            onClick={togglePlayPause}
            onDoubleClick={toggleFullscreen}
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            title="Click to Play/Pause • Double click for Fullscreen"
          />

          {/* Center Play/Pause Animated Indicator */}
          <AnimatePresence>
            {centerAnimation && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl">
                  {centerAnimation === 'play' ? <Play size={36} className="ml-1 fill-white" /> : <Pause size={36} className="fill-white" />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom High Quality Video Controls (Bottom Bar) */}
          <div 
            className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-8 pb-3 px-3 sm:px-5 flex flex-col gap-2 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrubbable Progress Bar */}
            <div className="relative w-full h-2 group/scrubber flex items-center cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onMouseDown={() => setIsScrubbing(true)}
                onTouchStart={() => setIsScrubbing(true)}
                onMouseUp={() => setIsScrubbing(false)}
                onTouchEnd={() => setIsScrubbing(false)}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-[#32CD32] transition-all"
              />
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between text-white text-xs sm:text-sm font-medium pt-1">
              {/* Left Controls */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Play / Pause Toggle */}
                <button 
                  onClick={togglePlayPause}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="ml-0.5 fill-white" />}
                </button>

                {/* Rewind / Forward 10s */}
                <button 
                  onClick={() => skipSeconds(-10)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white hidden sm:block"
                  title="Rewind 10s"
                >
                  <RotateCcw size={16} />
                </button>
                <button 
                  onClick={() => skipSeconds(10)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white hidden sm:block"
                  title="Forward 10s"
                >
                  <RotateCw size={16} />
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-12 sm:w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#32CD32]"
                  />
                </div>

                {/* Time Display */}
                <span className="font-mono text-[11px] sm:text-xs text-gray-300 ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowQualityMenu(false);
                    }}
                    className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-gray-200 transition-colors"
                  >
                    {playbackRate}x
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 w-24 flex flex-col text-xs z-50 overflow-hidden">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-3 py-1.5 text-left hover:bg-white/10 transition-colors ${
                            playbackRate === speed ? 'text-[#32CD32] font-bold bg-white/5' : 'text-gray-300'
                          }`}
                        >
                          {speed === 1 ? 'Normal' : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSpeedMenu(false);
                    }}
                    className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-gray-200 transition-colors flex items-center gap-1"
                    title="Video Quality"
                  >
                    <Settings size={12} className="text-gray-300" />
                    <span>{QUALITY_OPTIONS.find(q => q.value === quality)?.label || 'Auto'}</span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1 w-28 flex flex-col text-xs z-50 overflow-hidden">
                      <div className="px-3 py-1 text-[10px] font-bold text-gray-400 border-b border-white/10 uppercase tracking-wider">
                        Quality
                      </div>
                      {QUALITY_OPTIONS.map((q) => (
                        <button
                          key={q.value}
                          onClick={() => handleQualityChange(q.value)}
                          className={`px-3 py-1.5 text-left hover:bg-white/10 transition-colors ${
                            quality === q.value ? 'text-[#32CD32] font-bold bg-white/5' : 'text-gray-300'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button 
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Title and Save Bar */}
        <div className="flex flex-col gap-1 sm:gap-2 px-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg sm:text-2xl font-black text-[var(--text)] line-clamp-2 md:line-clamp-none">{content.title}</h1>
            <button 
              onClick={toggleSave}
              disabled={isSaving}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl transition-all font-bold text-[9px] sm:text-sm shrink-0 shadow-sm ${isSaved ? 'bg-[var(--primary)] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-[var(--primary)]'}`}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Star className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
              <span>{isSaved ? 'Saved' : 'Save for later'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
            {new Date(content.created_at).toLocaleDateString()} • {content.type}
          </div>
          {content.description && (
            <div className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">
              {content.description}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <GlassmorphicCard className="p-4 sm:p-6 mt-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-4 sm:mb-6">
          {comments.length} Comments
        </h2>
        
        <form onSubmit={handleAddComment} className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
            <User size={16} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-b border-black/10 dark:border-white/10 focus:border-[var(--primary)] p-2 text-sm sm:text-base text-[var(--text)] focus:outline-none transition-all placeholder:text-gray-400"
            />
            <div className={`flex justify-end transition-all ${newComment ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
              >
                Comment
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          {comments.filter(c => !c.parent_id).map((comment) => {
            const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : (comment.profiles || {});
            const displayName = comment.user_id === user?.id ? 'You' : (profile?.full_name || 'Student');
            const commentReplies = comments.filter(r => r.parent_id === comment.id);

            return (
              <div key={comment.id} className="flex flex-col gap-4">
                <div className="flex gap-4 group">
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
                        <div className="flex items-center gap-1">
                          <span 
                            className={`font-bold text-[var(--text)] text-sm ${comment.user_id !== user?.id ? 'cursor-pointer hover:underline' : ''}`}
                            onClick={() => comment.user_id !== user?.id && setSelectedProfile({ ...profile, id: comment.user_id })}
                          >
                            {displayName}
                          </span>
                          {(profile?.role === 'admin' || profile?.is_verified) && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-4 h-4 shrink-0" size={16} />}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-[var(--text)] mt-1 text-sm leading-relaxed break-words">{comment.text}</p>
                    
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {comment.user_id !== user?.id && (
                        <button 
                          onClick={() => navigate(`/messages?userId=${comment.user_id}`)}
                          className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-[var(--primary)] rounded-full transition-all text-[10px] font-bold uppercase tracking-tight"
                          title="Send Message"
                        >
                          <MessageSquare size={12} /> <span className="hidden sm:inline">Send Msg</span>
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
                      <div className="mt-3 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-gray-400" />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a reply..."
                            className="w-full bg-transparent border-b border-black/10 dark:border-white/10 focus:border-[var(--primary)] p-1 text-sm text-[var(--text)] focus:outline-none transition-all placeholder:text-gray-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full uppercase transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleAddComment(null as any, comment.id)}
                              disabled={!replyText.trim()}
                              className="bg-[var(--primary)] hover:bg-[#28a428] text-white px-3 py-1 rounded-full text-[10px] font-bold transition-all disabled:opacity-50 uppercase tracking-tighter shadow-sm"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {commentReplies.length > 0 && (
                      <div className="mt-4 flex flex-col gap-4 pl-4 sm:pl-12 border-l border-black/5 dark:border-white/5">
                        {commentReplies.map(reply => {
                           const rProfile = Array.isArray(reply.profiles) ? reply.profiles[0] : (reply.profiles || {});
                           const rDisplayName = reply.user_id === user?.id ? 'You' : (rProfile?.full_name || 'Student');
                           return (
                             <div key={reply.id} className="flex gap-3 group">
                               <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 overflow-hidden">
                                 {rProfile?.avatar_url ? (
                                   <img src={rProfile.avatar_url} alt={rDisplayName} className="w-full h-full object-cover" />
                                 ) : (
                                   <User size={16} />
                                 )}
                               </div>
                               <div className="flex-1">
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold text-[var(--text)] text-xs">{rDisplayName}</span>
                                    {(rProfile?.role === 'admin' || rProfile?.is_verified) && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-3.5 h-3.5" size={14} />}
                                    <span className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-[var(--text)] mt-0.5 text-xs leading-relaxed break-words">{reply.text}</p>
                                 <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {reply.user_id !== user?.id && (
                                      <button 
                                        onClick={() => navigate(`/messages?userId=${reply.user_id}`)}
                                        className="flex items-center gap-1 px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-[var(--primary)] rounded-full transition-all text-[9px] font-bold uppercase tracking-tight"
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
                                        className="flex items-center p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-full transition-all"
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
                <h3 className="text-xl font-bold text-[var(--text)] flex items-center justify-center gap-1">
                  {selectedProfile.full_name || 'Student'}
                  {(selectedProfile.role === 'admin' || selectedProfile.is_verified) && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-[1.125rem] h-[1.125rem] shrink-0" size={18} />}
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
