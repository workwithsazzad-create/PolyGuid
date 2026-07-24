import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, DollarSign, X, Copy, Check, ChevronRight, ArrowLeft, ChevronLeft } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { runSupabaseAutoVerification } from '@/src/lib/autoVerification';
import { triggerPurchaseCelebration } from '@/src/lib/celebration';
import { cn } from '@/src/lib/utils';

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
  const [step, setStep] = useState<number>(1);
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', polytechnic: '', phone: '', trxId: '', amount: price || '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const maxSteps = type === 'donation' ? 3 : 2;

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMethod(null);
      setMsg(null);
      setForm({ name: '', polytechnic: '', phone: '', trxId: '', amount: price || '' });
    }
  }, [isOpen]);

  const nextStep = () => setStep(prev => Math.min(prev + 1, maxSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    setMsg(null);
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const trxIdClean = form.trxId.trim();
      if (!trxIdClean) throw new Error('Transaction ID is required');

      // Check if TrxID already exists
      const { data: existing } = await supabase
        .from('donations')
        .select('id')
        .eq('transaction_id', trxIdClean)
        .maybeSingle();

      if (existing) {
        setMsg({ type: 'error', text: 'This Transaction ID has already been submitted.' });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('donations').insert([
        { 
          student_name: type === 'course' ? (form.name || 'Anonymous Giver') : 'From Profile', 
          polytechnic_name: type === 'course' ? (form.polytechnic || 'Anonymous') : 'From Profile', 
          transaction_id: trxIdClean,
          amount: form.amount ? (parseFloat(form.amount.toString()) || 0) : 0,
          type: type,
          course_id: courseId || null,
          user_id: session?.user?.id || null,
          status: 'pending'
        }
      ]);
      
      if (error) throw error;
      
      // Trigger Supabase auto-verification
      await runSupabaseAutoVerification().catch(err => console.error('Auto verification error:', err));
      
      // Send notification for donation
      if (type === 'donation' && session?.user?.id) {
        await supabase.from('notifications').insert([{
          user_id: session.user.id,
          title: 'Donation Received ❤️',
          body: 'আপনার ডোনেশন সাবমিটের জন্য ধন্যবাদ। PolyGuid কর্তৃপক্ষ ভেরিফাই করলে আপনার নাম আমাদের ওয়েবসাইটে ফিচার করা হবে।',
          type: 'donation_submitted'
        }]);
      }

      onClose();
      triggerPurchaseCelebration({
        title: 'Congratulations!'
      });
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#121212] rounded-[32px] p-6 sm:p-8 max-w-md w-full relative border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${type === 'course' ? 'bg-blue-500' : 'bg-red-500'}`} />
            
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all z-20"
            >
              <X size={20} />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                {step > 1 && (
                  <button onClick={prevStep} className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-400" />
                  </button>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                  type === 'course' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                )}>
                  {type === 'course' ? <DollarSign size={24} /> : <Heart size={24} className="fill-red-500" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--text)] tracking-tight">
                    {type === 'donation' ? (
                      step === 1 ? 'ডোনেশন দিন' :
                      step === 2 ? 'পেমেন্ট মেথড' :
                      step === 3 ? 'আপনার তথ্য' : 'ভেরিফাই করুন'
                    ) : (
                      step === 1 ? 'Enrollment' : 'Verify Payment'
                    )}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                    Step {step} of {maxSteps}
                  </p>
                </div>
              </div>

              <div className="min-h-[300px]">
                {type === 'donation' ? (
                  <>
                    {/* Donation Flow */}
                    {step === 1 && (
                      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                          <p className="text-sm sm:text-base text-red-600 dark:text-red-400 leading-relaxed font-medium text-center">
                            PolyGuid-কে সচল রাখতে এবং আমাদের কাজকে এগিয়ে নিতে আপনার সামান্য অবদান অনেক বড় ভূমিকা রাখবে। ❤️
                          </p>
                          <div className="mt-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-red-500/5">
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              আমাদের কোনো অফিসিয়াল পেমেন্ট গেটওয়ে নেই, তাই আপনি সরাসরি <span className="font-bold underline">Send Money</span> করতে পারেন। আপনার ডোনেশনটি ভেরিফাই হওয়ার পর আপনার নাম আমাদের ওয়েবসাইটে ফিচার করা হবে।
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={nextStep}
                          className="w-full bg-[var(--primary)] hover:bg-[#28a428] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center gap-2 mt-4"
                        >
                          পরবর্তী ধাপ <ChevronRight size={18} />
                        </button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Select Payment Method</label>
                        <div className="grid grid-cols-1 gap-2">
                           {[
                             { id: 'bkash', name: 'bKash (Send Money)', logo: 'https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png', color: 'hover:border-[#e2136e]' },
                             { id: 'nagad', name: 'Nagad (Send Money)', logo: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png', color: 'hover:border-[#f7941d]' },
                             { id: 'rocket', name: 'Rocket (Send Money)', logo: 'https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png', color: 'hover:border-[#8c3494]' }
                           ].map((m) => (
                             <button
                               key={m.id}
                               onClick={() => setMethod(m.id as any)}
                               className={cn(
                                 "flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]",
                                 method === m.id 
                                   ? "bg-[var(--primary)]/5 border-[var(--primary)] shadow-md" 
                                   : "bg-black/5 dark:bg-white/5 border-transparent " + m.color
                               )}
                             >
                               <img src={m.logo} alt={m.name} className="h-6 object-contain" />
                               <span className="text-sm font-bold text-[var(--text)]">{m.name}</span>
                               {method === m.id && <Check size={18} className="ml-auto text-[var(--primary)]" />}
                             </button>
                           ))}
                        </div>
                        <button 
                          disabled={!method}
                          onClick={nextStep}
                          className="w-full bg-[var(--primary)] hover:bg-[#28a428] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 mt-2"
                        >
                          পরবর্তী ধাপ <ChevronRight size={18} />
                        </button>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[24px] p-6 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">নিচের নাম্বারে সেন্ড মানি করুন</p>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <span className="text-3xl font-black text-[var(--primary)] tracking-tight">{paymentNumber}</span>
                            <button 
                              type="button"
                              onClick={handleCopy}
                              className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-md border border-black/5 hover:scale-105 transition-all active:scale-90"
                            >
                              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-400" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                             <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">সেন্ড মানি করুন (পার্সোনাল)</span>
                          </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                          <div className="relative">
                            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider ml-1 mb-1 block">ডোনেশনের পরিমাণ (৳)*</label>
                            <input 
                              required
                              type="number" 
                              placeholder="পেমেন্ট এমাউন্ট..." 
                              value={form.amount} 
                              onChange={e => setForm({...form, amount: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--primary)]/30 rounded-2xl p-4 text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all font-mono" 
                            />
                          </div>
                          <div className="relative">
                            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider ml-1 mb-1 block">আপনার মোবাইল নাম্বার*</label>
                            <input 
                              required 
                              type="tel" 
                              placeholder="017XXXXXXXX" 
                              value={form.phone} 
                              onChange={e => setForm({...form, phone: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--primary)]/30 rounded-2xl p-4 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all font-mono" 
                            />
                          </div>
                          <div className="relative">
                            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider ml-1 mb-1 block">ট্রানজেকশন আইডি (TrxID)*</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Ex: ABC123XYZ" 
                              value={form.trxId} 
                              onChange={e => setForm({...form, trxId: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--primary)]/30 rounded-2xl p-4 text-sm font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all" 
                            />
                          </div>

                          {msg && (
                            <div className={cn(
                              "p-4 rounded-2xl text-[11px] font-bold leading-relaxed border",
                              msg.type === 'success' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                            )}>
                              {msg.text}
                            </div>
                          )}

                          <button 
                            disabled={isSubmitting || !form.trxId || !form.phone || !form.amount} 
                            type="submit" 
                            className="w-full bg-[var(--primary)] hover:bg-[#28a428] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'তথ্য জমা দিন'}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Course Flow */}
                    {step === 1 && (
                      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-3 block">Select Payment Method</label>
                          <div className="grid grid-cols-1 gap-2">
                             {[
                               { id: 'bkash', name: 'bKash (Send Money)', logo: 'https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png', color: 'hover:border-[#e2136e]' },
                               { id: 'nagad', name: 'Nagad (Send Money)', logo: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png', color: 'hover:border-[#f7941d]' },
                               { id: 'rocket', name: 'Rocket (Send Money)', logo: 'https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png', color: 'hover:border-[#8c3494]' }
                             ].map((m) => (
                               <button
                                 key={m.id}
                                 onClick={() => setMethod(m.id as any)}
                                 className={cn(
                                   "flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]",
                                   method === m.id 
                                     ? "bg-[var(--primary)]/5 border-[var(--primary)] shadow-md" 
                                     : "bg-black/5 dark:bg-white/5 border-transparent " + m.color
                                 )}
                               >
                                 <img src={m.logo} alt={m.name} className="h-6 object-contain" />
                                 <span className="text-sm font-bold text-[var(--text)]">{m.name}</span>
                                 {method === m.id && <Check size={18} className="ml-auto text-[var(--primary)]" />}
                               </button>
                             ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="relative">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Your Name</label>
                            <input 
                              type="text" 
                              placeholder="Name" 
                              value={form.name} 
                              onChange={e => setForm({...form, name: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-2xl p-4 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all" 
                            />
                          </div>
                          <div className="relative">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Amount (৳)</label>
                            <input 
                              type="number" 
                              placeholder="Amount" 
                              value={form.amount} 
                              onChange={e => setForm({...form, amount: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-2xl p-4 text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all font-mono" 
                            />
                          </div>
                        </div>

                        <button 
                          disabled={!method || !form.amount || !form.name}
                          onClick={nextStep}
                          className="w-full bg-[var(--primary)] hover:bg-[#28a428] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 mt-2"
                        >
                          CONTINUE TO PAYMENT <ChevronRight size={18} />
                        </button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[24px] p-6 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Copy & Send Money to this Number</p>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <span className="text-3xl font-black text-[var(--primary)] tracking-tight">{paymentNumber}</span>
                            <button 
                              onClick={handleCopy}
                              className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-md border border-black/5 hover:scale-105 transition-all active:scale-90"
                            >
                              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-400" />}
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                          <div className="relative">
                            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider ml-1 mb-1 block">Your Phone Number*</label>
                            <input 
                              required 
                              type="tel" 
                              placeholder="017XXXXXXXX" 
                              value={form.phone} 
                              onChange={e => setForm({...form, phone: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--primary)]/30 rounded-2xl p-4 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all font-mono" 
                            />
                          </div>
                          <div className="relative">
                            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider ml-1 mb-1 block">Transaction ID (TrxID)*</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Ex: ABC123XYZ" 
                              value={form.trxId} 
                              onChange={e => setForm({...form, trxId: e.target.value})} 
                              className="w-full bg-black/5 dark:bg-white/5 border border-[var(--primary)]/30 rounded-2xl p-4 text-sm font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all" 
                            />
                          </div>

                          {msg && (
                            <div className={cn(
                              "p-4 rounded-2xl text-[11px] font-bold leading-relaxed border",
                              msg.type === 'success' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                            )}>
                              {msg.text}
                            </div>
                          )}

                          <button 
                            disabled={isSubmitting || !form.trxId || !form.phone} 
                            type="submit" 
                            className="w-full bg-[var(--primary)] hover:bg-[#28a428] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            {isSubmitting ? 'VERIFYING...' : 'CONFIRM SUBMISSION'}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
