import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { 
  ChevronLeft, History, ShoppingBag, Calendar, 
  CreditCard, CheckCircle2, Clock, XCircle, Search
} from 'lucide-react';
import GlassmorphicCard from '@/src/components/ui/GlassmorphicCard';

interface Order {
  id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
  type: string;
  courses: {
    title: string;
    thumbnail_url: string;
  } | null;
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch from payments (Paid)
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select(`
          id,
          transaction_id,
          amount,
          status,
          created_at,
          type,
          courses (
            title,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id);

      if (donationsError) throw donationsError;

      // Fetch from enrollments (Free/Direct)
      const { data: enrollData, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          id,
          created_at,
          courses (
            title,
            thumbnail_url,
            price
          )
        `)
        .eq('user_id', user.id);

      if (enrollError) throw enrollError;

      // Merge and format
      const donationOrders = (donationsData || []).map(d => {
        const course = Array.isArray(d.courses) ? d.courses[0] : d.courses;
        return {
          id: d.id,
          transaction_id: d.transaction_id || 'DIRECT',
          amount: d.amount,
          status: d.status || 'approved',
          created_at: d.created_at,
          type: d.type || 'course',
          courses: course ? { 
            title: (course as any).title, 
            thumbnail_url: (course as any).thumbnail_url 
          } : null
        };
      });

      const enrollmentOrders = (enrollData || [])
        .map(e => {
          const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          if (!course) return null;
          
          // Skip if already in donations to avoid duplicates
          if (donationsData?.some(d => {
            const dCourse = Array.isArray(d.courses) ? d.courses[0] : d.courses;
            return (dCourse as any)?.title === (course as any).title;
          })) return null;

          return {
            id: e.id,
            transaction_id: 'ENROLLED',
            amount: (course as any).price || 0,
            status: 'approved',
            created_at: e.created_at,
            type: 'course',
            courses: { 
              title: (course as any).title, 
              thumbnail_url: (course as any).thumbnail_url 
            }
          };
        })
        .filter((e): e is any => e !== null);

      const combined = [...donationOrders, ...enrollmentOrders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(combined);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle2 size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'rejected': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8 mt-4 sm:mt-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)]">পেমেন্ট ও অর্ডার হিস্ট্রি</h1>
            <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">আপনার সকল কেনাকাটার তথ্য এখানে সংরক্ষিত আছে</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          {['all', 'approved', 'pending', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                filter === f 
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm' 
                : 'bg-white dark:bg-black/20 text-gray-500 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {f === 'all' && 'সবগুলো'}
              {f === 'approved' && 'সফল'}
              {f === 'pending' && 'পেন্ডিং'}
              {f === 'rejected' && 'বাতিল'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="text-sm font-black text-gray-400 w-6 shrink-0">{index + 1}.</div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[var(--text)] truncate">
                    {order.courses?.title || 'বিকাশ পেমেন্ট'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{formatDate(order.created_at)}</span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {order.transaction_id}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-sm sm:text-base font-black text-[var(--text)]">৳{order.amount}</div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                  {order.status === 'approved' ? 'সফল' : order.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center gap-4 bg-black/5 dark:bg-white/5 rounded-[32px] border border-dashed border-black/10 dark:border-white/10">
          <History size={48} className="text-gray-300" />
          <div>
            <h3 className="text-lg font-bold text-[var(--text)]">কোন তথ্য পাওয়া যায়নি</h3>
            <p className="text-sm text-gray-500 mt-1 px-4">আপনি এখনো কোনো কেনাকাটা করেননি।</p>
          </div>
          <button 
            onClick={() => navigate('/home')}
            className="mt-2 text-[var(--primary)] font-bold hover:underline transition-all text-sm"
          >
            কোর্স দেখুন
          </button>
        </div>
      )}
    </div>
  );
}
