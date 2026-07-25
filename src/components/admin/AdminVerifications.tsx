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

  const handleAction = async (appId: string, userId: string, actionType: 'approved' | 'rejected' | 'delete') => {
    setProcessing(appId);
    setConfirmModal(prev => ({ ...prev, show: false }));
    try {
      if (actionType === 'approved') {
        // First update the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', userId);
        
        if (profileError) {
          console.error("Profile update error:", profileError);
          // If it's a permission error, guide the user
          const errorMsg = profileError.code === '42501' ? "SQL Permission Error: Supabase SQL Editor এ গিয়ে রুলস আপডেট করুন।" : profileError.message;
          throw new Error(`Profile update failed: ${errorMsg}`);
        }

        // Then update the application status
        const { error: appError } = await supabase
          .from('verification_applications')
          .update({ status: 'approved' })
          .eq('id', appId);
        
        if (appError) throw appError;

        // Send verification approved notification
        const { error: notifError } = await supabase.from('notifications').insert([{
          user_id: userId,
          title: 'Account Verified! ✅',
          body: 'অভিনন্দন! আপনার অ্যাকাউন্টের ভেরিফিকেশন সফল হয়েছে। এখন আপনার নামের পাশে ব্লু-ব্যাজ দেখা যাবে। PolyGuid এর সাথে থাকার জন্য ধন্যবাদ!',
          type: 'verification_approved'
        }]);

        if (notifError) console.error("Notification Error:", notifError);

        alert("ভেরিফিকেশন সফলভাবে অ্যাপ্রুভ হয়েছে!");
      } else if (actionType === 'rejected') {
        const { error: appError } = await supabase
          .from('verification_applications')
          .update({ status: 'rejected' })
          .eq('id', appId);
        
        if (appError) throw appError;

        // Ensure profile is not verified
        await supabase.from('profiles').update({ is_verified: false }).eq('id', userId);
        alert("আবেদনটি রিজেক্ট করা হয়েছে।");
      } else if (actionType === 'delete') {
        // Find application to get file paths for storage cleanup
        const app = applications.find(a => a.id === appId) || selectedApp;
        
        if (app) {
          // If we are deleting an APPROVED application, we should probably revoke the badge
          // as per "delete kori tar blue badges jeno chole jay"
          if (app.status === 'approved') {
            await supabase.from('profiles').update({ is_verified: false }).eq('id', app.user_id);
          }

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
            console.error("Storage deletion error:", storageErr);
          }
        }

        const { error: delError } = await supabase
          .from('verification_applications')
          .delete()
          .eq('id', appId);
        
        if (delError) throw delError;
        alert("রেকর্ডটি ডিলিট করা হয়েছে।");
      }

      setApplications(prev => prev.filter(app => app.id !== appId));
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Action error detail:", err);
      alert(`${actionType === 'approved' ? 'অ্যাপ্রুভ' : 'অ্যাকশন'} করতে সমস্যা হয়েছে: ${err.message || "Unknown Error"}. অ্যাডমিন পারমিশন চেক করুন।`);
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

  const [selectedManualUser, setSelectedManualUser] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (showManualModal) {
      handleSearchUser();
      setSelectedManualUser(null);
      setShowSuggestions(false);
    }
  }, [showManualModal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchPhone.length >= 3) {
        handleSearchUser();
        setShowSuggestions(true);
      } else if (searchPhone.length === 0) {
        setFoundUsers([]);
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchPhone]);

  const handleSearchUser = async () => {
    if (!searchPhone || searchPhone.trim() === '') {
      setFoundUsers([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.ilike.%${searchPhone}%,full_name.ilike.%${searchPhone}%`)
        .limit(15);
      
      if (error) throw error;
      setFoundUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleManualVerify = async (user: any) => {
    const userId = user.id;
    setProcessing(userId);
    try {
      // Always set to verified for this action if not already
      const newStatus = !user.is_verified;

      // 1. Update Profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: newStatus })
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // 2. Sync with verification_applications
      if (newStatus) {
        // If we are VERIFYING
        const { data: existingApp } = await supabase
          .from('verification_applications')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingApp) {
          await supabase
            .from('verification_applications')
            .update({ 
               status: 'approved', 
               full_name: user.full_name || 'Manual Verified' 
            })
            .eq('id', existingApp.id);
        } else {
          await supabase
            .from('verification_applications')
            .insert({
              user_id: userId,
              status: 'approved',
              full_name: user.full_name || 'Manual Verified',
              phone_number: user.phone || '',
              id_card_front_url: 'manual',
              id_card_back_url: 'manual'
            });
        }
        
        await supabase.from('notifications').insert([{
          user_id: userId,
          title: 'Account Verified! ✅',
          body: 'অভিনন্দন! আপনার অ্যাকাউন্টের ভেরিফিকেশন সফল হয়েছে। এখন আপনার নামের পাশে ব্লু-ব্যাজ দেখা যাবে। PolyGuid এর সাথে থাকার জন্য ধন্যবাদ!',
          type: 'verification_approved'
        }]);
        
        alert("ইউজার সফলভাবে ভেরিফাই করা হয়েছে!");
      } else {
        // If we are REVOKING
        await supabase
          .from('verification_applications')
          .update({ status: 'rejected' })
          .eq('user_id', userId);
        alert("ভেরিফিকেশন রিলিজ করা হয়েছে!");
      }
      
      // Update UI state
      setFoundUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: newStatus } : u));
      fetchApplications();
      setShowManualModal(false);
      setSelectedManualUser(null);
      setSearchPhone('');
    } catch (err: any) {
      console.error("Manual Verify Error Detail:", err);
      if (err.code === '42501') {
        alert("SQL Permission Error: আপনার Supabase Dashboard > SQL Editor এ গিয়ে এডমিন পারমিশন SQL কোডটি রান করুন।");
      } else {
        alert(`অ্যাকশন টি সফল হয়নি: ${err.message || "Unknown error"}`);
      }
    } finally {
      setProcessing(null);
    }
  };

  const revokeBadgeAction = async (userId: string) => {
    if (!window.confirm("আপনি কি এই ইউজার এর ব্লু ব্যাজ ডিলিট করতে চান?")) return;
    setProcessing(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId);
      if (error) throw error;
      setFoundUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: false } : u));
    } catch (e: any) {
      alert("Failed to revoke: " + e.message);
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
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-bold text-[var(--text)]">{app.full_name}</p>
                            {(app.profiles?.is_verified || app.profiles?.role === 'admin') && <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-4 h-4 shrink-0" size={14} />}
                          </div>
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
                                  message: `Are you sure you want to reject the application for ${app.full_name}?`,
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
                                action: () => handleAction(app.id, app.user_id, 'delete')
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
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowManualModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] p-8 shadow-2xl border-4 border-[#32CD32]/20"
            >
               <button 
                  onClick={() => setShowManualModal(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
               >
                  <X size={20} />
               </button>

               <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#32CD32]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#32CD32]">
                     <BadgeCheck size={32} />
                  </div>
                  <h2 className="text-xl font-black text-[var(--text)]">Manual Verify User</h2>
                  <p className="text-xs font-bold text-gray-500 mt-1">Search and approve user badge</p>
               </div>

               <div className="space-y-6">
                  <div className="relative">
                     <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                     </div>
                     <input 
                        type="text"
                        placeholder="Type phone or name..."
                        value={searchPhone}
                        onChange={(e) => {
                          setSearchPhone(e.target.value);
                          setSelectedManualUser(null);
                        }}
                        className="w-full h-14 bg-gray-50 dark:bg-white/5 border-2 border-black/5 hover:border-[#32CD32]/30 focus:border-[#32CD32] rounded-2xl pl-12 pr-12 text-sm text-gray-900 dark:text-white font-bold transition-all outline-none"
                     />
                     {searching && (
                        <div className="absolute right-4 top-4">
                           <Loader2 size={24} className="text-[#32CD32] animate-spin" />
                        </div>
                     )}

                     {/* Suggestions List */}
                     <AnimatePresence>
                       {showSuggestions && foundUsers.length > 0 && !selectedManualUser && (
                         <motion.div 
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#242424] rounded-2xl shadow-xl border border-black/5 overflow-hidden z-50 max-h-60 overflow-y-auto"
                         >
                            {foundUsers.map(user => (
                              <div 
                                key={user.id}
                                onClick={() => {
                                  setSelectedManualUser(user);
                                  setSearchPhone(`${user.full_name || 'No Name'} -- ${user.phone}`);
                                  setShowSuggestions(false);
                                }}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer border-b border-black/5 last:border-0 transition-colors"
                              >
                                <p className="text-xs font-black text-[var(--text)] mb-0.5">{user.full_name || 'No Name'}</p>
                                <p className="text-[10px] font-bold text-gray-500">{user.phone}</p>
                              </div>
                            ))}
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>

                  {selectedManualUser && (
                    <div className="animate-in fade-in zoom-in duration-300">
                      <div className="p-4 bg-[#32CD32]/5 rounded-2xl border-2 border-[#32CD32]/20 flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black uppercase text-[#32CD32] mb-1">Selected User</p>
                            <p className="text-sm font-black text-[var(--text)]">{selectedManualUser.full_name}</p>
                            <p className="text-[11px] font-bold text-gray-500">{selectedManualUser.phone}</p>
                         </div>
                         <button 
                           onClick={() => {
                             setSelectedManualUser(null);
                             setSearchPhone('');
                           }}
                           className="p-2 text-gray-400 hover:text-red-500"
                         >
                           <X size={16} />
                         </button>
                      </div>

                      <button 
                         onClick={() => handleManualVerify(selectedManualUser)}
                         disabled={processing === selectedManualUser.id}
                         className={`w-full h-14 rounded-2xl font-black text-sm transition-all active:scale-95 mt-6 flex items-center justify-center gap-2 ${
                           selectedManualUser.is_verified 
                             ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                             : 'bg-[#32CD32] hover:bg-[#28a428] text-white shadow-[#32CD32]/20'
                         } shadow-xl`}
                      >
                         {processing === selectedManualUser.id ? (
                           <Loader2 size={20} className="animate-spin" />
                         ) : (
                           <>
                             {selectedManualUser.is_verified ? (
                               <>
                                 <X size={20} />
                                 Release Verification
                               </>
                             ) : (
                               <>
                                 <BadgeCheck size={20} />
                                 Verify Now
                               </>
                             )}
                           </>
                         )}
                      </button>
                    </div>
                  )}

                  {!selectedManualUser && !searching && searchPhone.length >= 3 && foundUsers.length === 0 && (
                    <div className="text-center py-4">
                       <p className="text-xs font-bold text-gray-400">No users found</p>
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
