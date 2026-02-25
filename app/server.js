/* global process */
// Lightweight production server — serves the Vite build and proxies /api/gemini
// so the API key is never exposed to the browser.
//
// Usage:
//   GEMINI_API_KEY=your-key node server.js
//   (or set GEMINI_API_KEY in a .env file and use dotenv)

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = resolve(__dirname, "dist");
const PORT = process.env.PORT || 4173;
const API_KEY = process.env.GEMINI_API_KEY;

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".woff2":"font/woff2",
};

function serveStatic(res, urlPath) {
  let file = join(DIST, urlPath);
  if (!existsSync(file) || urlPath === "/") file = join(DIST, "index.html");
  const ext = extname(file);
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(readFileSync(file));
}

const server = createServer(async (req, res) => {
  // ── Gemini proxy endpoint ──
  if (req.method === "POST" && req.url === "/api/gemini") {
    if (!API_KEY) { res.writeHead(500); res.end(JSON.stringify({ error: "GEMINI_API_KEY not set" })); return; }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body },
        );
        const data = await upstream.text();
        res.setHeader("Content-Type", "application/json");
        res.end(data);
      } catch (e) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Static files / SPA fallback ──
  serveStatic(res, req.url);
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
