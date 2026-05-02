import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Eye, Video, FileText, ChevronLeft, Save, X, Paperclip, Pin, PinOff, Users } from 'lucide-react';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import { supabase } from '../../lib/supabase';
import { getDirectLink, getEmbedUrl } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'course' | 'content';
  loading: boolean;
  handleCreateContent: (e: React.FormEvent) => Promise<void>;
  handleCreateCourse: (e: React.FormEvent) => Promise<void>;
  contentForm: any;
  setContentForm: any;
  courseForm: any;
  setCourseForm: any;
  SEMESTERS: string[];
}

const ContentModal = ({ 
  isOpen, 
  onClose, 
  title, 
  type, 
  loading, 
  handleCreateContent, 
  handleCreateCourse, 
  contentForm, 
  setContentForm, 
  courseForm, 
  setCourseForm, 
  SEMESTERS 
}: ContentModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-lg overflow-hidden border border-black/10 transition-all font-sans"
      >
        <div className="p-4 border-b border-black/10 flex justify-between items-center">
          <h3 className="text-xl font-medium text-gray-800 dark:text-white">{title}</h3>
        </div>
        <div className="p-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
          {type === 'content' ? (
            <form onSubmit={handleCreateContent} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative pt-2">
                  <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Type*</label>
                  <select 
                    value={contentForm.type}
                    onChange={(e) => setContentForm({...contentForm, type: e.target.value})}
                    className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-[right_1rem_center]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1em' }}
                  >
                    <option value="video" className="text-black dark:text-white dark:bg-[#1a1a1a]">video</option>
                    <option value="pdf" className="text-black dark:text-white dark:bg-[#1a1a1a]">pdf</option>
                  </select>
                </div>

                <div className="relative pt-2">
                  <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Title*</label>
                  <input 
                    required
                    type="text" 
                    value={contentForm.title}
                    onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                    placeholder="Title*"
                    className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center flex-1 w-full border border-gray-300 dark:border-white/10 rounded-md overflow-hidden">
                  <div className="bg-blue-600 text-white text-[11px] font-bold px-3 py-3 whitespace-nowrap uppercase tracking-wider">Available From:</div>
                  <input 
                    type="datetime-local" 
                    value={contentForm.available_from}
                    onChange={(e) => setContentForm({...contentForm, available_from: e.target.value})}
                    className="flex-1 bg-transparent p-2 text-sm text-gray-600 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentForm.type === 'video' && (
                    <div className="relative pt-2">
                      <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10">Source*</label>
                      <select 
                        value={contentForm.source}
                        onChange={(e) => setContentForm({...contentForm, source: e.target.value})}
                        className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-[right_1rem_center]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1em' }}
                      >
                        <option value="youtube" className="text-black dark:text-white dark:bg-[#1a1a1a]">youtube</option>
                        <option value="facebook" className="text-black dark:text-white dark:bg-[#1a1a1a]">facebook</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="relative pt-2 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 mt-2">
                    <Paperclip size={18} />
                  </div>
                  <input 
                    required
                    type="url" 
                    value={contentForm.url}
                    onChange={(e) => setContentForm({...contentForm, url: e.target.value})}
                    placeholder={contentForm.type === 'pdf' ? "Select Pdf File" : "Link*"}
                    className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 pl-10 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {contentForm.type === 'video' && (
                  <div className="flex flex-col gap-4">
                    <input 
                      type="url" 
                      value={contentForm.download_link}
                      onChange={(e) => setContentForm({...contentForm, download_link: e.target.value})}
                      placeholder="Tenbyte Download Link"
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <div className="border border-gray-300 dark:border-white/10 rounded-md overflow-hidden">
                      <div className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 p-2.5 flex gap-4 text-gray-400">
                         {['Normal', 'B', 'I', 'U'].map((tool) => (
                            <button key={tool} type="button" className="text-xs font-bold hover:text-blue-500 transition-colors uppercase">{tool}</button>
                          ))}
                      </div>
                      <textarea 
                        rows={3}
                        value={contentForm.description}
                        onChange={(e) => setContentForm({...contentForm, description: e.target.value})}
                        placeholder="Video Description"
                        className="w-full bg-transparent p-4 text-sm text-gray-600 dark:text-white focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="submit" disabled={loading} className="bg-[#00c48c] text-white font-medium py-2 px-6 rounded-md hover:bg-[#00a375] transition-colors disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button type="button" onClick={onClose} className="bg-[#ff4d4f] text-white font-medium py-2 px-6 rounded-md hover:bg-[#d9363e] transition-colors">
                  Close
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateCourse} className="flex flex-col gap-6">
               <div className="relative pt-2">
                  <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Course Identity*</label>
                  <input 
                    required
                    type="text" 
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                    placeholder="Course Title*"
                    className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="relative pt-2">
                  <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Thumbnail URL*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Paperclip size={18} />
                    </div>
                    <input 
                      required
                      type="url" 
                      value={courseForm.thumbnail}
                      onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 pl-10 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Market Strategy</label>
                    <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${courseForm.isFree ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-white/5 opacity-50'}`}>
                      <input type="checkbox" className="sr-only" checked={courseForm.isFree} onChange={(e) => setCourseForm({...courseForm, isFree: e.target.checked})} />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${courseForm.isFree ? 'bg-green-600 border-green-600' : 'border-gray-400'}`}>
                        {courseForm.isFree && <Plus size={14} className="text-white rotate-45" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-tight">Mark as Free Course</span>
                        <span className="text-[10px] text-gray-400">Checking this puts the course in the Free category</span>
                      </div>
                    </label>
                  </div>

                  {!courseForm.isFree && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative pt-2">
                        <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 tracking-widest">Market Value</label>
                        <input type="number" value={courseForm.originalPrice} onChange={(e) => setCourseForm({...courseForm, originalPrice: parseInt(e.target.value) || 0})} className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div className="relative pt-2">
                        <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 tracking-widest">Your Price</label>
                        <input type="number" value={courseForm.price} onChange={(e) => setCourseForm({...courseForm, price: parseInt(e.target.value) || 0})} className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Course Description</label>
                  <textarea 
                    rows={4}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    placeholder="Brief description of the course..."
                    className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fake User Count</label>
                  <input 
                    type="number" 
                    value={courseForm.fakeUserCount} 
                    onChange={(e) => setCourseForm({...courseForm, fakeUserCount: parseInt(e.target.value) || 0})} 
                    placeholder="e.g. 500"
                    className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Semesters Selection</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEMESTERS.map(sem => (
                      <label key={sem} className={`flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-all ${courseForm.categories.includes(sem) ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 dark:border-white/5 opacity-50'}`}>
                        <input type="checkbox" className="sr-only" checked={courseForm.categories.includes(sem)} onChange={(e) => {
                           if (e.target.checked) setCourseForm({...courseForm, categories: [...courseForm.categories, sem]});
                           else setCourseForm({...courseForm, categories: courseForm.categories.filter(c => c !== sem)});
                        }} />
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${courseForm.categories.includes(sem) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                          {courseForm.categories.includes(sem) && <Plus size={12} className="text-white rotate-45" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-white">{sem}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button type="submit" disabled={loading} className="bg-[#00c48c] text-white font-medium py-2 px-6 rounded-md hover:bg-[#00a375] transition-colors disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                  <button type="button" onClick={onClose} className="bg-[#ff4d4f] text-white font-medium py-2 px-6 rounded-md hover:bg-[#d9363e] transition-colors">
                    Close
                  </button>
                </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Course Form State
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    thumbnail: '',
    isFree: true,
    originalPrice: 0,
    price: 0,
    categories: [] as string[],
    description: '',
    fakeUserCount: 0
  });

  const SEMESTERS = [
    "১ম সেমিস্টার", "২য় সেমিস্টার", "৩য় সেমিস্টার", "৪র্থ সেমিস্টার",
    "৫ম সেমিস্টার", "৬ষ্ঠ সেমিস্টার", "৭ম সেমিস্টার"
  ];

  // Content Form State
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState({
    type: 'video', // 'video' | 'note' | 'pdf' | 'exam' | 'link' | 'live'
    title: '',
    available_from: new Date().toISOString().slice(0, 16),
    is_paid: true,
    source: 'youtube', // 'youtube' | 'facebook'
    url: '',
    download_link: '',
    description: ''
  });

  const [courseContents, setCourseContents] = useState<any[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);

  const fetchContents = async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching contents:', error);
      return [];
    }
    return data || [];
  };

  // Pin State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [courseToPin, setCourseToPin] = useState<any>(null);
  const [pinPosition, setPinPosition] = useState<number>(1);
  const [pinnedCoursesMap, setPinnedCoursesMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    
    // 1. Fetch pinned map
    const { data: pinnedData } = await supabase.from('site_settings').select('value').eq('key', 'pinned_courses').maybeSingle();
    let pMap = {};
    if (pinnedData && pinnedData.value) {
      try {
        pMap = JSON.parse(pinnedData.value);
        setPinnedCoursesMap(pMap);
      } catch(e) {}
    }

    // 2. Fetch courses
    const { data: courseData, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(courseData ? courseData.map((c: any) => ({...c, pinned_position: (pMap as any)[c.id] || null})) : []);
    }
    setLoading(false);
  };

  const handlePinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseToPin) return;

    // Build new map
    const newMap = { ...pinnedCoursesMap };
    
    // Check if position physically taken
    for (const id in newMap) {
       if (newMap[id] === pinPosition && id !== courseToPin.id) {
         alert(`এই নম্বরটিতে বর্তমানে অন্য কোর্স পিন করা আছে।`);
         return;
       }
    }

    newMap[courseToPin.id] = pinPosition;

    try {
      const { error } = await supabase.from('site_settings').upsert(
        { key: 'pinned_courses', value: JSON.stringify(newMap) },
        { onConflict: 'key' }
      );
      if (error) throw error;

      setPinnedCoursesMap(newMap);
      setCourses(courses.map(c => c.id === courseToPin.id ? { ...c, pinned_position: pinPosition } : c));
      setIsPinModalOpen(false);
      setCourseToPin(null);
      fetchCourses(); // Refetch to ensure state sync
    } catch (err: any) {
      alert('Error pinning course');
    }
  };

  const handleUnpinCourse = async (courseId: string) => {
    const newMap = { ...pinnedCoursesMap };
    delete newMap[courseId];

    try {
      const { error } = await supabase.from('site_settings').upsert(
        { key: 'pinned_courses', value: JSON.stringify(newMap) },
        { onConflict: 'key' }
      );
      if (error) throw error;
      
      setPinnedCoursesMap(newMap);
      setCourses(courses.map(c => c.id === courseId ? { ...c, pinned_position: null } : c));
      fetchCourses(); // Refetch to ensure state sync
    } catch(e) {}
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanDesc = courseForm.description.replace(/\[meta:fake_user_count:\d+\]/, '').trim();
    const metaString = `\n\n[meta:fake_user_count:${courseForm.fakeUserCount}]`;
    
    const courseData = {
      title: courseForm.title,
      thumbnail_url: courseForm.thumbnail,
      is_free: courseForm.isFree,
      original_price: courseForm.originalPrice,
      price: courseForm.price,
      categories: courseForm.categories,
      description: cleanDesc + metaString
    };

    if (editingCourseId) {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourseId);

      if (error) {
        console.error('Error updating course:', error);
        alert('Error updating course.');
      } else {
        setCourses(prev => prev.map(c => c.id === editingCourseId ? { ...c, ...courseData } : c));
        setIsAddingCourse(false);
        setEditingCourseId(null);
        setCourseForm({ title: '', thumbnail: '', isFree: true, originalPrice: 0, price: 0, categories: [], description: '', fakeUserCount: 0 });
      }
    } else {
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select();

      if (error) {
        console.error('Error creating course:', error);
        alert('Error creating course.');
      } else {
        setCourses(prev => [data[0], ...prev]);
        setIsAddingCourse(false);
        setCourseForm({ title: '', thumbnail: '', isFree: true, originalPrice: 0, price: 0, categories: [], description: '', fakeUserCount: 0 });
      }
    }
    setLoading(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course? Everything inside it will also be deleted.')) return;
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
    } else {
      setCourses(prev => prev.filter(c => c.id !== id));
      if (selectedCourse?.id === id) setSelectedCourse(null);
    }
  };

  const updateCourseClassCount = async (courseId: string) => {
    const { data: contents } = await supabase
      .from('course_content')
      .select('type')
      .eq('course_id', courseId)
      .eq('type', 'video');
    
    const count = contents?.length || 0;
    
    await supabase
      .from('courses')
      .update({ classes_count: count })
      .eq('id', courseId);
    
    // Refresh courses list to show updated count
    fetchCourses();
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setLoading(true);
    
    const contentData = {
      course_id: selectedCourse.id,
      type: contentForm.type,
      title: contentForm.title,
      available_from: contentForm.available_from,
      is_paid: contentForm.is_paid,
      source: contentForm.source,
      url: contentForm.url,
      download_link: contentForm.download_link,
      description: contentForm.description
    };

    if (editingContentId) {
      const { error } = await supabase
        .from('course_content')
        .update(contentData)
        .eq('id', editingContentId);

      if (error) {
        console.error('Error updating content:', error);
        alert('Error updating content.');
      } else {
        setCourseContents(prev => prev.map(c => c.id === editingContentId ? { ...c, ...contentData } : c));
        if (contentData.type === 'video') await updateCourseClassCount(selectedCourse.id);
        setIsAddingContent(false);
        setEditingContentId(null);
        setContentForm({ type: 'video', title: '', available_from: new Date().toISOString().slice(0, 16), is_paid: true, source: 'youtube', url: '', download_link: '', description: '' });
      }
    } else {
      const { data, error } = await supabase
        .from('course_content')
        .insert([contentData])
        .select();

      if (error) {
        console.error('Error creating content:', error);
        alert('Error creating content.');
      } else {
        setCourseContents(prev => [...prev, data[0]]);
        if (contentData.type === 'video') await updateCourseClassCount(selectedCourse.id);
        setIsAddingContent(false);
        setContentForm({ type: 'video', title: '', available_from: new Date().toISOString().slice(0, 16), is_paid: true, source: 'youtube', url: '', download_link: '', description: '' });
      }
    }
    setLoading(false);
  };

  const handleDeleteContent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    const contentToDelete = courseContents.find(c => c.id === id);
    const { error } = await supabase
      .from('course_content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
    } else {
      setCourseContents(prev => prev.filter(c => c.id !== id));
      if (contentToDelete?.type === 'video') await updateCourseClassCount(selectedCourse.id);
    }
  };

  if (selectedCourse) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex bg-white dark:bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden h-[100px] items-center">
          <div className="flex items-center gap-3 sm:gap-4 z-10 flex-1">
            <button 
              onClick={() => setSelectedCourse(null)}
              className="p-1.5 sm:p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors shrink-0"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-sm sm:text-xl md:text-2xl font-bold text-[var(--text)] tracking-tight truncate">{selectedCourse.title}</h2>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-gray-400 tracking-widest truncate">Studio Workspace</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setEditingContentId(null);
              setContentForm({
                type: 'video',
                title: '',
                available_from: new Date().toISOString().slice(0, 16),
                is_paid: true,
                source: 'youtube',
                url: '',
                download_link: '',
                description: ''
              });
              setIsAddingContent(true);
            }}
            className="ml-2 sm:ml-auto flex items-center justify-center gap-1 sm:gap-2 bg-[var(--primary)] text-white px-3 sm:px-8 py-2 sm:py-3.5 rounded-xl hover:bg-[#28a428] transition-all font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] z-10 text-xs sm:text-base shrink-0"
          >
            <Plus size={16} className="sm:w-5 sm:h-5 stroke-[3]" /> <span className="hidden sm:inline">Add Content</span><span className="sm:hidden">Add</span>
          </button>
        </div>

        <ContentModal 
          isOpen={isAddingContent} 
          onClose={() => setIsAddingContent(false)} 
          title="Create Course Contents" 
          type="content"
          loading={loading}
          handleCreateContent={handleCreateContent}
          handleCreateCourse={handleCreateCourse}
          contentForm={contentForm}
          setContentForm={setContentForm}
          courseForm={courseForm}
          setCourseForm={setCourseForm}
          SEMESTERS={SEMESTERS}
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-widest">Contents List ({courseContents.length})</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-400 font-medium">Live sync enabled</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {courseContents.map((content) => (
              <GlassmorphicCard key={content.id} className="p-4 flex items-center justify-between group hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    content.type === 'video' ? 'bg-red-500/10 text-red-500' : 
                    content.type === 'pdf' ? 'bg-orange-500/10 text-orange-500' : 
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {content.type === 'video' ? <Video size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text)] line-clamp-1">{content.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{content.type} • {content.source || 'File'}</span>
                      {content.is_paid && <span className="text-[10px] bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded font-bold">PREMIUM</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(content.type === 'video' ? `/play/${content.id}` : `/pdf/${content.id}`, '_blank');
                    }}
                    className="p-2.5 text-gray-400 hover:text-[var(--primary)] hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingContentId(content.id);
                      setContentForm({
                        type: content.type,
                        title: content.title,
                        available_from: content.available_from ? new Date(content.available_from).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                        is_paid: content.is_paid,
                        source: content.source || 'youtube',
                        url: content.url,
                        download_link: content.download_link || '',
                        description: content.description || ''
                      });
                      setIsAddingContent(true);
                    }}
                    className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteContent(content.id); }} 
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </GlassmorphicCard>
            ))}
            {courseContents.length === 0 && !isAddingContent && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                <FileText size={48} strokeWidth={1} />
                <p className="mt-4 font-medium italic">No materials added to this course yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden min-h-[100px] items-center">
        <button 
          onClick={() => {
            setEditingCourseId(null);
            setCourseForm({
              title: '',
              thumbnail: '',
              classes: 0,
              isFree: true,
              originalPrice: 0,
              price: 0,
              categories: [],
              description: ''
            });
            setIsAddingCourse(true);
          }}
          className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-8 py-3.5 rounded-xl hover:bg-[#28a428] transition-all font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] z-10"
        >
          <Plus size={20} className="stroke-[3]" /> Add Course
        </button>
      </div>

      <ContentModal 
        isOpen={isAddingCourse} 
        onClose={() => setIsAddingCourse(false)} 
        title="Create Course" 
        type="course"
        loading={loading}
        handleCreateContent={handleCreateContent}
        handleCreateCourse={handleCreateCourse}
        contentForm={contentForm}
        setContentForm={setContentForm}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        SEMESTERS={SEMESTERS}
      />

      {/* Preview Modal */}
      {isPreviewModalOpen && previewContent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl overflow-hidden border border-black/10 transition-all font-sans"
          >
            <div className="p-4 border-b border-black/10 flex justify-between items-center bg-gray-50 dark:bg-black/20">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 capitalize">
                {previewContent.type === 'video' ? <Video size={20} className="text-red-500" /> : <FileText size={20} className="text-orange-500" />}
                {previewContent.type} Preview
              </h3>
              <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
               <div className="flex gap-4 mb-6">
                 <div className="flex-1 bg-blue-600 text-white font-bold px-4 py-2 rounded shadow-sm text-sm">
                   Title: {previewContent.title}
                 </div>
                 {previewContent.type === 'video' && (
                   <div className="flex-1 bg-blue-600 text-white font-bold px-4 py-2 rounded shadow-sm text-sm capitalize">
                     Source: {previewContent.source}
                   </div>
                 )}
               </div>

               <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-black/10">
                  <iframe 
                    src={getEmbedUrl(previewContent.url, previewContent.source)}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={previewContent.title}
                  />
               </div>

               <div className="flex justify-end mt-6">
                  <button 
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="bg-red-500 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Close
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {courses.map(course => (
          <GlassmorphicCard 
            key={course.id} 
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all border-2 gap-4" 
            onClick={() => setSelectedCourse(course)}
          >
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform shrink-0">
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-[var(--text)] text-sm sm:text-lg line-clamp-1">{course.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {course.categories?.map((cat: string) => (
                    <span key={cat} className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat}</span>
                  ))}
                  <span className="text-[10px] text-gray-300 hidden sm:inline">•</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{course.classes_count} Modules</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5">
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[8px] sm:text-[10px] uppercase font-black text-gray-400 tracking-tighter">Investment</span>
                {course.is_free ? (
                  <span className="text-[11px] sm:text-sm font-black text-green-500 uppercase">Free</span>
                ) : (
                  <span className="text-[11px] sm:text-sm font-black text-[var(--primary)] tracking-tighter">৳{course.price}</span>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0 flex-wrap justify-end">
                {course.pinned_position ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUnpinCourse(course.id); }}
                    className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-widest hover:bg-yellow-500 hover:text-white transition-all border border-yellow-500/20"
                    title={`Pinned at position ${course.pinned_position}`}
                  >
                    <PinOff size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Unpin</span> ({course.pinned_position})
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setCourseToPin(course);
                      setIsPinModalOpen(true);
                    }}
                    className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-600/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                    title="Pin Course"
                  >
                    <Pin size={18} className="hidden sm:block" />
                    <span className="sm:hidden">Pin</span>
                  </button>
                )}
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const url = `${window.location.origin}/course/${course.id}`;
                    navigator.clipboard.writeText(url);
                    alert('কোর্স লিঙ্ক কপি করা হয়েছে!');
                  }}
                  className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                  title="Copy Link"
                >
                  <Plus size={18} className="hidden sm:block rotate-45" />
                  <span className="sm:hidden">Link</span>
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/course/${course.id}/users`);
                  }}
                  className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                  title="Manage Users"
                >
                  <Users size={18} className="hidden sm:block" />
                  <span className="sm:hidden">Users</span>
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(course);
                    fetchContents(course.id).then(setCourseContents);
                  }}
                  className="flex items-center gap-1 sm:gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all whitespace-nowrap"
                >
                  Studio
                  <ChevronLeft size={12} className="rotate-180 sm:w-3.5 sm:h-3.5" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setEditingCourseId(course.id);
                    const metaMatch = course.description?.match(/\[meta:fake_user_count:(\d+)\]/);
                    const cleanDesc = course.description?.replace(/\[meta:fake_user_count:\d+\]/, '').trim();

                    setCourseForm({
                      title: course.title,
                      thumbnail: course.thumbnail_url,
                      isFree: course.is_free,
                      originalPrice: course.original_price || 0,
                      price: course.price || 0,
                      categories: course.categories || [],
                      description: cleanDesc || '',
                      fakeUserCount: metaMatch ? parseInt(metaMatch[1]) : 0
                    });
                    setIsAddingCourse(true);
                  }}
                  className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                  title="Edit"
                >
                  <Edit2 size={18} className="hidden sm:block" />
                  <span className="sm:hidden">Edit</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                  className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                  title="Delete"
                >
                  <Trash2 size={18} className="hidden sm:block" />
                  <span className="sm:hidden">Del</span>
                </button>
              </div>
            </div>
          </GlassmorphicCard>
        ))}
        {courses.length === 0 && !isAddingCourse && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
             <Plus size={64} strokeWidth={1} className="text-[var(--primary)] animate-pulse" />
             <p className="mt-4 font-black uppercase tracking-widest text-sm">Launch Pad Static. Awaiting Course Deployment.</p>
          </div>
        )}
      </div>
      
      {/* Pin Modal */}
      {isPinModalOpen && courseToPin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] shadow-xl rounded-xl border border-black/10 p-6"
          >
            <h3 className="text-xl font-bold dark:text-white mb-4">Pin Course</h3>
            <p className="text-sm text-gray-500 mb-6">Select a serial number from 1 to 10 to pin "{courseToPin.title}" on the home page.</p>
            
            <form onSubmit={handlePinCourse}>
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Serial Number</label>
                <select 
                  value={pinPosition}
                  onChange={(e) => setPinPosition(Number(e.target.value))}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-gray-700 dark:text-white text-lg font-bold"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="submit" className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-md hover:bg-yellow-600 transition-colors">
                  Pin Course
                </button>
                <button type="button" onClick={() => setIsPinModalOpen(false)} className="bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-white font-medium py-2 px-6 rounded-md hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
