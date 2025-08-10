// Simple server test to check routing
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log('Request:', req.method, req.url);
    
    // Always serve index.html for any path that doesn't match a file
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Check if it's a file request
    if (req.url.includes('.')) {
        // Serve the actual file
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json'
            }[ext] || 'text/plain';
            
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404);
            res.end('File not found');
        }
    } else {
        // Serve index.html for all other paths (SPA routing)
        const indexPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(indexPath).pipe(res);
        } else {
            res.writeHead(404);
            res.end('index.html not found');
        }
    }
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Try accessing:');
    console.log('- http://localhost:8000/');
    console.log('- http://localhost:8000/pink-fuzzy-bunny');
    console.log('- http://localhost:8000/test-routing.html');
});