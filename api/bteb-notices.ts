import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

// Initialize the cors middleware
const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Run the middleware
  await runMiddleware(req, res, corsMiddleware);

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
}
