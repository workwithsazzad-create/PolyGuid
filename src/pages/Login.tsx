import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotificationService } from '@/src/services/pushNotificationService';
import { 
  Phone, Lock, Loader2, Eye, EyeOff, User, 
  MapPin, School, ArrowRight, Bell, CheckCircle2 
} from 'lucide-react';

import Logo from '@/src/components/ui/Logo';
import { useTheme } from '@/src/components/ThemeProvider';

type Step = 'WELCOME' | 'IDENTIFY' | 'LOGIN_PASS' | 'ONBOARDING' | 'SIGNUP_PASS' | 'PERMISSIONS';

export default function Login({ session }: { session?: any }) {
  const [step, setStep] = useState<Step>('WELCOME');
  const navigate = useNavigate();

  // Handle auto-redirect if session exists, EXCEPT when on permissions step
  useEffect(() => {
    // If we have a session AND the current step isn't PERMISSIONS
    // then redirect. If we JUST signed up, handleSignup already set step to PERMISSIONS.
    if (session && step !== 'PERMISSIONS') {
      navigate('/home', { replace: true });
    }
  }, [session, step, navigate]);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [polytechnic, setPolytechnic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) {
      setError('সঠিক মোবাইল নম্বর দিন');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (profileError) throw profileError;

      if (data) {
        setStep('LOGIN_PASS');
      } else {
        setStep('ONBOARDING');
      }
    } catch (err: any) {
      setError(err.message || 'কিছু সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dummyEmailPrimary = `${phone.replace(/\+/g, '')}@polyguide.com`;
    const dummyEmailFallback = `${phone.replace(/\+/g, '')}@polyguid.com`;

    try {
      let { error: authError } = await supabase.auth.signInWithPassword({
        email: dummyEmailPrimary,
        password,
      });
      if (authError) {
        // Fallback for older accounts registered with @polyguid.com
        const resFallback = await supabase.auth.signInWithPassword({
          email: dummyEmailFallback,
          password,
        });
        if (resFallback.error) throw authError;
      }
    } catch (err: any) {
      setError('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !polytechnic) {
      setError('সকল তথ্য পূরণ করুন');
      return;
    }
    setError(null);
    setStep('SIGNUP_PASS');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মেলেনি');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);
    setError(null);

    const dummyEmail = `${phone.replace(/\+/g, '')}@polyguide.com`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dummyEmail,
        password,
      });
      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: name,
            phone: phone,
            address: address,
            polytechnic_name: polytechnic,
            role: 'student',
          });
        if (profileError) throw profileError;
      }
      setStep('PERMISSIONS');
    } catch (err: any) {
      setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      // Initialize Push Notifications (includes permission request and registration)
      await PushNotificationService.init();
      
      // Also request Local Notifications permission for overlays
      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {}

      // Final redirect
      navigate('/home', { replace: true });
    } catch (err) {
      navigate('/home', { replace: true });
    }
  };

  const renderWelcome = () => (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-start h-screen py-10 relative overflow-hidden"
    >
      {/* Moving Background Elements - Only for Welcome Screen */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          x: [0, -10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" 
      />

      <div className="flex flex-col items-center relative z-10 w-full mt-[10vh] sm:mt-[12vh]">
        <Logo theme={theme} imgClassName="h-12 sm:h-14" textClassName="text-[11px] sm:text-[12.5px]" className="mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-center text-[11px] sm:text-[13px] mt-6 px-8 sm:px-10 leading-relaxed max-w-sm font-medium">
          বাংলাদেশের প্রথম কমিউনিটি বেসড লার্নিং প্ল্যাটফর্ম। আমাদের লক্ষ্য দক্ষ ইঞ্জিনিয়ার তৈরি করা।
        </p>
      </div>

      <div className="w-full max-w-sm px-8 relative z-10 mt-auto mb-16 sm:mb-20">
        <button
          onClick={() => setStep('IDENTIFY')}
          className="w-full bg-[var(--primary)] text-white font-black rounded-full transition-all shadow-lg shadow-[var(--primary)]/30 active:scale-95 text-base sm:text-lg"
          style={{ marginTop: '0px', marginLeft: '0px', marginRight: '0px', marginBottom: '-14px', paddingTop: '8px', paddingBottom: '8px' }}
        >
          লগইন করুন/ অ্যাকাউন্ট খুলুন
        </button>
      </div>
    </motion.div>
  );

  const renderIdentify = () => (
    <motion.div
      key="identify"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      <div className="p-4">
        <button onClick={() => setStep('WELCOME')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group">
          <ArrowRight className="rotate-180 text-gray-400 group-hover:text-[var(--primary)]" size={22} />
        </button>
      </div>

      <div className="flex-1 px-8 pt-2 flex flex-col max-w-md mx-auto w-full">
        <h2 className="text-lg font-black text-[var(--text)] mb-8">মোবাইল নাম্বার দিয়ে এগিয়ে যান</h2>
        
        <form onSubmit={handleIdentify} className="flex flex-col gap-8">
          <div className="relative group">
            <span className="absolute left-0 -top-2 px-1 text-[10px] font-bold text-[var(--primary)] bg-[var(--background)] ml-4 transition-all z-10">
              মোবাইল নম্বর
            </span>
            <div className="flex items-center border-2 border-[var(--primary)] rounded-xl px-4 py-3.5 bg-white dark:bg-white/5 focus-within:ring-4 focus-within:ring-[var(--primary)]/10 transition-all">
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-base font-bold text-[var(--text)] placeholder:text-gray-300 focus:outline-none"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">{error}</p>}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'সাবমিট করুন'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderLoginPass = () => (
    <motion.div
      key="login-pass"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      <div className="p-4">
        <button onClick={() => setStep('IDENTIFY')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group">
          <ArrowRight className="rotate-180 text-gray-400 group-hover:text-[var(--primary)]" size={22} />
        </button>
      </div>

      <div className="flex-1 px-8 pt-2 flex flex-col max-w-md mx-auto w-full">
        <h2 className="text-lg font-black text-[var(--text)] mb-8">পাসওয়ার্ড দিন</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="relative">
            <span className="absolute left-0 -top-2 px-1 text-[10px] font-bold text-[var(--primary)] bg-[var(--background)] ml-4 z-10">পাসওয়ার্ড</span>
            <div className="flex items-center border-2 border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 bg-white dark:bg-white/5 focus-within:border-[var(--primary)] transition-all">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base font-bold text-[var(--text)] focus:outline-none"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-[var(--primary)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--primary)] text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderOnboarding = () => (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      <div className="p-4">
        <button onClick={() => setStep('IDENTIFY')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group">
          <ArrowRight className="rotate-180 text-gray-400 group-hover:text-[var(--primary)]" size={22} />
        </button>
      </div>

      <div className="flex-1 px-8 pt-2 flex flex-col max-w-md mx-auto w-full pb-10">
        <h2 className="text-lg font-black text-[var(--text)] mb-8">আপনার তথ্য দিন</h2>
        
        <form onSubmit={handleOnboarding} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">আপনার নাম</label>
            <input
              type="text"
              placeholder="সম্পূর্ণ নাম লিখুন"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] font-semibold focus:outline-none focus:border-[var(--primary)] transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">ঠিকানা</label>
            <input
              type="text"
              placeholder="আপনার জেলা বা এলাকা"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] font-semibold focus:outline-none focus:border-[var(--primary)] transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">আপনার পলিটেকনিক এর নাম</label>
            <input
              type="text"
              placeholder="পলিটেকনিকের নাম লিখুন"
              value={polytechnic}
              onChange={(e) => setPolytechnic(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] font-semibold focus:outline-none focus:border-[var(--primary)] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--primary)] text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            পরবর্তী ধাপ <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderSignupPass = () => (
    <motion.div
      key="signup-pass"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      <div className="p-4">
        <button onClick={() => setStep('ONBOARDING')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group">
          <ArrowRight className="rotate-180 text-gray-400 group-hover:text-[var(--primary)]" size={22} />
        </button>
      </div>

      <div className="flex-1 px-8 pt-2 flex flex-col max-w-md mx-auto w-full">
        <h2 className="text-lg font-black text-[var(--text)] mb-8">পাসওয়ার্ড সেট করুন</h2>
        
        <form onSubmit={handleSignup} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">পাসওয়ার্ড দিন</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] font-semibold focus:outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] font-semibold focus:outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
          {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--primary)] text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'নিবন্ধন সম্পন্ন করুন'}
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderPermissions = () => (
    <motion.div
      key="permissions"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full px-8 text-center"
    >
      <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mb-8">
        <Bell size={40} className="animate-bounce" />
      </div>
      <h2 className="text-xl font-black text-[var(--text)] mb-3">নোটিফিকেশন পারমিশন দিন</h2>
      <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
        আপনার কোর্সের গুরুত্বপূর্ণ আপডেট ও পরীক্ষার রুটিন সাথে সাথে পেতে নোটিফিকেশন এলাও করা প্রয়োজন।
      </p>
      
      <button
        onClick={requestNotificationPermission}
        className="w-full max-w-sm bg-[var(--primary)] hover:opacity-90 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 flex items-center justify-center gap-2"
      >
        GRANT PERMISSION <CheckCircle2 size={18} />
      </button>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden z-[100] bg-[var(--background)]">
      {/* Top Bar with Back to Landing Page button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-xs font-bold text-gray-800 dark:text-gray-100 backdrop-blur-md border border-black/10 dark:border-white/15 transition-all active:scale-95 shadow-md group"
          title="হোম পেজে যান"
        >
          <ArrowRight className="rotate-180 text-[var(--primary)] group-hover:-translate-x-0.5 transition-transform" size={16} />
          <span>হোমে ফিরুন</span>
        </button>
      </div>

      {/* Background Grid Accent */}
      <div 
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Background radial fade to match home page aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,var(--background)_95%)] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {step === 'WELCOME' && renderWelcome()}
        {step === 'IDENTIFY' && renderIdentify()}
        {step === 'LOGIN_PASS' && renderLoginPass()}
        {step === 'ONBOARDING' && renderOnboarding()}
        {step === 'SIGNUP_PASS' && renderSignupPass()}
        {step === 'PERMISSIONS' && renderPermissions()}
      </AnimatePresence>
    </div>
  );
}

