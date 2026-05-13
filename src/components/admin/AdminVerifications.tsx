import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { 
  ShieldCheck, User, Phone, Check, X, 
  Loader2, Search, Plus, 
  BadgeCheck, Download, Eye,
  Trash2, Calendar, AlertTriangle
} from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';

export default function AdminVerifications() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
    type: 'approve' | 'reject' | 'delete';
  }>({
    show: false,
    title: '',
    message: '',
    action: () => {},
    type: 'approve'
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verification_applications')
        .select(`
          *,
          profiles:user_id (avatar_url, polytechnic_name, email, full_name, is_verified)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appId: string, userId: string, newStatus: 'approved' | 'rejected') => {
    setProcessing(appId);
    setConfirmModal(prev => ({ ...prev, show: false }));
    try {
      if (newStatus === 'approved') {
        const { error: appError } = await supabase
          .from('verification_applications')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', appId);
        
        if (appError) throw appError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', userId);
        
        if (profileError) throw profileError;
        alert("ভেরিফিকেশন সফলভাবে অ্যাপ্রুভ হয়েছে!");
      } else {
        // Find application to get file paths
        const app = applications.find(a => a.id === appId) || selectedApp;
        
        if (app) {
          // Delete files from storage
          try {
            const getFilePath = (url: string) => {
              if (!url) return null;
              const parts = url.split('/');
              return parts[parts.length - 1];
            };
            const frontFile = getFilePath(app.id_card_front_url);
            const backFile = getFilePath(app.id_card_back_url);
            
            const filesToRemove = [];
            if (frontFile) filesToRemove.push(frontFile);
            if (backFile) filesToRemove.push(backFile);

            if (filesToRemove.length > 0) {
              await supabase.storage.from('verifications').remove(filesToRemove);
            }
          } catch (storageErr) {
            console.error("Storage deletion error (non-fatal):", storageErr);
          }
        }

        // Delete the record
        const { error: delError } = await supabase
          .from('verification_applications')
          .delete()
          .eq('id', appId);
        
        if (delError) throw delError;

        // Ensure profile is not verified
        await supabase.from('profiles').update({ is_verified: false }).eq('id', userId);
        alert("আবেদনটি রিজেক্ট করা হয়েছে।");
      }

      setApplications(prev => prev.filter(app => app.id !== appId));
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Action error:", err);
      alert("Error: " + (err.message || "Something went wrong"));
    } finally {
      setProcessing(null);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const handleSearchUser = async () => {
    if (!searchPhone || searchPhone.length < 5) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('phone', `%${searchPhone}%`)
        .limit(5);
      
      if (error) throw error;
      setFoundUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const toggleManualVerification = async (userId: string, currentStatus: boolean) => {
    setProcessing(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      setFoundUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const filteredList = applications.filter(app => {
    if (!listSearch) return true;
    const search = listSearch.toLowerCase();
    return (
      app.full_name?.toLowerCase().includes(search) ||
      app.phone_number?.includes(search) ||
      app.profiles?.polytechnic_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <GlassmorphicCard className="p-6">
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#32CD32]/10 rounded-xl flex items-center justify-center text-[#32CD32]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Verification Management</h2>
                <p className="text-xs text-gray-500 font-medium">Verify user identity documents</p>
              </div>
           </div>
           <button 
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#32CD32] text-white rounded-xl shadow-lg shadow-[#32CD32]/20 active:scale-95 transition-all font-bold text-sm"
          >
            <Plus size={18} /> Manual Verify
          </button>
        </div>
      </GlassmorphicCard>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-fit">
          {(['pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-[#1a1a1a] text-[#32CD32] shadow-sm' : 'text-gray-500 hover:text-[var(--text)]'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
           <input 
             type="text" 
             placeholder="Search name or phone..."
             value={listSearch}
             onChange={e => setListSearch(e.target.value)}
             className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none text-[var(--text)] focus:ring-1 focus:ring-[#32CD32]"
           />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-[var(--text)]">
          <Loader2 className="w-8 h-8 text-[#32CD32] animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center space-y-4 opacity-40">
          <ShieldCheck size={64} className="mx-auto text-gray-400" strokeWidth={1} />
          <p className="font-bold text-gray-500">কোনো আবেদন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">User</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Apply Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredList.map((app) => (
                  <tr key={app.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden flex-shrink-0">
                          {app.profiles?.avatar_url ? <img src={app.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="text-gray-400 m-2" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text)]">{app.full_name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{app.profiles?.polytechnic_name || 'Student'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-400">{app.phone_number}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-1.5 text-gray-400">
                         <Calendar size={12} />
                         <span className="text-xs font-bold">{new Date(app.created_at).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="p-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg hover:text-[#32CD32] transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {filter === 'pending' && (
                          <>
                            <button 
                              onClick={() => {
                                setConfirmModal({
                                  show: true,
                                  type: 'approve',
                                  title: 'Confirm Approval',
                                  message: `Are you sure you want to verify ${app.full_name}?`,
                                  action: () => handleAction(app.id, app.user_id, 'approved')
                                });
                              }}
                              disabled={processing === app.id}
                              className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              {processing === app.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button 
                              onClick={() => {
                                setConfirmModal({
                                  show: true,
                                  type: 'reject',
                                  title: 'Confirm Rejection',
                                  message: `Are you sure you want to reject and delete the application for ${app.full_name}?`,
                                  action: () => handleAction(app.id, app.user_id, 'rejected')
                                });
                              }}
                              disabled={processing === app.id}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              {processing === app.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                            </button>
                          </>
                        )}

                        {filter !== 'pending' && (
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                show: true,
                                type: 'delete',
                                title: 'Confirm Deletion',
                                message: `Are you sure you want to delete this record for ${app.full_name}?`,
                                action: () => handleAction(app.id, app.user_id, 'rejected')
                              });
                            }}
                            disabled={processing === app.id}
                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setSelectedApp(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-[32px] p-6 sm:p-8 shadow-2xl border border-black/5 dark:border-white/10 overflow-y-auto max-h-[90vh]"
            >
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#32CD32]/10 flex items-center justify-center text-[#32CD32]">
                      <BadgeCheck size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text)] leading-tight">Verification Application</h2>
                      <p className="text-sm font-bold text-gray-500  mt-0.5">Review user credentials</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[var(--text)] transition-colors"><X size={24} /></button>
               </div>

               <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-black/5">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] opacity-70">User Name</p>
                        <p className="text-lg font-black text-[var(--text)]">{selectedApp.full_name}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] opacity-70">Phone Number</p>
                        <p className="text-lg font-black text-[var(--text)]">{selectedApp.phone_number}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] opacity-70">Polytechnic</p>
                        <p className="text-lg font-black text-[var(--text)]">{selectedApp.profiles?.polytechnic_name || 'Not provided'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] opacity-70">Applied Date</p>
                        <p className="text-lg font-black text-[var(--text)]">{new Date(selectedApp.created_at).toLocaleDateString()} at {new Date(selectedApp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Identification Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-500">ID Card (Front)</span>
                            <button 
                              onClick={() => downloadImage(selectedApp.id_card_front_url, `${selectedApp.full_name}_front.jpg`)}
                              className="text-[10px] font-black text-[#32CD32] hover:underline flex items-center gap-1"
                            >
                              <Download size={12} /> DOWNLOAD
                            </button>
                          </div>
                          <a href={selectedApp.id_card_front_url} target="_blank" rel="noreferrer" className="block aspect-[1.6/1] bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden border border-black/5 cursor-zoom-in">
                            <img src={selectedApp.id_card_front_url} className="w-full h-full object-cover" alt="Front" />
                          </a>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-500">ID Card (Back)</span>
                            <button 
                              onClick={() => downloadImage(selectedApp.id_card_back_url, `${selectedApp.full_name}_back.jpg`)}
                              className="text-[10px] font-black text-[#32CD32] hover:underline flex items-center gap-1"
                            >
                              <Download size={12} /> DOWNLOAD
                            </button>
                          </div>
                          <a href={selectedApp.id_card_back_url} target="_blank" rel="noreferrer" className="block aspect-[1.6/1] bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden border border-black/5 cursor-zoom-in">
                            <img src={selectedApp.id_card_back_url} className="w-full h-full object-cover" alt="Back" />
                          </a>
                        </div>
                    </div>
                  </div>

                  {selectedApp.status === 'pending' && (
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            show: true,
                            type: 'approve',
                            title: 'Confirm Approval',
                            message: `Are you sure you want to verify ${selectedApp.full_name}?`,
                            action: () => handleAction(selectedApp.id, selectedApp.user_id, 'approved')
                          });
                        }}
                        disabled={processing === selectedApp.id}
                        className="flex-1 py-5 bg-[#32CD32] text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-[#32CD32]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {processing === selectedApp.id ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />} Approve Verification
                      </button>
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            show: true,
                            type: 'reject',
                            title: 'Confirm Rejection',
                            message: `Are you sure you want to reject ${selectedApp.full_name}?`,
                            action: () => handleAction(selectedApp.id, selectedApp.user_id, 'rejected')
                          });
                        }}
                        disabled={processing === selectedApp.id}
                        className="px-8 py-5 border-2 border-red-500/20 text-red-500 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                      >
                        {processing === selectedApp.id ? <Loader2 className="animate-spin" size={24} /> : <Trash2 size={24} />}
                      </button>
                    </div>
                  )}
                  
                  {selectedApp.status !== 'pending' && (
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                      <p className="text-sm font-black text-gray-500 uppercase tracking-widest">
                        Status: <span className={selectedApp.status === 'approved' ? 'text-green-500' : 'text-red-500'}>{selectedApp.status}</span>
                      </p>
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-[32px] p-8 shadow-2xl border border-black/5"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${
                confirmModal.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-[var(--text)] text-center mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 text-center text-sm font-medium mb-8 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmModal.action}
                  className={`w-full py-4 rounded-2xl font-black transition-all active:scale-95 ${
                    confirmModal.type === 'approve' 
                      ? 'bg-[#32CD32] text-white shadow-lg shadow-[#32CD32]/20' 
                      : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  }`}
                >
                  Confirm Action
                </button>
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-2xl font-black active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Verification Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowManualModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-[32px] p-6 sm:p-8 shadow-2xl border border-black/5 dark:border-white/10"
          >
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[var(--text)] ">Manual Verify User</h2>
                <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text)]"><X size={20} /></button>
             </div>

             <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="tel"
                    placeholder="Search by phone number..."
                    value={searchPhone}
                    onChange={e => setSearchPhone(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 pr-12 text-sm font-medium focus:ring-2 focus:ring-[#32CD32] outline-none text-[var(--text)]"
                  />
                  <button 
                    onClick={handleSearchUser}
                    disabled={searching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#32CD32] text-white rounded-xl active:scale-90 transition-all"
                  >
                    {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {foundUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-black/5 overflow-hidden">
                           {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={18} className="text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[var(--text)]  leading-none mb-1">{user.full_name || 'No Name'}</p>
                          <p className="text-[10px] font-bold text-gray-500 ">{user.phone}</p>
                        </div>
                      </div>
                      <button 
                         onClick={() => toggleManualVerification(user.id, user.is_verified)}
                         disabled={processing === user.id}
                         className={`p-2 rounded-xl transition-all ${user.is_verified ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}
                      >
                         {processing === user.id ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                      </button>
                    </div>
                  ))}
                  {foundUsers.length === 0 && !searching && searchPhone && (
                    <p className="text-center py-4 text-xs font-bold text-gray-400 ">No users found</p>
                  )}
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
