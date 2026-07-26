import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/src/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/src/components/ThemeProvider';
import { 
  User, Edit2, Lock, LayoutDashboard, Bell, ShieldCheck, 
  History, Moon, Sun, Info, MessageSquare, LogOut, FileText, ChevronRight, CheckCircle2, ChevronDown, BookOpen,
  BadgeCheck
} from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';

export default function More() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactEmail, setContactEmail] = useState("workwithsazzad@gmail.com");

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription for profile changes
    let profileSubscription: any = null;
    
    const setupProfileSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const channelName = `more_profile_${session.user.id}_${Math.random().toString(36).substring(7)}`;
        profileSubscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${session.user.id}`,
            },
            (payload) => {
              setProfile(payload.new);
            }
          )
          .subscribe();
      }
    };
    
    setupProfileSubscription();
    
    return () => {
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setProfile(profileData);
        setIsAdmin(profileData?.role === 'admin' || session.user.email?.includes('admin'));
      }
      
      const { data: emailData } = await supabase.from('site_settings').select('value').eq('key', 'contact_email').maybeSingle();
      if (emailData?.value) {
        setContactEmail(emailData.value);
      }
    } catch (e) {
      console.error("Error fetching more page data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: "নতুন পাসওয়ার্ড দু'টি মিলেনি!" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" });
      return;
    }

    setUpdatingPassword(true);
    try {
      // Supabase requires logging in again or providing current password for secure updates sometimes
      // First try to authenticate with old password to verify it
      if (session?.user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: oldPassword,
        });

        if (signInError) {
          throw new Error("বর্তমান পাসওয়ার্ড সঠিক নয়।");
        }
      }

      // If successful, update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordMsg({ type: 'success', text: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!" });
      setTimeout(() => setShowPasswordChange(false), 2000);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-6">
      <div className="space-y-6">
        
        {/* Profile Section */}
        <section className="px-4">
          <GlassmorphicCard className="p-4 bg-white/60 dark:bg-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--primary)]/20 flex flex-shrink-0 items-center justify-center overflow-hidden border-2 border-[var(--primary)]/50">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-[var(--primary)]" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-1.5">
                    {profile?.full_name || 'Student Name'}
                    {(profile?.is_verified || profile?.role === 'admin' || profile?.phone === '01993879904' || profile?.full_name?.includes('PolyGuide')) && (
                      <BadgeCheck className="text-blue-500 fill-blue-500 text-white dark:text-[#1a1a1a] rounded-full w-5 h-5 shrink-0" size={18} />
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{profile?.phone || 'No phone provided'}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="p-2 text-[var(--primary)] bg-[var(--primary)]/10 rounded-full hover:bg-[var(--primary)]/20 transition"
              >
                <Edit2 size={18} />
              </button>
            </div>

            {/* Password Change Toggle */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center justify-between w-full p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-orange-500" />
                  <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${showPasswordChange ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showPasswordChange && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 space-y-3"
                    onSubmit={handleChangePassword}
                  >
                    <input 
                      type="password" 
                      placeholder="বর্তমান পাসওয়ার্ড" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                    <input 
                      type="password" 
                      placeholder="নতুন পাসওয়ার্ড" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                      required
                      minLength={6}
                    />
                    <input 
                      type="password" 
                      placeholder="পাসওয়ার্ড নিশ্চিত করুন" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                      required
                      minLength={6}
                    />
                    
                    {passwordMsg && (
                      <div className={`p-2 text-xs rounded-lg ${passwordMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {passwordMsg.text}
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      disabled={updatingPassword}
                      className="w-full py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {updatingPassword ? 'অপেক্ষা করুন...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </GlassmorphicCard>
        </section>

        {/* Menu List */}
        <section className="px-4">
          <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <MenuOption icon={LayoutDashboard} label="ড্যাশবোর্ড" onClick={() => navigate('/dashboard')} color="bg-blue-500" />
            <MenuOption icon={BookOpen} label="বইয়ের তালিকা" onClick={() => navigate('/book-list')} color="bg-orange-500" />
            <MenuOption icon={ShieldCheck} label="ভেরিফিকেশন আবেদন" onClick={() => navigate('/verify-account')} color="bg-blue-400" />
            <MenuOption icon={FileText} label="নোটিশ বোর্ড" onClick={() => navigate('/notices')} color="bg-emerald-500" />
            {isAdmin && <MenuOption icon={ShieldCheck} label="অ্যাডমিন প্যানেল" onClick={() => navigate('/admin')} color="bg-purple-500" />}
            <MenuOption icon={History} label="পেমেন্ট ও অর্ডার হিস্ট্রি" onClick={() => navigate('/orders')} color="bg-amber-500" /> 
            
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-4" />
            
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${theme === 'dark' ? 'bg-indigo-500' : 'bg-orange-400'}`}>
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {theme === 'dark' ? 'ডার্ক মোড বন্ধ করুন' : 'ডার্ক মোড চালু করুন'}
                </span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
            
            <MenuOption icon={Info} label="অ্যাপ ইনফো" onClick={() => navigate('/about')} color="bg-cyan-500" />
            <a href={`mailto:${contactEmail}`} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full px-0 flex items-center justify-center text-white bg-red-500">
                  <MessageSquare size={18} />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">মতামত জানান</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </a>
            
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-4" />
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-gray-400">
                  <LogOut size={18} />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">লগ আউট</span>
              </div>
            </button>

          </div>
        </section>

      </div>
    </div>
  );
}

function MenuOption({ icon: Icon, label, onClick, color }: { icon: any, label: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition"
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${color}`}>
          <Icon size={18} />
        </div>
        <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </button>
  );
}
