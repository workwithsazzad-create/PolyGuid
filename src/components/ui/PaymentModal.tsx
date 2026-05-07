import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, DollarSign, X, Copy, Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'donation' | 'course';
  courseId?: string;
  courseTitle?: string;
  price?: number;
  paymentNumber: string;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  type, 
  courseId, 
  courseTitle, 
  price,
  paymentNumber 
}: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ phone: '', trxId: '', amount: price || '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if TrxID already exists to prevent duplicates
      const { data: existing } = await supabase
        .from('donations')
        .select('id')
        .eq('transaction_id', form.trxId.trim())
        .maybeSingle();

      if (existing) {
        setMsg({ type: 'error', text: 'This Transaction ID has already been submitted.' });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('donations').insert([
        { 
          student_name: form.phone, 
          polytechnic_name: "N/A", 
          transaction_id: form.trxId.trim(),
          amount: parseFloat(form.amount.toString()),
          type: type,
          course_id: courseId || null,
          user_id: session?.user?.id || null,
          status: 'pending'
        }
      ]);
      
      if (error) throw error;
      
      setMsg({ 
        type: 'success', 
        text: type === 'course' 
          ? 'Payment request submitted! Your course will be unlocked after verification.' 
          : 'Thank you for your donation!' 
      });
      setForm({ phone: '', trxId: '', amount: price || '' });
      setTimeout(() => onClose(), 3500);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-md w-full relative border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Background Accent */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${type === 'course' ? 'bg-blue-500' : 'bg-red-500'}`} />
            
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-3 text-gray-500 hover:text-[var(--text)] hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all z-20"
              aria-label="Close"
            >
              <X size={24} />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${type === 'course' ? 'bg-blue-500/10 text-blue-500 shadow-blue-500/10' : 'bg-red-500/10 text-red-500 shadow-red-500/10'}`}>
                  {type === 'course' ? <DollarSign size={24} /> : <Heart size={24} className="fill-red-500" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--text)] tracking-tight">
                    {type === 'course' ? 'Enroll in Course' : 'Support PolyGuid'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                    {type === 'course' ? `Purchase: ${courseTitle}` : 'Safe & Secure Donation'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 mb-6 border border-black/5 dark:border-white/5 text-center relative overflow-hidden group">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Send Money to this number</p>
                <div className="flex items-center justify-center gap-4 mb-5">
                  <span className="text-2xl sm:text-3xl font-black text-[var(--primary)] tracking-tight">{paymentNumber}</span>
                  <button 
                    onClick={handleCopy}
                    className="p-2.5 bg-white dark:bg-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm border border-black/5 dark:border-white/10 active:scale-90"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-600 dark:text-gray-400" />}
                  </button>
                </div>
                <div className="flex justify-center gap-6 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <img src="https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png" alt="bKash" className="h-6 sm:h-8 grayscale group-hover:grayscale-0 transition-all" />
                  <img src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png" alt="Nagad" className="h-6 sm:h-8 grayscale group-hover:grayscale-0 transition-all" />
                  <img src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D104E17A-seeklogo.com.png" alt="Rocket" className="h-6 sm:h-8 grayscale group-hover:grayscale-0 transition-all" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Phone (Login Number)</label>
                    <input required type="tel" placeholder="017XXXXXXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all" />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Amount</label>
                    <input required type="number" placeholder="500" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all" readOnly={type === 'course'} />
                  </div>
                </div>

                <div className="relative">
                    <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider ml-1 mb-1 block">Transaction ID (TrxID)*</label>
                    <input required type="text" placeholder="ABC123XYZ" value={form.trxId} onChange={e => setForm({...form, trxId: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-[var(--primary)]/30 dark:border-[var(--primary)]/30 rounded-xl p-3 text-sm font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all shadow-[0_0_15px_rgba(50,205,50,0.05)]" />
                </div>
                
                {msg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-xs font-bold leading-relaxed border ${msg.type === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}
                  >
                    {msg.text}
                  </motion.div>
                )}

                <button 
                    disabled={isSubmitting} 
                    type="submit" 
                    className="w-full bg-[var(--primary)] hover:bg-[#28a428] text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-xl shadow-[var(--primary)]/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Verifying...' : 'Submit Payment Details'}
                  <ChevronRight size={18} />
                </button>
                <p className="text-[9px] text-center text-gray-500 font-bold uppercase tracking-widest">Manual verification by admin within 24 hours</p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
