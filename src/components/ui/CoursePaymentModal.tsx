import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, ChevronRight, HelpCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { runSupabaseAutoVerification } from '@/src/lib/autoVerification';

interface CoursePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  price: number;
  type: 'course' | 'book';
  onSuccess: (status?: 'approved' | 'pending') => void;
}

export default function CoursePaymentModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  price,
  type,
  onSuccess
}: CoursePaymentModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [rocketNumber, setRocketNumber] = useState('');
  
  const [copiedField, setCopiedField] = useState<'num' | 'amount' | null>(null);
  const [form, setForm] = useState({ phone: '', trxId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMethod(null);
      setMsg(null);
      setForm({ phone: '', trxId: '' });
      fetchNumbers();
    }
  }, [isOpen]);

  const fetchNumbers = async () => {
    const { data } = await supabase.from('site_settings').select('key, value').in('key', ['bkash_number', 'nagad_number', 'rocket_number', 'donation_number']);
    if (data) {
      const fb = data.find(s => s.key === 'donation_number')?.value || '01993879904';
      setBkashNumber(data.find(s => s.key === 'bkash_number')?.value || fb);
      setNagadNumber(data.find(s => s.key === 'nagad_number')?.value || fb);
      setRocketNumber(data.find(s => s.key === 'rocket_number')?.value || fb);
    }
  };

  const currentNumber = method === 'bkash' ? bkashNumber : method === 'nagad' ? nagadNumber : method === 'rocket' ? rocketNumber : '';

  const dialCode = method === 'bkash' ? '*247#' : method === 'nagad' ? '*167#' : method === 'rocket' ? '*322#' : '*247#';
  const methodName = method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : method === 'rocket' ? 'Rocket' : 'bKash';
  const methodLogo = method === 'bkash' 
    ? 'https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png' 
    : method === 'nagad' 
      ? 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png' 
      : 'https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const cleanTrx = form.trxId.trim().toUpperCase();
    if (!cleanTrx) {
      setMsg({ type: 'error', text: 'ট্রানজেকশন আইডি প্রদান করুন।' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('transaction_id', cleanTrx)
        .maybeSingle();

      if (existing) {
        setMsg({ type: 'error', text: 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' });
        setIsSubmitting(false);
        return;
      }

      const { data: inserted, error } = await supabase.from('payments').insert([
        { 
          phone: form.phone || session?.user?.phone || 'N/A', 
          method: method || 'manual', 
          transaction_id: cleanTrx,
          amount: parseFloat(price.toString()),
          type: type,
          course_id: courseId,
          user_id: session?.user?.id || null,
          status: 'pending'
        }
      ]).select().single();
      
      if (error) throw error;
      
      // Run Supabase auto-verification immediately during submit loading state
      await runSupabaseAutoVerification().catch(err => console.error('Auto-verification error:', err));

      // Check if auto-approved
      let isApproved = false;
      if (inserted && inserted.id) {
        const { data: checkPayment } = await supabase
          .from('payments')
          .select('status')
          .eq('id', inserted.id)
          .maybeSingle();
        if (checkPayment?.status === 'approved') {
          isApproved = true;
        }
      }

      if (isApproved) {
        setMsg({ type: 'success', text: '🎉 পেমেন্ট সাথে সাথে ভেরিফাই ও অ্যাপ্রুভ হয়েছে! কোর্সটি আনলক করা হয়েছে।' });
        setTimeout(() => {
          onSuccess('approved');
          onClose();
        }, 1000);
      } else {
        setMsg({ type: 'success', text: 'পেমেন্ট রিকোয়েস্ট জমা হয়েছে! ম্যানুয়াল ভেরিফিকেশনের পর কোর্সটি আনলক হবে।' });
        setTimeout(() => {
          onSuccess('pending');
          onClose();
        }, 1200);
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
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                  <HelpCircle size={28} />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white text-center mb-2 leading-tight">
                  কোর্সটি নিতে পেমেন্ট করুন
                </h2>
                
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed max-w-xs sm:max-w-sm">
                  <strong className="text-gray-900 dark:text-white">কোর্সটি নিতে হলে সেন্ড মানি (Send Money) করতে হবে।</strong> আপনি কোন মাধ্যমে সেন্ড মানি করতে চান?
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => { setMethod('bkash'); setStep(2); }}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1A1A1A] border-2 border-pink-100 dark:border-pink-500/20 hover:border-pink-500 rounded-2xl transition-all group shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <img src="https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png" alt="bKash" className="h-7 sm:h-8 object-contain shrink-0" />
                      <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base whitespace-nowrap">bKash (Send Money)</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-pink-500 transition-colors shrink-0" size={18} />
                  </button>
                  
                  <button 
                    onClick={() => { setMethod('nagad'); setStep(2); }}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1A1A1A] border-2 border-orange-100 dark:border-orange-500/20 hover:border-orange-500 rounded-2xl transition-all group shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <img src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png" alt="Nagad" className="h-7 sm:h-8 object-contain shrink-0" />
                      <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base whitespace-nowrap">Nagad (Send Money)</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-orange-500 transition-colors shrink-0" size={18} />
                  </button>

                  <button 
                    onClick={() => { setMethod('rocket'); setStep(2); }}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#1A1A1A] border-2 border-purple-100 dark:border-purple-500/20 hover:border-purple-500 rounded-2xl transition-all group shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <img src="https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png" alt="Rocket" className="h-7 sm:h-8 object-contain rounded shrink-0" />
                      <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base whitespace-nowrap">Rocket (Send Money)</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-purple-500 transition-colors shrink-0" size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="relative z-10 pt-1">
                {/* Top header & Back Button */}
                <div className="flex items-center justify-between mb-4 pr-10">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl shrink-0"
                  >
                    <ArrowLeft size={14} /> ফিরে যান
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <img src={methodLogo} alt={methodName} className="h-7 sm:h-8 object-contain" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">{methodName}</span>
                  </div>
                </div>

                {/* Course Header & Price Pill */}
                <div className="bg-gray-50 dark:bg-[#1A1D24] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {courseTitle.substring(0, 4).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{courseTitle}</h3>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase">{type === 'book' ? 'বই অর্ডার' : 'কোর্স এনরোলমেন্ট'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
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
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 text-xs truncate">{price.toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${price}`, 'amount')}
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
