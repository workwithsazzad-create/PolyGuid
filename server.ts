import fs from "fs";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

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
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: '*/*' })); // Catch raw text/xml/etc

  app.get("/api/webhook-logs", (req, res) => {
    res.json({
      logs: getWebhookLogs(),
      server_time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
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
    
    saveWebhookLog(logEntry);

    console.log("Webhook hit triggered:", logEntry);

    if (req.method === 'GET') {
      return res.status(200).send("✅ Webhook Server for AI Studio is Active! Please use POST method in your SMS App.");
    }

    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        // Not JSON, maybe raw text? 
        payload = { text: payload };
      }
    }

    const { trx_id, transaction_id, amount, message, text, from } = payload;
    
    let finalMessage = message || text;
    let finalTrxId = trx_id || transaction_id;
    let finalAmount = amount;

    // Handle messages forwarded via Gmail (Apps Script adds "Incoming - ..." or similar)
    if (finalMessage && finalMessage.includes("Message:")) {
      const parts = finalMessage.split("Message:");
      if (parts.length > 1) finalMessage = parts[1].trim();
    }
    
    if (finalMessage && !finalTrxId) {
      const trxMatch = finalMessage.match(/TrxID[:\s]+([A-Z0-9]+)/i);
      const amountMatch = finalMessage.match(/(?:Tk|Amount|Taka)[:\s]*(\d+(?:\.\d+)?)/i);
      
      if (trxMatch) finalTrxId = trxMatch[1];
      if (amountMatch) finalAmount = parseFloat(amountMatch[1]);
    }

    if (!finalTrxId) {
      // Even if no TrxID, we return 200 so the SMS app doesn't retry infinitely
      return res.status(200).json({ status: "logged_no_trxid" });
    }

    const cleanTrxId = finalTrxId.toString().trim().toUpperCase();

    try {
      const { data: results, error: fetchError } = await supabase
        .from("donations")
        .select("*")
        .eq("transaction_id", cleanTrxId)
        .eq("status", "pending");
      
      if (fetchError) throw fetchError;
      const transaction = results && results[0];

      if (transaction) {
        // Approve transaction
        await supabase.from("donations").update({ 
          status: "approved", 
          verified_at: new Date().toISOString() 
        }).eq("id", transaction.id);

        // Auto-enroll if it's a course purchase
        if (transaction.type === "course" && transaction.course_id && transaction.user_id) {
          await supabase.from("enrollments").upsert({
            user_id: transaction.user_id,
            course_id: transaction.course_id
          }, { onConflict: 'user_id,course_id' });
        }
        return res.json({ status: "approved", transaction_id: cleanTrxId });
      } else {
        return res.json({ status: "received_but_not_matched", trx_id: cleanTrxId });
      }
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return res.status(500).json({ error: err.message });
    }
  };

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
