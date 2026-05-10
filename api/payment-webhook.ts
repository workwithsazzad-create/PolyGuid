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
  } catch (e) {
    console.warn("Supabase logging failed", e);
  }

  return res.status(200).json({ 
    status: "logged", 
    message: "Webhook received and logged. Manual verification required." 
  });
}
