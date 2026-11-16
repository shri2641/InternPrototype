import { handleApiRequest } from './apiHandler.js';

export default function viteApiPlugin() {
  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        try {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
          
          let body = null;
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString();
            if (rawBody) {
              try {
                body = JSON.parse(rawBody);
              } catch {
                body = {};
              }
            }
          }

          const response = handleApiRequest(req.url, req.method, body, queryParams);
          
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          res.statusCode = response.status || 200;
          return res.end(JSON.stringify(response.data));
        } catch (err) {
          console.error('API Error in Vite Plugin:', err);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
        }
      });
    }
  };
}
