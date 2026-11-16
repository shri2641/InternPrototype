import http from 'http';
import { handleApiRequest } from './apiHandler.js';

const PORT = process.env.PORT || 5001;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.url.startsWith('/api')) {
    try {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());

      let body = null;
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const raw = Buffer.concat(buffers).toString();
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = {};
          }
        }
      }

      const response = handleApiRequest(req.url, req.method, body, queryParams);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = response.status || 200;
      return res.end(JSON.stringify(response.data));
    } catch (err) {
      console.error('Server error:', err);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[Inventory API Server] running on http://localhost:${PORT}`);
});
