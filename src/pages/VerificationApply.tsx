import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { 
  ArrowLeft, ShieldCheck, Upload, FileText, Phone, User, 
  Loader2, CheckCircle2, AlertCircle, Image as ImageIcon,
  Check
} from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';

export default function VerificationApply() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [existingApp, setExistingApp] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    id_card_front: null as File | null,
    id_card_back: null as File | null
  });
  
  const [previews, setPreviews] = useState({
    front: '',
    back: ''
  });

  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    checkAuthAndStatus();
  }, []);

  const checkAuthAndStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      
      if (profileData) {
        setFormData(prev => ({
          ...prev,
          full_name: profileData.full_name || '',
          phone_number: profileData.phone || ''
        }));
      }

      // Check if already verified
      if (profileData?.is_verified) {
        setExistingApp({ status: 'approved' });
      } else {
        // Check for pending application
        const { data: appData } = await supabase
          .from('verification_applications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        setExistingApp(appData);
      }
    } catch (err) {
      console.error("Error checking verification status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, [side === 'front' ? 'id_card_front' : 'id_card_back']: file }));
      setPreviews(prev => ({ ...prev, [side]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_card_front || !formData.id_card_back) {
      setStatus({ type: 'error', message: 'অনুগ্রহ করে আইডি কার্ডের উভয় পাশের ছবি আপলোড করুন।' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 1. Upload Images
      const uploadImage = async (file: File, suffix: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}_${suffix}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('verifications')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('verifications')
          .getPublicUrl(fileName);
        
        return publicUrl;
      };

      const frontUrl = await uploadImage(formData.id_card_front, 'front');
      const backUrl = await uploadImage(formData.id_card_back, 'back');

      // 2. Create Application
      const { error: appError } = await supabase
        .from('verification_applications')
        .insert({
          user_id: session.user.id,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          id_card_front_url: frontUrl,
          id_card_back_url: backUrl,
          status: 'pending'
        });

      if (appError) throw appError;

      setStatus({ type: 'success', message: 'আপনার আবেদনটি সফলভাবে জমা দেওয়া হয়েছে। আমরা শীঘ্রই যাচাই করে দেখব।' });
      setExistingApp({ status: 'pending' });
    } catch (err: any) {
      console.error("Verification error:", err);
      setStatus({ type: 'error', message: err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে।' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[#32CD32] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-black/5 dark:border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-[var(--text)]"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text)]">একউন্ট ভেরিফাই করুন</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {existingApp?.status === 'approved' ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text)]">আপনি ইতোমধ্যে ভেরিফাইড!</h2>
            <p className="text-gray-500 font-medium">আপনার প্রোফাইলে ব্লু টিক যুক্ত করা হয়েছে।</p>
            <button 
              onClick={() => navigate('/profile')}
              className="px-8 py-3 bg-[#32CD32] text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-[#32CD32]/20"
            >
              প্রোফাইলে ফিরে যান
            </button>
          </div>
        ) : existingApp?.status === 'pending' ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ShieldCheck size={48} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text)]">আবেদনটি প্রক্রিয়াধীন...</h2>
            <p className="text-gray-500 font-medium max-w-sm">
              আপনার ব্লু ভেরিফিকেশন আবেদনটি আমাদের কাছে পৌঁছেছে। অ্যাডমিন টিম এটি যাচাই করে দেখছে। অনুগ্রহ করে ধৈর্য ধারণ করুন।
            </p>
            <button 
              onClick={() => navigate('/home')}
              className="px-8 py-3 bg-gray-200 dark:bg-white/10 text-[var(--text)] rounded-2xl font-bold active:scale-95 transition-all"
            >
              হোমে যান
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <GlassmorphicCard className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
                  <ShieldCheck className="text-[#32CD32]" /> ভেরিফিকেশন কেন প্রয়োজন?
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  আপনার একাউন্টটি ভেরিফাইড হলে আপনার নামের পাশে একটি ব্লু ব্যাজ যুক্ত হবে যা আপনার বিশ্বস্ততা বৃদ্ধি করবে এবং কমিউনিটিতে আলাদা গুরুত্ব বহন করবে।
                </p>
              </div>

              <div className="h-px bg-black/5 dark:bg-white/5" />

              <form onSubmit={handleSubmit} className="space-y-6">
                {status && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="text-sm font-bold">{status.message}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
                      <User size={14} className="text-[#32CD32]" /> পূর্ণ নাম (আইডি কার্ড অনুযায়ী)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#32CD32] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
                      <Phone size={14} className="text-[#32CD32]" /> সচল ফোন নম্বর
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone_number}
                      onChange={e => setFormData({...formData, phone_number: e.target.value})}
                      placeholder="আপনার সচল ফোন নম্বর লিখুন"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#32CD32] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {/* Front side */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[var(--text)] uppercase tracking-widest">আইডি কার্ড (সামনের অংশ)</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'front')}
                          className="hidden"
                          id="id-front"
                          required
                        />
                        <label 
                          htmlFor="id-front"
                          className="flex flex-col items-center justify-center gap-3 aspect-video bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl cursor-pointer hover:border-[#32CD32] hover:bg-[#32CD32]/5 transition-all overflow-hidden"
                        >
                          {previews.front ? (
                            <img src={previews.front} className="w-full h-full object-cover" alt="Front Preview" />
                          ) : (
                            <>
                              <div className="p-3 bg-white dark:bg-[#1a1a1a] rounded-full shadow-sm text-gray-400 group-hover:text-[#32CD32]">
                                <Upload size={20} />
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Front View</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Back side */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[var(--text)] uppercase tracking-widest">আইডি কার্ড (পেছনের অংশ)</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'back')}
                          className="hidden"
                          id="id-back"
                          required
                        />
                        <label 
                          htmlFor="id-back"
                          className="flex flex-col items-center justify-center gap-3 aspect-video bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl cursor-pointer hover:border-[#32CD32] hover:bg-[#32CD32]/5 transition-all overflow-hidden"
                        >
                          {previews.back ? (
                            <img src={previews.back} className="w-full h-full object-cover" alt="Back Preview" />
                          ) : (
                            <>
                              <div className="p-3 bg-white dark:bg-[#1a1a1a] rounded-full shadow-sm text-gray-400 group-hover:text-[#32CD32]">
                                <Upload size={20} />
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Back View</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#32CD32] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#32CD32]/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        জমা হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Check size={24} />
                        আবেদন জমা দিন
                      </>
                    )}
                  </button>
                </div>
              </form>
            </GlassmorphicCard>

            {/* Note */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
              <p className="text-[10px] sm:text-xs text-orange-600/80 dark:text-orange-400 font-medium leading-relaxed">
                * মনে রাখবেন, ভুল বা মিথ্যা তথ্য প্রধান করলে আপনার একাউন্ট স্থায়ীভাবে ব্যান্ড হতে পারে। সকল তথ্য গোপন রাখা হবে।
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
