const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simulate static hosting behavior (like GitHub Pages)
// - Only serves files that actually exist
// - Returns 404 for non-existent paths
// - Hash fragments are client-side only (never sent to server)

function createStaticServer(rootDir, port = 8003) {
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;
        
        // Remove trailing slash except for root
        if (pathname !== '/' && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        
        // Convert root to index.html
        if (pathname === '/') {
            pathname = '/index.html';
        }
        
        const filePath = path.join(rootDir, pathname);
        
        console.log(`📝 Request: ${pathname} -> ${filePath}`);
        
        // Only serve files that actually exist (like GitHub Pages)
        fs.stat(filePath, (err, stats) => {
            if (!err && stats.isFile()) {
                // File exists, serve it
                serveFile(filePath, res);
            } else {
                // File doesn't exist - return 404 (like static hosting)
                console.log(`❌ File not found: ${filePath}`);
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end('<h1>404 - Not Found</h1><p>GitHub Pages would show this error</p>');
            }
        });
    });
    
    function serveFile(filePath, res) {
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json'
        };
        const mimeType = mimeTypes[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
                return;
            }
            
            console.log(`✅ Served: ${filePath}`);
            res.writeHead(200, {'Content-Type': mimeType});
            res.end(data);
        });
    }
    
    server.listen(port, () => {
        console.log(`🌐 Static hosting simulation on http://localhost:${port}`);
        console.log(`📁 Root directory: ${path.resolve(rootDir)}`);
        console.log('');
        console.log('🧪 Test these URLs to see how static hosting works:');
        console.log(`   ✅ http://localhost:${port}/                (serves index.html)`);
        console.log(`   ✅ http://localhost:${port}/#pink-bunny     (hash is client-side)`);
        console.log(`   ❌ http://localhost:${port}/pink-bunny      (404 - path doesn't exist)`);
        console.log(`   ✅ http://localhost:${port}/#any-room-name  (hash routing works!)`);
        console.log('');
        console.log('Press Ctrl+C to stop');
    });
    
    return server;
}

// Run the static hosting simulation
const rootDir = process.argv[2] || 'dist';
const port = parseInt(process.argv[3]) || 8003;

if (!fs.existsSync(rootDir)) {
    console.error(`❌ Directory not found: ${rootDir}`);
    process.exit(1);
}

const server = createStaticServer(rootDir, port);

process.on('SIGINT', () => {
    console.log('\n👋 Stopping static hosting simulation...');
    server.close(() => {
        process.exit(0);
    });
});