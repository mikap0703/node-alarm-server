import { handler } from './build/handler.js';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 3000;
const backend = 3001;

app.use(
    '/api',
    createProxyMiddleware({
        target: 'http://localhost:3001/api',
        changeOrigin: true,
    })
);

app.use(handler);

app.listen(port, () => {
    console.log(`Wine Diagnostic Frontend listening on port ${port}`);
    console.log(`Reverse proxy forwarding to port ${backend}`);
});