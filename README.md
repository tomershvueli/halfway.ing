# Halfway.ing - Find Your Midpoint

A **100% frontend-only** collaborative web application that helps multiple users find a geographic midpoint and discover nearby Points of Interest (POIs). Built with real-time peer-to-peer communication using WebRTC and PeerJS - **no backend server required!**

## Features

### 🏠 Room Management
- **Unique URLs**: Each room gets a shareable URL (e.g., `halfway.ing/cute-pink-bear`)
- **Auto Expiration**: Rooms expire after 5 days of inactivity (localStorage cleanup)
- **Editable Titles**: Users can edit room titles with real-time updates
- **Anonymous Access**: No authentication required - just join and collaborate

### 👥 User Management
- **Auto-generated Pseudonyms**: Users get names like `Anonymous-BrightHawk386`
- **Real-time Sync**: All updates instantly sync across participants via WebRTC
- **Multiple Locations**: Users can add multiple locations per person
- **Geolocation Support**: Use browser location or enter addresses manually

### 📍 Geographic Features
- **Dynamic Midpoint**: Automatically calculated from all user locations
- **Real-time Updates**: Midpoint recalculates when locations change
- **Geocoding**: Address-to-coordinates conversion with caching

### 🍽️ Points of Interest
- **Categorized POIs**: Restaurants, Fast Food, Cafes, Bars, Other
- **Smart Filtering**: Filter by category and availability ("Open now")
- **Detailed Information**: Name, address, star rating, pricing level
- **Google Maps Integration**: Click to open location in Google Maps
- **Expandable Search**: Increases radius if no POIs found initially

### 🔗 Real-time Communication
- **WebRTC**: Direct peer-to-peer data sharing - **no server required!**
- **PeerJS**: Uses public PeerJS signaling servers for initial connection
- **Public STUN/TURN**: Uses publicly available servers for NAT traversal
- **Low Latency**: Direct client-to-client communication
- **Data Sync**: All room data syncs through WebRTC data channels

### 🎨 User Experience
- **Responsive Design**: Works on mobile and desktop
- **Theme Support**: Light, dark, and high-contrast modes
- **Accessibility**: WCAG compliant with keyboard navigation
- **Toast Notifications**: Non-blocking error and info messages
- **Connection Status**: Visual indicators showing peer connection status

## Setup Instructions

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Google Maps API key
- Web server for serving static files (HTTPS required for geolocation)

### Google Maps API Setup

1. **Get a Google Maps API Key**:
   - Visit the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Geocoding API
     - Places API
   - Create credentials (API key)
   - Restrict the API key to your domain for security

2. **Configure the API Key**:
   - Open `app.js`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key (should already be done)

### Local Development

**Option 1: Simple HTTP Server**
```bash
# Using Node.js with SPA support (RECOMMENDED)
# Install http-server first: npm install -g http-server
http-server -p 8000 --spa

# Using Python 3 (basic - may have routing issues)
python -m http.server 8000

# Using PHP (basic - may have routing issues)
php -S localhost:8000
```

**🚨 CRITICAL: Server Setup for Room URLs**

**✅ WORKING METHOD:**
```bash
# Install and use http-server with SPA support
npm install -g http-server
http-server -p 8000 --spa
```

**❌ BROKEN METHODS (cause 404s):**
- `python -m http.server 8000` ❌
- `php -S localhost:8000` ❌  
- `http-server -p 8000` (without --spa) ❌

**🧪 Test Your Setup:**
1. Start server: `http-server -p 8000 --spa`
2. Go to: `localhost:8000/test-routing.html` 
3. ✅ Should show "Routing Test Page" (not 404)
4. Go to: `localhost:8000/pink-fuzzy-bunny`
5. ✅ Should load the main app (not 404)

**🆘 Emergency Fallback Server:**
If http-server isn't working, use our test server:
```bash
node server-test.js
```

**Option 2: HTTPS for Full Functionality**
```bash
# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Using Node.js with HTTPS
npx http-server -p 8000 -S -C cert.pem -K key.pem --spa
```

### Production Deployment

Since this is a **frontend-only application**, you can deploy it anywhere that serves static files:

#### Option 1: Static Hosting Services
- **Netlify**: Just drag and drop your files or connect to Git
- **Vercel**: Deploy with `vercel` command
- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Firebase Hosting**: Use `firebase deploy`
- **Cloudflare Pages**: Connect to Git repository

#### Option 2: Traditional Web Servers

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name halfway.ing www.halfway.ing;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name halfway.ing www.halfway.ing;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    root /var/www/halfway.ing;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache Configuration**:
```apache
<VirtualHost *:443>
    ServerName halfway.ing
    DocumentRoot /var/www/halfway.ing
    
    SSLEngine on
    SSLCertificateFile /path/to/fullchain.pem
    SSLCertificateKeyFile /path/to/privkey.pem
    
    # Handle SPA routing
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # Cache static assets
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
</VirtualHost>
```

