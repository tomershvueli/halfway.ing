# **Halfway.ing Application Specifications**

## **Overview**
**Halfway.ing** is a collaborative web application designed to help multiple users find a geographic midpoint and identify nearby Points of Interest (POIs). It supports real-time updates and peer-to-peer communication using **WebRTC**, minimizing server load. The application is optimized for mobile and desktop usage, offering features like light/dark mode, accessibility options, and dynamic updates.

---

## **Features**

### **1. Room Management**
- **Room URL:** Each room is assigned a unique, shareable URL (e.g., `halfway.ing/cute-pink-bear`).
- **Auto Expiration:** Rooms expire 5 days after the last activity.
- **Room Title Editing:** Users can edit the room title. Updates are visible to all participants in real time.
- **No Authentication:** Users join anonymously with pseudonyms (e.g., `Anonymous-BrightHawk386`).

### **2. User Management**
- **Pseudonyms:** Automatically assigned to users. Users can update their name at any time.
- **Real-Time Sync:** All updates are instantly synced across participants.
- **Location Management:** Users can:
  - Use their browser’s geolocation for the current location.
  - Enter addresses manually, which are geocoded via Google Maps API.
  - Add multiple locations.

### **3. Geographic Midpoint Calculation**
- Dynamically calculated based on all submitted locations.
- Recalculated immediately upon location changes.
- Username changes do not trigger recalculation.

### **4. Points of Interest (POIs)**
- **Categories:** POIs are grouped into:
  - Restaurants
  - Fast Food
  - Cafes
  - Bars
  - Other
- **Filters:** POIs can be filtered by:
  - Category
  - Availability (e.g., “Open now”).
- **Details Displayed:** For each POI:
  - Name
  - Address
  - Star Rating
  - Pricing Level
- **Action:** Clicking on a POI opens its location in Google Maps (new tab).
- **Fallback:** If no POIs are found near the midpoint, the search radius expands until results are available.

### **5. Real-Time Communication**
- **WebRTC:** Used for peer-to-peer data sharing. The server is only utilized for signaling.
- **Public STUN/TURN servers:** Use publicly available STUN/TURN servers.
- **Data Updates:** Includes updates for:
  - Usernames
  - Locations
  - Room titles
- **Low Latency:** Direct client-to-client communication ensures minimal delay.

### **6. Error Handling**
- **Toast Notifications:** Non-blocking messages for:
  - Errors (e.g., failed geocode lookups, API limits).
  - Informational updates (e.g., “Location added”).

### **7. Accessibility**
- **Themes:** Light mode, dark mode, and high-contrast themes.
- **WCAG Compliance:** Supports keyboard navigation and screen reader compatibility.

### **8. Mobile Responsiveness**
- Fully responsive design for optimal usage on both mobile and desktop devices.

---

## **Technical Requirements**

### **1. Real-Time Communication**
- **Protocol:** WebRTC with a lightweight WebSocket server for signaling.
- **Data Channels:** Used for transmitting room updates (locations, usernames, etc.) between peers.

### **2. Google Maps Integration**
- **APIs Used:**
  - Geocoding API for address lookup.
  - Places API for fetching POIs near the midpoint.
- **Optimization:**
  - Cache geocoding results locally to reduce redundant API calls.
  - Expand the search radius for POIs dynamically if results are unavailable.

### **3. Performance**
- **Server Load:** Minimal, as most communication happens peer-to-peer via WebRTC.
- **Client-Side Logic:** Handles midpoint calculations, POI fetching, and real-time updates.

### **4. Scalability**
- **Rooms:** Unlimited simultaneous rooms supported.
- **Participants:** Optimized for small-to-medium groups (~10 participants per room).

### **5. Error Handling**
- Centralized toast notifications for user-friendly error reporting and updates.

### **6. Stack**
- This application should work entirely in the front end. Leveraging publicly available STUN/TURN servers with WebRTC, all client should be able to communicate with each other, rendering the need for a server obsolete. 

---

## **Non-Functional Requirements**
- **Cross-Browser Compatibility:** Support for the latest versions of Chrome, Firefox, Safari, and Edge.
- **Mobile-Friendly:** Fully functional and intuitive UI on mobile devices.
- **Security:** Use HTTPS for secure data transmission.

---

## **Out of Scope**
- Password-protected rooms.
- Advanced POI details (e.g., photos).
- User authentication or login.

---

## **Future Enhancements**
- **Password-Protected Rooms:** Allow users to set a password for private rooms.
- **Advanced Filters:** Add more filters for POIs (e.g., distance range, type of cuisine).
- **Multilingual Support:** Provide translations for the UI.

---
