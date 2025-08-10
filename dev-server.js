const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function createServer(rootDir, port = 8000) {
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;
        
        // Remove trailing slash except for root
        if (pathname !== '/' && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        
        const filePath = path.join(rootDir, pathname);
        
        // Security check - prevent directory traversal
        const resolvedRootDir = path.resolve(rootDir);
        const resolvedFilePath = path.resolve(filePath);
        if (!resolvedFilePath.startsWith(resolvedRootDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        // Check if file exists
        fs.stat(filePath, (err, stats) => {
            if (!err && stats.isFile()) {
                // File exists, serve it
                serveFile(filePath, res);
            } else {
                // File doesn't exist - check if it's a potential room route
                // Serve index.html for any route that doesn't have a file extension
                const ext = path.extname(pathname);
                if (!ext) {
                    // This looks like a client-side route (e.g., /room-name)
                    const indexPath = path.join(rootDir, 'index.html');
                    serveFile(indexPath, res);
                } else {
                    // File with extension not found
                    res.writeHead(404);
                    res.end('Not Found');
                }
            }
        });
    });
    
    function serveFile(filePath, res) {
        const ext = path.extname(filePath);
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
                return;
            }
            
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        });
    }
    
    server.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
        console.log(`📁 Serving files from: ${path.resolve(rootDir)}`);
        console.log('🔄 Client-side routing enabled (SPA support)');
        console.log('');
        console.log('Try these URLs:');
        console.log(`   http://localhost:${port}/`);
        console.log(`   http://localhost:${port}/happy-blue-cat`);
        console.log(`   http://localhost:${port}/any-room-name`);
        console.log('');
        console.log('Press Ctrl+C to stop');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down server...');
        server.close(() => {
            console.log('✅ Server stopped');
            process.exit(0);
        });
    });
    
    return server;
}

// Check command line arguments
const args = process.argv.slice(2);
const rootDir = args[0] || '.';
const port = parseInt(args[1]) || 8000;

// Verify root directory exists
if (!fs.existsSync(rootDir)) {
    console.error(`❌ Directory not found: ${rootDir}`);
    process.exit(1);
}

// Check if it's a directory
fs.stat(rootDir, (err, stats) => {
    if (err || !stats.isDirectory()) {
        console.error(`❌ Not a valid directory: ${rootDir}`);
        process.exit(1);
    }
    
    // Check for index.html
    const indexPath = path.join(rootDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.warn(`⚠️  Warning: index.html not found in ${rootDir}`);
    }
    
    createServer(rootDir, port);
});