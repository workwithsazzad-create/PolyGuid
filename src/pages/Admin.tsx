import React, { useState } from 'react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  UserPlus, 
  Image as ImageIcon, 
  DollarSign, 
  CheckCircle2, 
  FileText, 
  Youtube, 
  Upload,
  Layout,
  Settings,
  BookOpen,
  Heart,
  Check,
  X,
  Trash2
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

type AdminTab = 'courses' | 'banner' | 'analytics' | 'donations' | 'pdf' | 'youtube' | 'admins';

import AdminCourses from '../components/admin/AdminCourses';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [isPremium, setIsPremium] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Analytics Stats State
  const [stats, setStats] = useState({ courses: '150', students: '20000', polytechnics: '49' });
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsMsg, setStatsMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Donations State
  const [donationNumber, setDonationNumber] = useState('');
  const [donations, setDonations] = useState<any[]>([]);
  const [isSavingDonationNum, setIsSavingDonationNum] = useState(false);

  // Fetch settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['stat_courses', 'stat_students', 'stat_polytechnics', 'home_banner', 'donation_number']);
        
      if (data) {
        const newStats = { ...stats };
        data.forEach(item => {
          if (item.key === 'stat_courses') newStats.courses = item.value;
          if (item.key === 'stat_students') newStats.students = item.value;
          if (item.key === 'stat_polytechnics') newStats.polytechnics = item.value;
          if (item.key === 'home_banner') setBannerUrl(item.value);
          if (item.key === 'donation_number') setDonationNumber(item.value);
        });
        setStats(newStats);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Donations
  React.useEffect(() => {
    if (activeTab === 'donations') {
      const fetchDonations = async () => {
        const { data } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
        if (data) setDonations(data);
      };
      fetchDonations();
    }
  }, [activeTab]);

  const handleSaveDonationNumber = async () => {
    setIsSavingDonationNum(true);
    try {
      await supabase.from('site_settings').upsert({ key: 'donation_number', value: donationNumber }, { onConflict: 'key' });
      setStatusMsg({ type: 'success', text: '✅ Donation number updated!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: '❌ Failed to save donation number.' });
    } finally {
      setIsSavingDonationNum(false);
    }
  };

  const updateDonationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('donations').update({ status }).eq('id', id);
      if (error) throw error;
      setDonations(donations.map(d => d.id === id ? { ...d, status } : d));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const deleteDonation = async (id: string) => {
    // Removed window.confirm as it is blocked in the iframe
    try {
      const { error } = await supabase.from('donations').delete().eq('id', id);
      if (error) throw error;
      setDonations(donations.filter(d => d.id !== id));
    } catch (err: any) {
      console.error('Error deleting donation:', err);
      // alert is also blocked in iframe, so we just log it or use a toast.
      // For now, we'll just log it.
    }
  };

  const handleSaveStats = async () => {
    setStatsMsg(null);
    setIsSavingStats(true);
    try {
      const { error } = await supabase.from('site_settings').upsert([
        { key: 'stat_courses', value: stats.courses },
        { key: 'stat_students', value: stats.students },
        { key: 'stat_polytechnics', value: stats.polytechnics }
      ], { onConflict: 'key' });

      if (error) throw error;
      setStatsMsg({ type: 'success', text: '✅ Analytics stats updated successfully!' });
    } catch (err: any) {
      console.error('Failed to save stats:', err);
      setStatsMsg({ type: 'error', text: `❌ Failed to save stats. Error: ${err.message}` });
    } finally {
      setIsSavingStats(false);
    }
  };

  const handleBannerApply = async () => {
    setStatusMsg(null);
    if (!bannerUrl) {
      setStatusMsg({ type: 'error', text: 'Please provide a banner URL or upload an image first.' });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'home_banner', value: bannerUrl }, { onConflict: 'key' });
        
      if (error) {
        throw error;
      }
      setStatusMsg({ type: 'success', text: '✅ Banner successfully saved to database! Everyone can see it now.' });
    } catch (err: any) {
      console.error('Supabase save failed:', err);
      setStatusMsg({ type: 'error', text: `❌ Failed to save to database. Error: ${err.message || 'Unknown error'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMsg(null);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality to save space
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          
          setBannerUrl(base64String); // Just set preview, don't save yet
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMsg({ type: 'error', text: '❌ Image processing failed.' });
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'banner', label: 'Banner', icon: Layout },
    { id: 'analytics', label: 'Analytics', icon: FileText },
    { id: 'donations', label: 'Donations', icon: Heart },
    { id: 'pdf', label: 'PDFs', icon: FileText },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'admins', label: 'Admins', icon: UserPlus },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-12"
    >
      {/* Tab Navigation */}
      <div className="w-full relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar border-b border-black/10 dark:border-white/10 -mx-4 px-4 sm:-mx-0 sm:px-0 scroll-smooth touch-pan-x snap-x">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-start shrink-0 ${
                activeTab === tab.id 
                  ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/25 scale-100 sm:scale-105 z-10" 
                  : "text-gray-500 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'courses' && (
            <AdminCourses />
          )}

          {activeTab === 'banner' && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Layout className="text-orange-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">Edit Home Banner</h2>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Banner Image URL</label>
                    <span className="text-[10px] text-[var(--primary)] font-bold">Size: 1200 x 400 px</span>
                  </div>
                  <input 
                    type="url" 
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.png"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                </div>

                <div className="relative border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isUploading ? <Upload className="text-[var(--primary)] animate-bounce" size={20} /> : <Upload className="text-gray-400" size={20} />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {isUploading ? 'Processing Image...' : 'Upload Banner Image'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Select an image from your device</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    disabled={isUploading || isSaving}
                  />
                </div>

                {bannerUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <div className="relative aspect-[3/1] rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                      <img src={bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {statusMsg && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {statusMsg.text}
                  </div>
                )}

                <button 
                  onClick={handleBannerApply}
                  disabled={isSaving || isUploading || !bannerUrl}
                  className="w-full bg-[var(--primary)] text-black font-bold py-3 rounded-lg hover:bg-[#28a428] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving ? 'Saving to Database...' : 'Save Banner to Database'}
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === 'analytics' && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="text-purple-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">Edit Analytics Numbers</h2>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Courses</label>
                  <input 
                    type="number" 
                    value={stats.courses}
                    onChange={(e) => setStats({...stats, courses: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Students Joined</label>
                  <input 
                    type="number" 
                    value={stats.students}
                    onChange={(e) => setStats({...stats, students: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Polytechnics</label>
                  <input 
                    type="number" 
                    value={stats.polytechnics}
                    onChange={(e) => setStats({...stats, polytechnics: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                </div>

                {statsMsg && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${statsMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {statsMsg.text}
                  </div>
                )}

                <button 
                  onClick={handleSaveStats}
                  disabled={isSavingStats}
                  className="w-full bg-[var(--primary)] text-black font-bold py-3 rounded-lg hover:bg-[#28a428] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSavingStats ? 'Saving...' : 'Save Analytics Numbers'}
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === 'donations' && (
            <div className="flex flex-col gap-6">
              <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Heart className="text-red-500" size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Donation Settings</h2>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Donation Receive Number (bKash/Nagad/Rocket)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={donationNumber}
                      onChange={(e) => setDonationNumber(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                    />
                    <button 
                      onClick={handleSaveDonationNumber}
                      disabled={isSavingDonationNum}
                      className="bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold px-4 rounded-lg transition-all text-sm disabled:opacity-50"
                    >
                      {isSavingDonationNum ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {statusMsg && activeTab === 'donations' && (
                    <p className={`text-xs mt-1 ${statusMsg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{statusMsg.text}</p>
                  )}
                </div>
              </GlassmorphicCard>

              <GlassmorphicCard className="max-w-4xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-[var(--text)] mb-6">Donation Submissions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-black/5 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Name</th>
                        <th className="px-4 py-3">Polytechnic</th>
                        <th className="px-4 py-3">TrxID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">No donations found.</td>
                        </tr>
                      ) : (
                        donations.map((d) => (
                          <tr key={d.id} className="border-b border-black/5 dark:border-white/5 last:border-0">
                            <td className="px-4 py-3 font-medium text-[var(--text)]">{d.student_name}</td>
                            <td className="px-4 py-3">{d.polytechnic_name}</td>
                            <td className="px-4 py-3 font-mono text-xs">{d.transaction_id}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                d.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                d.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                'bg-yellow-500/10 text-yellow-500'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {d.status === 'pending' && (
                                  <>
                                    <button onClick={() => updateDonationStatus(d.id, 'approved')} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-md transition-colors" title="Approve">
                                      <Check size={16} />
                                    </button>
                                    <button onClick={() => updateDonationStatus(d.id, 'rejected')} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors" title="Reject">
                                      <X size={16} />
                                    </button>
                                  </>
                                )}
                                {(d.status === 'approved' || d.status === 'rejected') && (
                                  <button onClick={() => deleteDonation(d.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors" title="Delete">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassmorphicCard>
            </div>
          )}

          {activeTab === 'pdf' && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="text-red-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">Add PDF Book</h2>
              </div>
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                <p className="text-gray-500 text-sm">PDF Management coming soon...</p>
                <button className="mt-4 text-[var(--primary)] text-sm font-bold flex items-center gap-1">
                  <Plus size={16} /> Add First PDF
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === 'youtube' && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Youtube className="text-blue-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">Add YouTube Playlist</h2>
              </div>
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                <p className="text-gray-500 text-sm">YouTube Management coming soon...</p>
                <button className="mt-4 text-[var(--primary)] text-sm font-bold flex items-center gap-1">
                  <Plus size={16} /> Add First Playlist
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === 'admins' && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-blue-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">Manage Admins</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User Email</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="admin@example.com"
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                    />
                    <button className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text)] font-bold px-4 rounded-lg transition-all text-sm">
                      Grant
                    </button>
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
