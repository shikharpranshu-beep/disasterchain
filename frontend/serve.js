const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, 'build');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  let reqPath = req.url.split('?')[0];
  let filePath = path.join(BUILD_DIR, reqPath);

  // If path is a directory or file doesn't exist (SPA routing), fallback to index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Serve index.html for all client-side React routes
    const indexPath = path.join(BUILD_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DisasterChain Frontend is live on http://localhost:${PORT}`);
});
