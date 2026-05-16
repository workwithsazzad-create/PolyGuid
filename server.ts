import fs from "fs";
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Fallback to anon if service role is missing

if (!supabaseUrl) {
  console.warn("WARNING: VITE_SUPABASE_URL is missing. Supabase integration will fail.");
}

const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "");

function getWebhookLogs() {
  try {
    if (fs.existsSync("webhook_logs.json")) {
      const data = fs.readFileSync("webhook_logs.json", "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
}

function saveWebhookLog(logEntry: any) {
  try {
    let logs = getWebhookLogs();
    logs.unshift(logEntry);
    if (logs.length > 50) logs.pop();
    fs.writeFileSync("webhook_logs.json", JSON.stringify(logs, null, 2));
  } catch (e) {}
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: '*/*' })); // Catch raw text/xml/etc

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/webhook-logs", (req, res) => {
    res.json({
      logs: getWebhookLogs(),
      server_time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.get("/api/bteb-notices", async (req, res) => {
    try {
      const response = await axios.get("https://bteb.gov.bd/pages/notices", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const notices: any[] = [];
      
      // Target the notice list based on common gov.bd patterns
      // They usually use a table with tr/td or a specific list class
      $('table tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 2) {
          const titleCell = $(cols[1]);
          const dateCell = $(cols[2]);
          const link = titleCell.find('a').attr('href');
          const title = titleCell.text().trim();
          const date = dateCell.text().trim();

          if (title && title !== "বিষয়") {
            notices.push({
              id: `not-${i}`,
              title,
              date: date || "No Date",
              link: link ? (link.startsWith('http') ? link : `https://bteb.gov.bd${link}`) : "https://bteb.gov.bd/pages/notices",
              isNew: titleCell.find('img[src*="new"]').length > 0 || title.includes("নতুন")
            });
          }
        }
      });

      res.json(notices.slice(0, 30));
    } catch (error: any) {
      console.error("Notice Fetch Error:", error.message);
      // Fallback notices when BTEB is down or returning 503
      res.json([
        {
          id: "bteb-down-notice",
          title: "কারিগরি শিক্ষা বোর্ডের (BTEB) সার্ভারে সমস্যার কারণে সাময়িকভাবে নোটিশ আপডেট হচ্ছে না। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
          date: new Date().toLocaleDateString('en-GB'),
          link: "https://bteb.gov.bd",
          isNew: true
        }
      ]);
    }
  });

  const handleWebhook = async (req: express.Request, res: express.Response) => {
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
    
    // Save locally
    saveWebhookLog(logEntry);

    // PERSISTENT: Save to Supabase for cross-container visibility
    try {
      const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      await supabase.from("webhook_logs").insert([{
        timestamp: logEntry.timestamp,
        payload: payloadString,
        method: req.method
      }]);
    } catch (e) {
      console.warn("Supabase logging failed (Check if 'webhook_logs' table exists):", e);
    }

    console.log("Webhook hit triggered:", logEntry);

    if (req.method === 'GET') {
      return res.status(200).send("✅ Webhook Server for AI Studio is Active! Please use POST method in your SMS App.");
    }

    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        // Not JSON, raw text? 
        payload = { text: payload };
      }
    }

    const { trx_id, transaction_id, message, text } = payload;
    
    let finalMessage = message || text;
    let finalTrxId = trx_id || transaction_id;

    // Log the hit but don't automatically approve anything
    console.log("Manual verification mode active. Auto-update skipped for:", finalTrxId);
    
    return res.status(200).json({ 
      status: "logged", 
      message: "Webhook received and logged. Manual verification required." 
    });
  };

  app.delete("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    try {
      console.log(`Starting to delete user ${userId} and all related data...`);

      // 1. Manually cascade deletes for related tables where user_id references auth.users or public.profiles
      // Using service key bypasses RLS
      await supabase.from('marketplace_books').delete().eq('user_id', userId);
      await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      
      // We DO NOT delete donations. We keep them for transaction history, but unlink the user
      await supabase.from('donations').update({ user_id: null }).eq('user_id', userId);
      
      // We also unlink payments
      await supabase.from('payments').update({ user_id: null }).eq('user_id', userId);
      
      await supabase.from('enrollments').delete().eq('user_id', userId);
      await supabase.from('verification_applications').delete().eq('user_id', userId);
      await supabase.from('notifications').delete().eq('user_id', userId);
      await supabase.from('video_comments').delete().eq('user_id', userId);
      await supabase.from('saved_items').delete().eq('user_id', userId);
      
      // 2. Delete the profile
      await supabase.from('profiles').delete().eq('id', userId);

      // 3. Delete the auth user (only works if SUPABASE_SERVICE_ROLE_KEY is used)
      // We wrap this in a try-catch to not fail the whole request if the service_role key isn't present
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn(`Could not delete from auth.users (requires service role):`, authError.message);
        }
      } catch (authErr: any) {
        console.warn(`Could not delete from auth.users:`, authErr.message);
      }

      console.log(`User ${userId} deleted successfully.`);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user via API:", error);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    const courseId = req.params.id;
    if (!courseId) {
      return res.status(400).json({ error: "Missing course ID" });
    }

    try {
      console.log(`Starting to delete course ${courseId} and all related data...`);

      // Using service key bypasses RLS
      // 1. Delete contents
      await supabase.from('course_content').delete().eq('course_id', courseId);
      
      // 2. Delete enrollments
      await supabase.from('enrollments').delete().eq('course_id', courseId);
      
      // 3. Unlink donations (to keep transaction history but avoid foreign key constraint)
      await supabase.from('donations').update({ course_id: null }).eq('course_id', courseId);
      
      // Unlink payments too
      await supabase.from('payments').update({ course_id: null }).eq('course_id', courseId);
      
      // 4. Finally delete the course
      const { error } = await supabase.from('courses').delete().eq('id', courseId);

      if (error) {
        throw error;
      }

      res.status(200).json({ success: true, message: "Course deleted successfully" });
    } catch (err: any) {
      console.error("Error deleting course:", err);
      res.status(500).json({ error: err.message || "Failed to delete course" });
    }
  });

  app.all("/api/payment-webhook", handleWebhook);
  app.all("/api/payment", handleWebhook);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
