const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Build configuration
const config = {
    // Order matters - dependencies should come first
    jsFiles: [
        'js/Router.js',
        'js/RoomManager.js', 
        'js/UserManager.js',
        'js/MapsService.js',
        'js/UIManager.js',
        'js/WebRTCManager.js',
        'js/HalfwayApp.js'
    ],
    outputDir: 'dist',
    outputFile: 'app.min.js',
    filesToCopy: [
        'index.html',
        'styles.css',
        '_redirects'
    ]
};

async function build() {
    console.log('🚀 Starting build process...');
    
    // Clean and create dist directory
    if (fs.existsSync(config.outputDir)) {
        fs.rmSync(config.outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(config.outputDir, { recursive: true });
    console.log('📁 Created dist directory');
    
    // Combine all JS files
    let combinedJS = '';
    for (const file of config.jsFiles) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            combinedJS += `\n// === ${file} ===\n${content}\n`;
            console.log(`✅ Added ${file}`);
        } else {
            console.warn(`⚠️  File not found: ${file}`);
        }
    }
    
    // Minify the combined JS
    console.log('🗜️  Minifying JavaScript...');
    try {
        const minified = await minify(combinedJS, {
            compress: {
                drop_console: false, // Keep console.log for debugging
                drop_debugger: true,
                passes: 2
            },
            mangle: {
                keep_classnames: true, // Keep class names for functionality
                keep_fnames: true      // Keep function names for debugging
            },
            format: {
                comments: false
            }
        });
        
        if (minified.error) {
            throw minified.error;
        }
        
        // Write minified JS
        const outputPath = path.join(config.outputDir, config.outputFile);
        fs.writeFileSync(outputPath, minified.code);
        console.log(`✅ Created ${config.outputFile}`);
        
        // Show size reduction
        const originalSize = combinedJS.length;
        const minifiedSize = minified.code.length;
        const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        console.log(`📊 Size: ${originalSize} → ${minifiedSize} bytes (${reduction}% reduction)`);
        
    } catch (error) {
        console.error('❌ Minification failed:', error);
        // Fall back to unminified version
        const outputPath = path.join(config.outputDir, config.outputFile);
        fs.writeFileSync(outputPath, combinedJS);
        console.log('⚠️  Saved unminified version instead');
    }
    
    // Copy and modify index.html
    console.log('📝 Processing index.html...');
    let html = fs.readFileSync('index.html', 'utf8');
    
    // Replace individual script tags with single minified version
    const scriptRegex = /<!-- Application modules -->\s*(?:<script src="js\/[^"]+"><\/script>\s*)*/g;
    html = html.replace(scriptRegex, `<!-- Application modules -->\n    <script src="${config.outputFile}"></script>`);
    
    fs.writeFileSync(path.join(config.outputDir, 'index.html'), html);
    console.log('✅ Created index.html');
    
    // Copy other files
    for (const file of config.filesToCopy) {
        if (file === 'index.html') continue; // Already handled above
        
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(config.outputDir, path.basename(file)));
            console.log(`✅ Copied ${file}`);
        } else {
            console.warn(`⚠️  File not found: ${file}`);
        }
    }
    
    // Create a deployment-ready README
    const deployReadme = `# Halfway.ing - Production Build

This directory contains the production-ready build of the Halfway.ing app.

## Files included:
- index.html (modified to use minified JS)
- ${config.outputFile} (combined and minified JavaScript)
- styles.css (original CSS file)
- _redirects (Netlify redirects configuration)

## Deployment:
Simply upload the contents of this directory to your web server or hosting platform.

## External Dependencies:
The app requires these external services to be loaded from CDN:
- PeerJS: https://unpkg.com/peerjs@1.5.1/dist/peerjs.min.js
- Google Maps API: https://maps.googleapis.com/maps/api/js

Built on: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(path.join(config.outputDir, 'README.md'), deployReadme);
    console.log('✅ Created deployment README');
    
    console.log('🎉 Build complete! Files are ready in the dist/ directory');
    console.log('📦 Deploy the contents of the dist/ directory to your web server');
}

// Run the build
build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});