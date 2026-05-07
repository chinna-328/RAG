// Vercel serverless entry. Exposes the Express app as a single function;
// vercel.json rewrites /api/(.*) to /api/index so all routes flow through here.
export { app as default } from '../server/index.js';
