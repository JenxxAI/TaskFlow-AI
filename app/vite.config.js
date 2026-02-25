import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite plugin: proxies /api/gemini to Google's API, injecting the key server-side
// so the secret never reaches the browser bundle.
function geminiProxy(apiKey) {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return; }
        if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured' })); return; }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const upstream = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
            );
            const data = await upstream.text();
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch (e) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL env vars (not just VITE_*)
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), geminiProxy(env.GEMINI_API_KEY)],
  };
})
