import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Eye, Video, FileText, ChevronLeft, Save, X, Paperclip, Pin, PinOff, Users } from 'lucide-react';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import { supabase } from '../../lib/supabase';
import { getDirectLink, getEmbedUrl } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminPdfs() {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Pdf Form State
  const [isAddingPdf, setIsAddingPdf] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [pdfForm, setPdfForm] = useState({
    type: 'pdf',
    title: '',
    thumbnail: '',
    pdfLink: '',
    affiliateLink: '',
    isFree: true,
    originalPrice: 0,
    price: 0,
    categories: [] as string[],
    description: '',
    fakeUserCount: 0
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contentDeleteConfirmId, setContentDeleteConfirmId] = useState<string | null>(null);

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

  const [pdfContents, setPdfContents] = useState<any[]>([]);
  
  

  const fetchContents = async (pdfId: string) => {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', pdfId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching contents:', error);
      return [];
    }
    return data || [];
  };

  // Pin State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pdfToPin, setPdfToPin] = useState<any>(null);
  const [pinPosition, setPinPosition] = useState<number>(1);
  const [pinnedPdfsMap, setPinnedPdfsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    setLoading(true);
    
    // 1. Fetch pinned map
    const { data: pinnedData } = await supabase.from('site_settings').select('value').eq('key', 'pinned_pdfs').maybeSingle();
    let pMap = {};
    if (pinnedData && pinnedData.value) {
      try {
        pMap = JSON.parse(pinnedData.value);
        setPinnedPdfsMap(pMap);
      } catch(e) {}
    }

    // 2. Fetch pdfs
    const { data: pdfData, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pdfs:', error);
    } else {
      // Filter for books only
      const filtered = (pdfData || []).filter((c: any) => 
        c.categories?.includes("বই") || c.categories?.includes("Book") || c.title?.includes("বই")
      );
      setPdfs(filtered.map((c: any) => ({...c, pinned_position: (pMap as any)[c.id] || null})));
    }
    setLoading(false);
  };

  const handlePinPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfToPin) return;

    // Build new map and clean up deleted books
    const newMap: Record<string, number> = {};
    for (const [id, position] of Object.entries(pinnedPdfsMap)) {
      if (pdfs.some(c => c.id === id) || id === pdfToPin.id) {
        newMap[id] = position as number;
      }
    }
    
    // Check if position physically taken
    for (const id in newMap) {
       if (newMap[id] === pinPosition && id !== pdfToPin.id) {
         alert(`এই নম্বরটিতে বর্তমানে অন্য কোর্স পিন করা আছে।`);
         return;
       }
    }

    newMap[pdfToPin.id] = pinPosition;

    try {
      const { error } = await supabase.from('site_settings').upsert(
        { key: 'pinned_pdfs', value: JSON.stringify(newMap) },
        { onConflict: 'key' }
      );
      if (error) throw error;

      setPinnedPdfsMap(newMap);
      setPdfs(pdfs.map(c => c.id === pdfToPin.id ? { ...c, pinned_position: pinPosition } : c));
      setIsPinModalOpen(false);
      setPdfToPin(null);
      fetchPdfs(); // Refetch to ensure state sync
    } catch (err: any) {
      alert('Error pinning book');
    }
  };

  const handleUnpinPdf = async (pdfId: string) => {
    const newMap = { ...pinnedPdfsMap };
    delete newMap[pdfId];

    try {
      const { error } = await supabase.from('site_settings').upsert(
        { key: 'pinned_pdfs', value: JSON.stringify(newMap) },
        { onConflict: 'key' }
      );
      if (error) throw error;
      
      setPinnedPdfsMap(newMap);
      setPdfs(pdfs.map(c => c.id === pdfId ? { ...c, pinned_position: null } : c));
      fetchPdfs(); // Refetch to ensure state sync
    } catch(e) {}
  };

  const handleCreatePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanDesc = pdfForm.description ? pdfForm.description.replace(/\[meta:[^\]]+\]/g, '').trim() : '';
    const fakeNum = parseInt(String(pdfForm.fakeUserCount || '0'));
    const metaString = (!isNaN(fakeNum) && fakeNum > 0) ? `\n\n[meta:fake_user_count:${fakeNum}]` : '';
    const affiliateString = pdfForm.type === 'affiliate' ? `\n[meta:affiliate_link:${pdfForm.affiliateLink}]` : '';
    const readNowString = pdfForm.type === 'ebook' ? `\n[meta:read_now_link:${pdfForm.pdfLink}]` : '';
    
    const categories = ['বই'];
    if (pdfForm.type === 'ebook') categories.push('ebook');
    else if (pdfForm.type === 'pdf') categories.push('pdf');
    else if (pdfForm.type === 'affiliate') categories.push('affiliate');

    const pdfData = {
      title: pdfForm.title,
      thumbnail_url: pdfForm.thumbnail,
      is_free: pdfForm.type === 'ebook' ? true : pdfForm.isFree,
      original_price: pdfForm.type === 'ebook' ? 0 : pdfForm.originalPrice,
      price: pdfForm.type === 'ebook' ? 0 : pdfForm.price,
      categories: categories,
      description: cleanDesc + metaString + affiliateString + readNowString
    };

    let savedCourseId = editingPdfId;

    if (editingPdfId) {
      const { error } = await supabase
        .from('courses')
        .update(pdfData)
        .eq('id', editingPdfId);

      if (error) {
        console.error('Error updating book:', error);
        alert('Error updating book.');
        setLoading(false);
        return;
      } else {
        setPdfs(prev => prev.map(c => c.id === editingPdfId ? { ...c, ...pdfData } : c));
      }
    } else {
      const { data, error } = await supabase
        .from('courses')
        .insert([pdfData])
        .select();

      if (error || !data) {
        console.error('Error creating book:', error);
        alert('Error creating book.');
        setLoading(false);
        return;
      } else {
        savedCourseId = data[0].id;
        setPdfs(prev => [data[0], ...prev]);
      }
    }

    if (savedCourseId && pdfForm.type === 'pdf' && pdfForm.pdfLink) {
      // Manage PDF content link
      const { data: existingContent } = await supabase.from('course_content').select('id').eq('course_id', savedCourseId).eq('type', 'pdf').maybeSingle();
      
      if (existingContent) {
         await supabase.from('course_content').update({ url: pdfForm.pdfLink, title: pdfForm.title }).eq('id', existingContent.id);
      } else {
         await supabase.from('course_content').insert({
            course_id: savedCourseId,
            title: pdfForm.title,
            type: 'pdf',
            url: pdfForm.pdfLink,
            available_from: new Date().toISOString(),
            is_paid: !pdfForm.isFree
         });
      }
    } else if (savedCourseId && pdfForm.type === 'affiliate') {
      // For affiliate, we might want to clean up existing pdf links if it was changed from pdf to affiliate
      await supabase.from('course_content').delete().eq('course_id', savedCourseId).eq('type', 'pdf');
    }

    setIsAddingPdf(false);
    setEditingPdfId(null);
    setPdfForm({ type: 'pdf', title: '', thumbnail: '', pdfLink: '', affiliateLink: '', isFree: true, originalPrice: 0, price: 0, categories: [], description: '', fakeUserCount: 0 });
    setLoading(false);
  };

  const handleDeletePdf = async (id: string) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete book");
      }
      
      setPdfs(prev => prev.filter(c => c.id !== id));
      if (selectedPdf?.id === id) setSelectedPdf(null);
    } catch (error) {
      console.error('Error deleting pdf:', error);
      alert('বইটি ডিলিট করা যাচ্ছে না। সম্ভবত ডাটাবেস এর কোনো সীমাবদ্ধতা আছে।');
    } finally {
      setLoading(false);
    }
  };

  const updatePdfClassCount = async (pdfId: string) => {
    const { data: contents } = await supabase
      .from('course_content')
      .select('type')
      .eq('course_id', pdfId)
      .eq('type', 'video');
    
    const count = contents?.length || 0;
    
    await supabase
      .from('courses')
      .update({ classes_count: count })
      .eq('id', pdfId);
    
    // Refresh pdfs list to show updated count
    fetchPdfs();
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdf) return;
    setLoading(true);
    
    const contentData = {
      course_id: selectedPdf.id,
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
        setPdfContents(prev => prev.map(c => c.id === editingContentId ? { ...c, ...contentData } : c));
        if (contentData.type === 'video') await updatePdfClassCount(selectedPdf.id);
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
        setPdfContents(prev => [...prev, data[0]]);
        if (contentData.type === 'video') await updatePdfClassCount(selectedPdf.id);
        setIsAddingContent(false);
        setContentForm({ type: 'video', title: '', available_from: new Date().toISOString().slice(0, 16), is_paid: true, source: 'youtube', url: '', download_link: '', description: '' });
      }
    }
    setLoading(false);
  };

  const handleDeleteContent = async (id: string) => {
    const contentToDelete = pdfContents.find(c => c.id === id);
    const { error } = await supabase
      .from('course_content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
    } else {
      setPdfContents(prev => prev.filter(c => c.id !== id));
      if (contentToDelete?.type === 'video') await updatePdfClassCount(selectedPdf.id);
    }
  };

  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden min-h-[100px] items-center">
        <button 
          onClick={() => {
            setEditingPdfId(null);
            setPdfForm({
              type: 'pdf',
              title: '',
              thumbnail: '',
              pdfLink: '',
              affiliateLink: '',
              isFree: true,
              originalPrice: 0,
              price: 0,
              categories: ['বই'],
              description: '',
              fakeUserCount: 0
            });
            setIsAddingPdf(true);
          }}
          className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-8 py-3.5 rounded-xl hover:bg-[#28a428] transition-all font-bold shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] z-10"
        >
          <Plus size={20} className="stroke-[3]" /> Add Book
        </button>
      </div>

      

      

      
      {isAddingPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-lg overflow-hidden border border-black/10 transition-all font-sans"
          >
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="text-xl font-medium text-gray-800 dark:text-white">{editingPdfId ? 'Edit Book' : 'Add Book'}</h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[85vh] custom-scrollbar">
              <form onSubmit={handleCreatePdf} className="flex flex-col gap-6">
                 <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all">Book Type*</label>
                    <select 
                      required
                      value={pdfForm.type}
                      onChange={(e) => setPdfForm({...pdfForm, type: e.target.value})}
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pdf" className="bg-white dark:bg-[#1a1a1a]">PDF Book</option>
                      <option value="affiliate" className="bg-white dark:bg-[#1a1a1a]">Affiliate Book</option>
                      <option value="ebook" className="bg-white dark:bg-[#1a1a1a]">E-Book</option>
                    </select>
                  </div>

                 <div className="relative pt-2">
                    <div className="flex justify-between items-center absolute -top-1.5 left-3 right-3 z-10 pointer-events-none">
                      <label className="bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase transition-all pointer-events-auto">Book Title*</label>
                      <span className="bg-white dark:bg-[#1a1a1a] px-1 text-[10px] font-bold text-blue-500 transition-all pointer-events-auto">{pdfForm.title.length} characters</span>
                    </div>
                    <input 
                      required
                      type="text" 
                      value={pdfForm.title || ""}
                      onChange={(e) => setPdfForm({...pdfForm, title: e.target.value})}
                      placeholder="Book Title*"
                      maxLength={50}
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
                        value={pdfForm.thumbnail || ""}
                        onChange={(e) => setPdfForm({...pdfForm, thumbnail: e.target.value})}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 pl-10 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {pdfForm.type === 'pdf' && (
                  <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-[var(--primary)] uppercase z-10 transition-all">PDF Drive Link*</label>
                    <input 
                      required
                      type="url" 
                      value={pdfForm.pdfLink || ""}
                      onChange={(e) => setPdfForm({...pdfForm, pdfLink: e.target.value})}
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="w-full bg-transparent border-2 border-[var(--primary)]/50 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:border-[var(--primary)] shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    />
                  </div>
                  )}

                  {pdfForm.type === 'affiliate' && (
                  <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-[var(--primary)] uppercase z-10 transition-all">Affiliate Link*</label>
                    <input 
                      required
                      type="url" 
                      value={pdfForm.affiliateLink || ""}
                      onChange={(e) => setPdfForm({...pdfForm, affiliateLink: e.target.value})}
                      placeholder="https://rokomari.com/book/..."
                      className="w-full bg-transparent border-2 border-[var(--primary)]/50 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:border-[var(--primary)] shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    />
                  </div>
                  )}

                  {pdfForm.type === 'ebook' && (
                  <div className="relative pt-2">
                    <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-[var(--primary)] uppercase z-10 transition-all">Read Now Link*</label>
                    <input 
                      required
                      type="url" 
                      value={pdfForm.pdfLink || ""}
                      onChange={(e) => setPdfForm({...pdfForm, pdfLink: e.target.value})}
                      placeholder="e.g. your-ebook-url.com"
                      className="w-full bg-transparent border-2 border-[var(--primary)]/50 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:border-[var(--primary)] shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    />
                  </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {pdfForm.type !== 'ebook' && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Market Strategy</label>
                        <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${pdfForm.isFree ? 'border-green-500 bg-green-50/10' : 'border-gray-200 dark:border-white/5 opacity-50'}`}>
                          <input type="checkbox" className="sr-only" checked={pdfForm.isFree} onChange={(e) => setPdfForm({...pdfForm, isFree: e.target.checked})} />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${pdfForm.isFree ? 'bg-green-600 border-green-600' : 'border-gray-400'}`}>
                            {pdfForm.isFree && <Plus size={14} className="text-white rotate-45" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-tight">Mark as Free Book</span>
                            <span className="text-[10px] text-gray-400">Checking this puts the book in the Free category</span>
                          </div>
                        </label>
                      </div>
                    )}

                    {pdfForm.type !== 'ebook' && !pdfForm.isFree && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative pt-2">
                          <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 tracking-widest">Market Value</label>
                          <input type="number" value={pdfForm.originalPrice} onChange={(e) => setPdfForm({...pdfForm, originalPrice: parseInt(e.target.value) || 0})} className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="relative pt-2">
                          <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 tracking-widest">Your Price</label>
                          <input type="number" value={pdfForm.price} onChange={(e) => setPdfForm({...pdfForm, price: parseInt(e.target.value) || 0})} className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Book Description</label>
                    <textarea 
                      rows={4}
                      value={pdfForm.description || ""}
                      onChange={(e) => setPdfForm({...pdfForm, description: e.target.value})}
                      placeholder="Brief description of the book..."
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {pdfForm.type !== 'ebook' && (
                    <div className="flex flex-col gap-3">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fake User Count</label>
                      <input 
                        type="number" 
                        value={pdfForm.fakeUserCount} 
                        onChange={(e) => setPdfForm({...pdfForm, fakeUserCount: parseInt(e.target.value) || 0})} 
                        placeholder="e.g. 500"
                        className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button type="submit" disabled={loading} className="bg-[#32CD32] text-white font-medium py-2 px-6 rounded-md hover:bg-[#28a428] transition-colors disabled:opacity-50">
                      {loading ? 'Submitting...' : 'Submit'}
                    </button>
                    <button type="button" onClick={() => setIsAddingPdf(false)} className="bg-[#ff4d4f] text-white font-medium py-2 px-6 rounded-md hover:bg-[#d9363e] transition-colors">
                      Close
                    </button>
                  </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {pdfs.map(pdf => (
          <GlassmorphicCard 
            key={pdf.id} 
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all border-2 gap-4" 
            onClick={() => setSelectedPdf(pdf)}
          >
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 dark:bg-white/5 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-[var(--text)] text-sm sm:text-lg line-clamp-1">{pdf.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {pdf.categories?.map((cat: string) => (
                    <span key={cat} className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5">
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[8px] sm:text-[10px] uppercase font-black text-gray-400 tracking-tighter">Investment</span>
                {pdf.is_free ? (
                  <span className="text-[11px] sm:text-sm font-black text-green-500 uppercase">Free</span>
                ) : (
                  <span className="text-[11px] sm:text-sm font-black text-[var(--primary)] tracking-tighter">৳{pdf.price}</span>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0 flex-wrap justify-end">
                {pdf.pinned_position ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUnpinPdf(pdf.id); }}
                    className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-widest hover:bg-yellow-500 hover:text-white transition-all border border-yellow-500/20"
                    title={`Pinned at position ${pdf.pinned_position}`}
                  >
                    <PinOff size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Unpin</span> ({pdf.pinned_position})
                  </button>
                ) : (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setPdfToPin(pdf);
                      setIsPinModalOpen(true);
                    }}
                    className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-600/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                    title="Pin Book"
                  >
                    <Pin size={18} className="hidden sm:block" />
                    <span className="sm:hidden">Pin</span>
                  </button>
                )}
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const url = `${window.location.origin}/pdf/${pdf.id}`;
                    navigator.clipboard.writeText(url);
                    alert('কোর্স লিঙ্ক কপি করা হয়েছে!');
                  }}
                  className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                  title="Copy Link"
                >
                  <Plus size={18} className="hidden sm:block rotate-45" />
                  <span className="sm:hidden">Link</span>
                </button>

                {(!pdf.categories?.includes('affiliate') && !pdf.categories?.includes('ebook') && !pdf.description?.includes('[meta:affiliate_link:') && !pdf.description?.includes('[meta:read_now_link:')) && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/course/${pdf.id}/users?tab=pdf`);
                    }}
                    className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                    title="Manage Users"
                  >
                    <Users size={18} className="hidden sm:block" />
                    <span className="sm:hidden">Users</span>
                  </button>
                )}

                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setEditingPdfId(pdf.id);
                    const metaMatch = pdf.description?.match(/\[meta:fake_user_count:(\d+)\]/);
                    const affiliateMatch = pdf.description?.match(/\[meta:affiliate_link:([^\]]+)\]/);
                    const readNowMatch = pdf.description?.match(/\[meta:read_now_link:([^\]]+)\]/);
                    let cleanDesc = pdf.description ? pdf.description.replace(/\[meta:[^\]]+\]/g, '').trim() : '';

                    let bookType = 'pdf';
                    if (pdf.categories?.includes('ebook')) bookType = 'ebook';
                    else if (pdf.categories?.includes('affiliate')) bookType = 'affiliate';
                    else if (pdf.categories?.includes('pdf')) bookType = 'pdf';
                    else if (affiliateMatch) bookType = 'affiliate';

                    setPdfForm({
                      type: bookType,
                      title: pdf.title || '',
                      thumbnail: pdf.thumbnail_url || '',
                      pdfLink: readNowMatch ? readNowMatch[1] : '', 
                      affiliateLink: affiliateMatch ? affiliateMatch[1] : '',
                      isFree: pdf.is_free ?? true,
                      originalPrice: pdf.original_price || 0,
                      price: pdf.price || 0,
                      categories: pdf.categories || ['বই'],
                      description: cleanDesc,
                      fakeUserCount: metaMatch ? parseInt(metaMatch[1]) : 0
                    });

                    // Fetch existing pdf link if not already set by readNowMatch
                    if (!readNowMatch) {
                      supabase.from('course_content').select('url').eq('course_id', pdf.id).eq('type', 'pdf').maybeSingle().then(({data}) => {
                        if (data && data.url) {
                          setPdfForm(prev => ({...prev, pdfLink: data.url}));
                        }
                      });
                    }
  
                    setIsAddingPdf(true);
                  }}
                  className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                  title="Edit"
                >
                  <Edit2 size={18} className="hidden sm:block" />
                  <span className="sm:hidden">Edit</span>
                </button>
                {deleteConfirmId === pdf.id ? (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePdf(pdf.id); setDeleteConfirmId(null); }}
                      className="px-2 py-1.5 sm:p-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase"
                      title="Yes, delete"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                      className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase"
                      title="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(pdf.id); }}
                    className="px-2 py-1.5 sm:p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all text-[10px] sm:text-xs font-bold uppercase underline sm:no-underline"
                    title="Delete"
                  >
                    <Trash2 size={18} className="hidden sm:block" />
                    <span className="sm:hidden">Del</span>
                  </button>
                )}
              </div>
            </div>
          </GlassmorphicCard>
        ))}
        {pdfs.length === 0 && !isAddingPdf && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
             <Plus size={64} strokeWidth={1} className="text-[var(--primary)] animate-pulse" />
             <p className="mt-4 font-black uppercase tracking-widest text-sm">Launch Pad Static. Awaiting Book Deployment.</p>
          </div>
        )}
      </div>
      
      {/* Pin Modal */}
      {isPinModalOpen && pdfToPin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] shadow-xl rounded-xl border border-black/10 p-6"
          >
            <h3 className="text-xl font-bold dark:text-white mb-4">Pin Book</h3>
            <p className="text-sm text-gray-500 mb-6">Select a serial number from 1 to 10 to pin "{pdfToPin.title}" on the home page.</p>
            
            <form onSubmit={handlePinPdf}>
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Serial Number</label>
                <select 
                  value={pinPosition}
                  onChange={(e) => setPinPosition(Number(e.target.value))}
                  className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 text-gray-700 dark:text-white text-lg font-bold"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1} className="bg-white dark:bg-[#1a1a1a] text-black dark:text-white">{i+1}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="submit" className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-md hover:bg-yellow-600 transition-colors">
                  Pin Book
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
