import { supabase } from './supabase';

export interface VerificationResult {
  newlyVerifiedCount: number;
  verifiedDetails: Array<{
    id: string;
    table: 'payments' | 'donations';
    trxId: string;
    type?: string;
  }>;
  logsCount: number;
  pendingCount: number;
}

/**
 * Scans Supabase `webhook_logs` table for incoming SMS records,
 * and automatically approves matching pending transactions in `payments` and `donations` tables.
 */
export async function runSupabaseAutoVerification(): Promise<VerificationResult> {
  const result: VerificationResult = {
    newlyVerifiedCount: 0,
    verifiedDetails: [],
    logsCount: 0,
    pendingCount: 0
  };

  try {
    // 1. Fetch recent webhook logs from Supabase
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (logsError) {
      console.warn('Could not query webhook_logs table in Supabase:', logsError.message);
      return result;
    }

    if (!logs || logs.length === 0) {
      return result;
    }

    result.logsCount = logs.length;

    // Filter logs to ensure they come from official payment SMS notifications
    const validPaymentSmsTexts: string[] = logs
      .map(log => {
        if (!log.payload) return '';
        if (typeof log.payload === 'string') {
          return log.payload.toUpperCase();
        }
        return JSON.stringify(log.payload).toUpperCase();
      })
      .filter(smsText => {
        if (!smsText) return false;
        // Must contain TrxID or TxnID
        const hasTrx = smsText.includes("TRXID") || smsText.includes("TXNID") || smsText.includes("TRX ID") || smsText.includes("TXN ID");
        if (!hasTrx) return false;

        // Must contain official payment indicators (bKash/Nagad/Rocket keywords)
        const hasPaymentIndicators = 
          smsText.includes("RECEIVED") ||
          smsText.includes("BALANCE") ||
          smsText.includes("CASH IN") ||
          smsText.includes("PAYMENT") ||
          smsText.includes("REF") ||
          smsText.includes("FEE") ||
          smsText.includes("BKASH") ||
          smsText.includes("NAGAD") ||
          smsText.includes("ROCKET") ||
          smsText.includes("16216");

        return hasPaymentIndicators;
      });

    // 2. Fetch pending transactions from `payments` table
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending');

    // Fetch pending transactions from `donations` table
    const { data: pendingDonations } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'pending');

    const paymentsList = (pendingPayments || []).map(p => ({ ...p, _table: 'payments' as const }));
    const donationsList = (pendingDonations || []).map(d => ({ ...d, _table: 'donations' as const }));

    const allPending = [...paymentsList, ...donationsList];
    result.pendingCount = allPending.length;

    if (allPending.length === 0) {
      return result;
    }

    // 3. Match pending transactions with SMS text
    for (const pending of allPending) {
      const rawTrxId = pending.transaction_id || pending.trx_id || '';
      const cleanTrxId = rawTrxId.toString().trim().toUpperCase();

      if (!cleanTrxId || cleanTrxId.length < 4) continue;

      // Check if any valid payment SMS contains this TrxID
      const matchFound = validPaymentSmsTexts.some(smsText => smsText.includes(cleanTrxId));

      if (matchFound) {
        // Approve this transaction in Supabase
        const targetTable = pending._table;
        const { error: updateError } = await supabase
          .from(targetTable)
          .update({ status: 'approved' })
          .eq('id', pending.id);

        if (!updateError) {
          result.newlyVerifiedCount++;
          result.verifiedDetails.push({
            id: pending.id,
            table: targetTable,
            trxId: cleanTrxId,
            type: pending.type
          });

          // Auto-enroll if course_id and user_id exist
          if (pending.course_id && pending.user_id) {
            try {
              await supabase.from('enrollments').insert({
                user_id: pending.user_id,
                course_id: pending.course_id
              });
            } catch (e) {
              // Ignore if already enrolled
            }

            // Send notification to student
            try {
              await supabase.from('notifications').insert([{
                user_id: pending.user_id,
                title: 'Course Approved 🎉',
                body: 'আপনার কেনা কোর্সটি অ্যাপ্রুভ হয়েছে। এখন আপনি এর কন্টেন্ট দেখতে পারবেন। PolyGuid এর সাথে থাকার জন্য ধন্যবাদ!',
                type: 'course_approved'
              }]);
            } catch (e) {
              // Ignore notification errors
            }
          } else if (targetTable === 'donations' && pending.user_id) {
            try {
              await supabase.from('notifications').insert([{
                user_id: pending.user_id,
                title: 'Donation Auto-Approved 🎉',
                body: `আপনার প্রদানকৃত ডোনেশন ট্রানজেকশন (TrxID: ${cleanTrxId}) অটো-ভেরিফাই ও অ্যাপ্রুভ হয়েছে। ধন্যবাদ!`,
                type: 'donation_approved'
              }]);
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.error('Error during Supabase auto-verification:', err);
    return result;
  }
}
