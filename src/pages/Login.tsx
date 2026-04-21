import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Loader2, UserPlus, LogIn } from 'lucide-react';

import Logo from '@/src/components/ui/Logo';
import { useTheme } from '@/src/components/ThemeProvider';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [polytechnic, setPolytechnic] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { theme } = useTheme();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.user) {
          // Save additional user data to the profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: name,
              phone_number: phone,
              address: address,
              polytechnic_name: polytechnic,
              role: 'student', // Default role
            });

          if (profileError) {
            console.error('Error saving profile data:', profileError);
            // We don't throw here to still allow login, but we could
          }
        }

        setMessage({ type: 'success', text: 'Registration successful! You can now login.' });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-50 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Logo theme={theme} className="scale-125" />
        </div>

        <div className="glass p-8 rounded-2xl shadow-[0_0_40px_rgba(50,205,50,0.15)]">
          <div className="flex gap-4 mb-8 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--glass-border)]">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                !isSignUp 
                  ? 'bg-white dark:bg-[#1a1a1a] text-black dark:text-white border border-[var(--primary)]/50 shadow-[0_0_15px_rgba(50,205,50,0.3)]' 
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <LogIn size={16} />
              Login
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                isSignUp 
                  ? 'bg-white dark:bg-[#1a1a1a] text-black dark:text-white border border-[var(--primary)]/50 shadow-[0_0_15px_rgba(50,205,50,0.3)]' 
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+880 1XXX XXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={isSignUp}
                      className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <div className="relative">
                    <input
                      id="address"
                      type="text"
                      placeholder="Dhaka, Bangladesh"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required={isSignUp}
                      className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="polytechnic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Polytechnic Name
                  </label>
                  <div className="relative">
                    <input
                      id="polytechnic"
                      type="text"
                      placeholder="Dhaka Polytechnic Institute"
                      value={polytechnic}
                      onChange={(e) => setPolytechnic(e.target.value)}
                      required={isSignUp}
                      className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-[var(--text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3 rounded-lg text-sm overflow-hidden ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] hover:bg-[#28a428] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(50,205,50,0.4)] hover:shadow-[0_0_30px_rgba(50,205,50,0.6)] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
