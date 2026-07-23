import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";
import cors from 'cors';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

function runMiddleware(req: VercelRequest, res: VercelResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await runMiddleware(req, res, corsMiddleware);

  if (req.method === 'GET') {
    return res.status(200).send("✅ Webhook Server for AI Studio is Active on Vercel! Please use POST method.");
  }

  const logEntry = {
    method: req.method,
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query,
    headers: {
      "user-agent": req.headers["user-agent"],
      "content-type": req.headers["content-type"]
    }
  };

  try {
    const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    await supabase.from("webhook_logs").insert([{
      timestamp: logEntry.timestamp,
      payload: payloadString,
      method: req.method
    }]);
    
    // --- AUTO VERIFICATION LOGIC ---
    let payload = req.body || {};
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) { payload = { text: payload }; }
    }

    // Extract SMS text
    const smsText = (payload.message || payload.text || payload.content || payload.sms || payloadString || "").toUpperCase();
    
    // Find TrxID in the text
    const match = smsText.match(/(?:TRXID|TXNID|TRX ID|TXN ID)[\s:]*([A-Z0-9]{8,12})/i);
    let trxId = payload.trx_id || payload.transaction_id || payload.TrxID || payload.trxId;
    
    if (!trxId && match && match[1]) {
      trxId = match[1];
    }

    if (!trxId) {
      return res.status(200).json({ status: "logged", message: "No TrxID found. Logged for manual review." });
    }

    // Look for pending transactions
    let tx = null;
    let tableName = 'payments';
    
    // Check payments table
    let { data: pData } = await supabase.from('payments').select('*').ilike('trx_id', trxId).eq('status', 'pending').maybeSingle();
    
    if (pData) {
      tx = pData;
    } else {
      // Check donations table
      let { data: dData } = await supabase.from('donations').select('*').ilike('trx_id', trxId).eq('status', 'pending').maybeSingle();
      if (dData) {
        tx = dData;
        tableName = 'donations';
      }
    }

    if (!tx) {
      return res.status(200).json({ status: "logged", message: `TrxID ${trxId} logged but no matching pending transaction found.` });
    }

    // Update status to approved
    await supabase.from(tableName).update({ status: 'approved' }).eq('id', tx.id);

    // Enroll and Notify
    if (tx.course_id && tx.user_id) {
      try {
        await supabase.from('enrollments').insert({ user_id: tx.user_id, course_id: tx.course_id });
      } catch(e) {} // ignore if already enrolled
      
      await supabase.from('notifications').insert([{
        user_id: tx.user_id,
        title: `${tx.type === 'book' || tx.type === 'pdf' ? 'Book' : 'Course'} Approved 🎉`,
        body: `আপনার কেনা ${tx.type === 'book' || tx.type === 'pdf' ? 'বই' : 'কোর্সটি'} অ্যাপ্রুভ হয়েছে।`,
        type: 'course_approved'
      }]);
    } else if (tableName === 'donations' && tx.user_id) {
      await supabase.from('notifications').insert([{
        user_id: tx.user_id,
        title: 'Donation Approved 🎉',
        body: 'অভিনন্দন! আপনার ডোনেশনটি অ্যাপ্রুভ হয়েছে।',
        type: 'donation_approved'
      }]);
    }

    return res.status(200).json({ status: "success", message: `Transaction ${trxId} auto-approved successfully!` });

  } catch (e) {
    console.error("Webhook processing error:", e);
    return res.status(500).json({ status: "error", message: "Failed to process webhook" });
  }
}
