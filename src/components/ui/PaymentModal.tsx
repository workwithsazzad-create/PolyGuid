import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Copy, Check, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { runSupabaseAutoVerification } from '@/src/lib/autoVerification';
import { triggerPurchaseCelebration } from '@/src/lib/celebration';
import { cn } from '@/src/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'donation' | 'course';
  paymentNumber: string;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  type = 'donation', 
  paymentNumber 
}: PaymentModalProps) {
  const [step, setStep] = useState<number>(1);
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  const [copiedField, setCopiedField] = useState<'num' | 'amount' | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', trxId: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMethod(null);
      setMsg(null);
      setForm({ name: '', phone: '', trxId: '', amount: '' });
      setCopiedField(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    setMsg(null);
    const cleanTrx = form.trxId.trim().toUpperCase();
    if (!cleanTrx) {
      setMsg({ type: 'error', text: 'ট্রানজেকশন আইডি প্রদান করুন।' });
      return;
    }
    
    const parsedAmount = parseFloat(form.amount) || 0;
    if (parsedAmount <= 0) {
      setMsg({ type: 'error', text: 'সঠিক টাকার পরিমাণ প্রদান করুন।' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: existing } = await supabase
        .from('donations')
        .select('id')
        .eq('transaction_id', cleanTrx)
        .maybeSingle();

      if (existing) {
        setMsg({ type: 'error', text: 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('donations').insert([
        { 
          student_name: form.name || session?.user?.user_metadata?.full_name || 'Anonymous Giver', 
          polytechnic_name: 'From Profile', 
          transaction_id: cleanTrx,
          amount: parsedAmount,
          type: type,
          user_id: session?.user?.id || null,
          status: 'pending'
        }
      ]);
      
      if (error) throw error;
      
      // Trigger Supabase auto-verification
      await runSupabaseAutoVerification().catch(err => console.error('Auto verification error:', err));
      
      // Check if auto-approved
      let isApproved = false;
      const { data: checkPayment } = await supabase
        .from('donations')
        .select('status')
        .eq('transaction_id', cleanTrx)
        .maybeSingle();
      if (checkPayment?.status === 'approved') {
        isApproved = true;
      }

      // Send notification for donation
      if (session?.user?.id) {
        if (isApproved) {
          await supabase.from('notifications').insert([{
            user_id: session.user.id,
            title: 'Donation Approved ❤️',
            body: 'আপনার ডোনেশনটি সফলভাবে গৃহীত হয়েছে। PolyGuide এর পাশে থাকার জন্য ধন্যবাদ!',
            type: 'donation_approved'
          }]);
        } else {
          await supabase.from('notifications').insert([{
            user_id: session.user.id,
            title: 'Donation Received ❤️',
            body: 'আপনার ডোনেশন সাবমিটের জন্য ধন্যবাদ। ভেরিফাই হলে আপনাকে জানানো হবে।',
            type: 'donation_submitted'
          }]);
        }
      }

      // Close popup immediately upon valid submission!
      onClose();

      // Trigger celebration overlay only when instantly approved
      if (isApproved) {
        triggerPurchaseCelebration({
          title: 'Thank You!'
        });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'সাবমিট করতে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, field: 'num' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const paymentNumbers: Record<string, string> = {
    bkash: paymentNumber,
    nagad: paymentNumber,
    rocket: paymentNumber
  };

  const currentNumber = method ? paymentNumbers[method] : paymentNumber;

  let methodName = '';
  let dialCode = '';
  
  if (method === 'bkash') {
    methodName = 'bKash';
    dialCode = '*247#';
  } else if (method === 'nagad') {
    methodName = 'Nagad';
    dialCode = '*167#';
  } else if (method === 'rocket') {
    methodName = 'Rocket';
    dialCode = '*322#';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-[#121212] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 max-w-lg w-full relative shadow-2xl overflow-hidden my-auto border border-black/10 dark:border-white/10"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all z-20"
            >
              <X size={18} />
            </button>

            {step === 1 && (
              <div className="relative z-10 flex flex-col items-center pt-1">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 text-red-500 shadow-sm border border-red-100 dark:border-red-500/20">
                  <Heart size={28} className="text-red-500 fill-red-500" />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white text-center mb-2 leading-tight">
                  PolyGuide -এ ডোনেট করুন
                </h2>
                
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed max-w-xs sm:max-w-sm">
                  আপনাদের সহযোগিতা আমাদের শিক্ষামূলক কার্যক্রম চালিয়ে যেতে সহায়তা করবে।
                </p>

                <div className="w-full flex flex-col gap-3 mb-6">
                  <div className="relative">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">আপনার নাম (ঐচ্ছিক)</label>
                    <input 
                      type="text" 
                      placeholder="আপনার নাম" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      className="w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-xl p-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" 
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">ডোনেশনের পরিমাণ (৳)*</label>
                    <input 
                      type="number" 
                      placeholder="টাকার পরিমাণ" 
                      value={form.amount} 
                      onChange={e => setForm({...form, amount: e.target.value})} 
                      className="w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-xl p-3 text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono" 
                    />
                  </div>
                </div>

                <div className="w-full relative">
                  {!form.amount && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-[#121212]/60 backdrop-blur-[1px] rounded-2xl">
                       <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg shadow-sm border border-black/5">আগে টাকার পরিমাণ দিন</span>
                    </div>
                  )}
                  <div className="flex flex-col w-full gap-3 opacity-100">
                    <button 
                      onClick={() => { setMethod('bkash'); setStep(2); }}
                      disabled={!form.amount}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1A1A1A] border-2 border-pink-100 dark:border-pink-500/20 hover:border-pink-500 rounded-2xl transition-all group shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img src="https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png" alt="bKash" className="h-7 sm:h-8 object-contain shrink-0" />
                        <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base whitespace-nowrap">bKash (Send Money)</span>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-pink-500 transition-colors shrink-0" size={18} />
                    </button>
                    
                    <button 
                      onClick={() => { setMethod('nagad'); setStep(2); }}
                      disabled={!form.amount}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1A1A1A] border-2 border-orange-100 dark:border-orange-500/20 hover:border-orange-500 rounded-2xl transition-all group shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png" alt="Nagad" className="h-7 sm:h-8 object-contain shrink-0" />
                        <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base whitespace-nowrap">Nagad (Send Money)</span>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-orange-500 transition-colors shrink-0" size={18} />
                    </button>

                    <button 
                      onClick={() => { setMethod('rocket'); setStep(2); }}
                      disabled={!form.amount}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1A1A1A] border-2 border-purple-100 dark:border-purple-500/20 hover:border-purple-500 rounded-2xl transition-all group shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <img src="https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png" alt="Rocket" className="h-7 sm:h-8 object-contain rounded shrink-0" />
                        <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base whitespace-nowrap">Rocket (Send Money)</span>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-purple-500 transition-colors shrink-0" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="relative z-10 pt-1">
                {/* Top header & Back Button */}
                <div className="flex items-center justify-between mb-4 pr-10">
                  <button 
                    onClick={() => setStep(1)}
                    className="p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-bold">ফিরে যান</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {method === 'bkash' && <img src="https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png" alt="bKash" className="h-5 sm:h-6 object-contain" />}
                    {method === 'nagad' && <img src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png" alt="Nagad" className="h-5 sm:h-6 object-contain" />}
                    {method === 'rocket' && <img src="https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png" alt="Rocket" className="h-5 sm:h-6 object-contain rounded-sm" />}
                    <span className="font-bold text-gray-800 dark:text-white text-sm">{methodName}</span>
                  </div>
                </div>

                {/* Amount to send */}
                <div className="flex flex-col items-center justify-center p-4 sm:p-5 border border-gray-200 dark:border-white/10 rounded-2xl mb-5 bg-white dark:bg-[#1A1A1A] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Heart size={20} className="fill-emerald-600 dark:fill-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">PolyGuide ডোনেশন</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">ডোনেশন প্রদান</p>
                    </div>
                    <span className="ml-auto text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                      {(parseFloat(form.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                    </span>
                  </div>
                </div>

                {/* Step-by-Step Instruction Card */}
                <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#16171B] flex flex-col gap-3 mb-5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">১</span>
                    <span>ডায়াল করুন <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{dialCode}</strong> অথবা <strong className="capitalize">{methodName}</strong> অ্যাপ ব্যবহার করুন।</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">২</span>
                    <span>অপশন সিলেক্ট করুন: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Send Money (সেন্ড মানি)</strong></span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-b border-gray-100 dark:border-white/5 py-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">৩</span>
                      <span className="shrink-0">নম্বর দিন:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 text-xs truncate">{currentNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentNumber, 'num')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 transition-all shrink-0 shadow-sm active:scale-95"
                    >
                      {copiedField === 'num' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedField === 'num' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">৪</span>
                      <span className="shrink-0">টাকার পরিমাণ:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 text-xs truncate">{(parseFloat(form.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${parseFloat(form.amount) || 0}`, 'amount')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 transition-all shrink-0 shadow-sm active:scale-95"
                    >
                      {copiedField === 'amount' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedField === 'amount' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">৫</span>
                    <span>আপনার <strong className="capitalize">{methodName}</strong> পিন (PIN) নম্বর দিয়ে কনফার্ম করুন।</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black flex items-center justify-center shrink-0">৬</span>
                    <span>প্রাপ্ত <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Transaction ID</strong> নিচের বক্সে বসিয়ে <strong className="text-emerald-600 dark:text-emerald-400 font-bold">ভেরিফাই</strong> করুন।</span>
                  </div>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1 ml-1">
                      ট্রানজেকশন আইডি (Transaction ID)
                    </label>
                    <input 
                      required 
                      type="text" 
                      placeholder="এখানে Transaction ID দিন" 
                      value={form.trxId} 
                      onChange={e => setForm({...form, trxId: e.target.value})} 
                      className="w-full bg-white dark:bg-black/40 border-2 border-emerald-500/50 dark:border-emerald-500/60 focus:border-emerald-600 rounded-xl p-3.5 text-base font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:font-sans placeholder:font-normal placeholder:text-gray-400" 
                    />
                  </div>
                  {msg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl text-xs font-bold text-center border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40'}`}
                    >
                      {msg.text}
                    </motion.div>
                  )}
                  <button 
                    disabled={isSubmitting || !form.trxId.trim()} 
                    type="submit" 
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-extrabold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-[0.98] text-base flex items-center justify-center gap-2 mt-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>যাচাই করা হচ্ছে...</span>
                      </>
                    ) : (
                      <span>ভেরিফাই করুন (Verify)</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