#### Option 3: CDN Deployment

Deploy to any CDN that supports static files:
- **AWS S3 + CloudFront**
- **Google Cloud Storage + CDN**
- **Azure Blob Storage + CDN**

## How It Works (No Backend Required!)

### 1. Room Discovery
- First user creates a room and becomes the "host"
- Room information is stored in localStorage
- Subsequent users joining the same room URL connect to the host via WebRTC

### 2. WebRTC Signaling
- Uses **PeerJS** with public signaling servers (no custom server needed)
- PeerJS handles the initial WebRTC handshake
- Once connected, all communication is direct peer-to-peer

### 3. Data Synchronization
- All room data (users, locations, etc.) is synced through WebRTC data channels
- Host maintains the authoritative room state
- New users receive full room state upon joining
- Updates are broadcasted to all connected peers

### 4. Fault Tolerance
- If the host disconnects, another user can become the new host
- Room data persists in localStorage for recovery
- Automatic reconnection attempts if connections fail

## Technical Architecture

### Frontend-Only Stack
- **HTML/CSS/JavaScript**: Core application
- **PeerJS**: WebRTC abstraction and signaling
- **WebRTC Data Channels**: Direct peer-to-peer communication
- **localStorage**: Room persistence and recovery
- **Google Maps APIs**: Geocoding and Places data

### No Backend Components
- ❌ No custom server
- ❌ No database
- ❌ No authentication system
- ❌ No API endpoints
- ✅ 100% client-side application

### Public Services Used
- **PeerJS Cloud**: Public signaling servers
- **Google STUN servers**: NAT traversal
- **Free TURN servers**: Relay fallback
- **Google Maps APIs**: Geocoding and Places

## Browser Support

- **Chrome**: 60+ (full support)
- **Firefox**: 60+ (full support)
- **Safari**: 12+ (full support)
- **Edge**: 79+ (full support)

## Security Considerations

- **HTTPS Required**: For geolocation and WebRTC functionality
- **API Key Security**: Restrict Google Maps API key to your domain
- **No Authentication**: By design - rooms are public but obscured by unique URLs
- **Data Privacy**: All communication happens client-side or peer-to-peer
- **Room Isolation**: Each room is completely separate

## Troubleshooting

### Common Issues

1. **"Connection error" messages**:
   - Ensure HTTPS is enabled
   - Check browser console for WebRTC errors
   - Verify firewall/NAT settings allow WebRTC

2. **"Failed to get location"**:
   - Ensure HTTPS is enabled
   - Check browser location permissions
   - Verify geolocation is supported

3. **"Failed to geocode address"**:
   - Verify Google Maps API key is correct
   - Check API key has Geocoding API enabled
   - Ensure API key isn't restricted to wrong domain

4. **"Failed to fetch nearby places"**:
   - Verify Places API is enabled
   - Check API quotas and billing
   - Ensure API key has Places API access

5. **Users can't connect to each other**:
   - Both users must be on HTTPS
   - Check that WebRTC is enabled in browsers
   - Verify STUN/TURN servers are accessible
   - Try in incognito/private browsing mode

### Development Tips

- Use browser developer tools to monitor WebRTC connections
- Check console for peer connection errors
- Test with multiple browser windows/tabs
- Use different browsers to simulate different users
- Monitor localStorage for room data persistence

## Deployment Examples

### Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### GitHub Pages
1. Create a GitHub repository
2. Upload your files
3. Go to repository Settings > Pages
4. Select source branch (usually `main`)
5. Your site will be available at `https://username.github.io/repository-name`

## Performance Optimization

- **Caching**: Static assets are cached for 1 year
- **Compression**: Enable gzip compression on your server
- **CDN**: Use a CDN for global distribution
- **Lazy Loading**: POIs are only fetched when needed
- **Geocoding Cache**: Addresses are cached locally to reduce API calls

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially WebRTC functionality)
5. Submit a pull request

## Future Enhancements

- ✅ **Frontend-only architecture** (✅ Complete)
- ✅ **Real-time WebRTC communication** (✅ Complete)
- ✅ **Public STUN/TURN servers** (✅ Complete)
- 🔄 **Room password protection** (via WebRTC encryption)
- 🔄 **Advanced POI filtering** (distance, cuisine type)
- 🔄 **Multilingual support**
- 🔄 **Offline functionality** (PWA)
- 🔄 **Mobile app versions** (PWA to native)

---

**🎉 This application is now 100% frontend-only with no backend dependencies!** 

Deploy it anywhere that serves static files and enjoy real-time collaboration powered by WebRTC.