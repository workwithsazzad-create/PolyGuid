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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory store for webhook logs (debugging only)
  let webhookLogs: any[] = [];

  app.get("/api/webhook-logs", (req, res) => {
    res.json({
      logs: webhookLogs,
      server_time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  const handleWebhook = async (req: express.Request, res: express.Response) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      body: req.body,
      headers: {
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"]
      }
    };
    
    webhookLogs.unshift(logEntry);
    if (webhookLogs.length > 50) webhookLogs.pop();

    console.log("Webhook hit triggered:", logEntry);

    const { trx_id, transaction_id, amount, message, text, from } = req.body;
    
    let finalMessage = message || text;
    let finalTrxId = trx_id || transaction_id;
    let finalAmount = amount;

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

    try {
      const { data: results, error: fetchError } = await supabase
        .from("donations")
        .select("*")
        .eq("transaction_id", finalTrxId)
        .eq("status", "pending");
      
      if (fetchError) throw fetchError;
      const transaction = results && results[0];

      if (transaction) {
        await supabase.from("donations").update({ 
          status: "approved", 
          verified_at: new Date().toISOString() 
        }).eq("id", transaction.id);

        if (transaction.type === "course" && transaction.course_id && transaction.user_id) {
          await supabase.from("enrollments").upsert({
            user_id: transaction.user_id,
            course_id: transaction.course_id
          }, { onConflict: 'user_id,course_id' });
        }
        return res.json({ status: "approved", transaction_id: finalTrxId });
      } else {
        return res.json({ status: "received_but_not_matched", trx_id: finalTrxId });
      }
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/payment-webhook", handleWebhook);
  app.post("/api/payment", handleWebhook);

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
