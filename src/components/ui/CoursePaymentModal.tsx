import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, ChevronRight, HelpCircle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

interface CoursePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  price: number;
  type: 'course' | 'book';
  onSuccess: () => void;
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
  
  const [copied, setCopied] = useState(false);
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
      const fb = data.find(s => s.key === 'donation_number')?.value || '';
      setBkashNumber(data.find(s => s.key === 'bkash_number')?.value || fb);
      setNagadNumber(data.find(s => s.key === 'nagad_number')?.value || fb);
      setRocketNumber(data.find(s => s.key === 'rocket_number')?.value || fb);
    }
  };

  const currentNumber = method === 'bkash' ? bkashNumber : method === 'nagad' ? nagadNumber : method === 'rocket' ? rocketNumber : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('transaction_id', form.trxId.trim())
        .maybeSingle();

      if (existing) {
        setMsg({ type: 'error', text: 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('payments').insert([
        { 
          phone: form.phone, 
          method: method || 'manual', 
          transaction_id: form.trxId.trim(),
          amount: parseFloat(price.toString()),
          type: type,
          course_id: courseId,
          user_id: session?.user?.id || null,
          status: 'pending'
        }
      ]);
      
      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'সাবমিট করতে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentNumber);
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
            className="bg-white dark:bg-[#121212] rounded-[32px] p-6 sm:p-8 max-w-lg w-full relative shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all z-20"
            >
              <X size={20} />
            </button>

            {step === 1 && (
              <div className="relative z-10 flex flex-col items-center pt-2">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-500">
                  <HelpCircle size={32} />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white text-center mb-4 leading-tight">
                  কোর্সটি নিতে পেমেন্ট করুন
                </h2>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed max-w-sm">
                  আমরা একটি স্টার্টআপ কোম্পানি, আমাদের কোনো পেমেন্ট গেটওয়ে নেই। আপনি যদি কোর্সটি নিতে চান তাহলে <strong className="text-gray-900 dark:text-white">সেন্ড মানি (Send Money)</strong> করতে হবে। আপনি কোন মাধ্যমে পেমেন্ট করতে চান তা নিচে নির্বাচন করুন:
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => { setMethod('bkash'); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1A] border-2 border-pink-100 dark:border-pink-500/20 hover:border-pink-500 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <img src="https://download.logo.wine/logo/BKash/BKash-Icon-Logo.wine.png" alt="bKash" className="h-8 object-contain" />
                      <span className="font-bold text-gray-800 dark:text-white text-lg">bKash দিয়ে পেমেন্ট করুন</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                  </button>
                  
                  <button 
                    onClick={() => { setMethod('nagad'); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1A] border-2 border-orange-100 dark:border-orange-500/20 hover:border-orange-500 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <img src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png" alt="Nagad" className="h-8 object-contain" />
                      <span className="font-bold text-gray-800 dark:text-white text-lg">Nagad দিয়ে পেমেন্ট করুন</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </button>

                  <button 
                    onClick={() => { setMethod('rocket'); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1A] border-2 border-purple-100 dark:border-purple-500/20 hover:border-purple-500 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <img src="https://images.seeklogo.com/logo-png/31/1/dutch-bangla-rocket-logo-png_seeklogo-317692.png" alt="Rocket" className="h-8 object-contain rounded" />
                      <span className="font-bold text-gray-800 dark:text-white text-lg">Rocket দিয়ে পেমেন্ট করুন</span>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="relative z-10 pt-2">
                <button 
                  onClick={() => setStep(1)}
                  className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" /> ফিরে যান
                </button>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-6 text-center border border-gray-100 dark:border-white/5">
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">
                    সেন্ড মানি করতে নিচের নম্বরটি কপি করুন:
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-wider font-mono bg-white dark:bg-black/50 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
                      {currentNumber}
                    </span>
                    <button 
                      onClick={handleCopy}
                      className="p-4 bg-blue-50 flex-shrink-0 dark:bg-blue-500/20 text-blue-600 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-all active:scale-95"
                    >
                      {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
                    </button>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                    একাউন্ট টাইপ: Personal Number
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    সেন্ড মানি করা হয়ে গেলে নিচের বক্সে আপনার ট্রানজেকশন আইডি (TrxID) দিয়ে সাবমিট করুন
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1.5 ml-1">যেই নাম্বার থেকে টাকা পাঠিয়েছেন</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="01XXXXXXXXX" 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})} 
                      className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1.5 ml-1">Transaction ID (ট্রানজেকশন আইডি)</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="TrxID..." 
                      value={form.trxId} 
                      onChange={e => setForm({...form, trxId: e.target.value})} 
                      className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-2 border-blue-100 dark:border-blue-500/30 rounded-xl p-4 text-base font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-sans placeholder:font-normal" 
                    />
                  </div>
                  
                  {msg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl text-sm font-bold text-center border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                    >
                      {msg.text}
                    </motion.div>
                  )}

                  <button 
                    disabled={isSubmitting} 
                    type="submit" 
                    className="w-full bg-[#32CD32] hover:bg-[#28a428] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[#32CD32]/20 active:scale-95 text-lg"
                  >
                    {isSubmitting ? 'প্রসেস হচ্ছে...' : 'সাবমিট করুন'}
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
