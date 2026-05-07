import fs from "fs";
import express from "express";
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
  app.use(express.urlencoded({ extended: true }));
  app.use(express.text({ type: '*/*' })); // Catch raw text/xml/etc

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
      res.status(500).json({ error: "Failed to fetch notices" });
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
