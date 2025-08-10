class RoomManager {
    constructor() {
        this.roomId = null;
        this.roomData = null;
        this.isHost = false;
        this.hostPeerId = null;
    }

    initialize() {
        this.roomId = this.getRoomIdFromUrl() || this.generateRoomId();
        this.updateUrlWithRoomId();
        this.updateRoomUrlDisplay();
        
        // Initialize room data
        this.roomData = {
            id: this.roomId,
            title: `Room ${this.roomId}`,
            hostPeerId: null,
            users: new Map(),
            lastActivity: Date.now()
        };

        // Set initial room title display
        const roomTitleDisplay = document.getElementById('room-title-display');
        if (roomTitleDisplay) {
            roomTitleDisplay.textContent = `Room: ${this.roomData.id}`;
        }

        return this.roomId;
    }

    getRoomIdFromUrl() {
        const hash = window.location.hash;
        console.log('RoomManager: Extracting room ID from hash:', hash);
        
        if (!hash || hash === '#') return null;
        
        // Remove the # symbol and get the room ID
        const roomId = hash.substring(1);
        
        // Filter out invalid room IDs
        const invalidIds = ['index.html', 'index.htm', 'app.js', 'styles.css', 'js', 'css'];
        if (invalidIds.includes(roomId.toLowerCase()) || roomId.includes('.') || roomId.includes('/')) {
            console.log('RoomManager: Invalid room ID detected:', roomId, 'generating new one');
            return null;
        }
        
        // Validate room ID format (letters, numbers, hyphens only)
        if (!/^[a-zA-Z0-9-]+$/.test(roomId)) {
            console.log('RoomManager: Invalid room ID format:', roomId, 'generating new one');
            return null;
        }
        
        console.log('RoomManager: Valid room ID extracted:', roomId);
        return roomId;
    }

    generateRoomId() {
        const adjectives = ['happy', 'bright', 'cool', 'swift', 'brave', 'calm', 'clever', 'gentle', 'kind', 'wise'];
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'magenta', 'lime'];
        const animals = ['cat', 'dog', 'bird', 'fish', 'bear', 'lion', 'tiger', 'wolf', 'fox', 'deer'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        
        return `${adj}-${color}-${animal}`;
    }

    updateUrlWithRoomId() {
        const currentHash = window.location.hash;
        const expectedHash = `#${this.roomId}`;
        
        // Only update URL if it's different from what we expect
        if (currentHash !== expectedHash) {
            const newUrl = `${window.location.origin}${window.location.pathname}#${this.roomId}`;
            console.log('RoomManager: Updating URL from', currentHash, 'to', expectedHash);
            window.history.replaceState({}, '', newUrl);
        } else {
            console.log('RoomManager: URL already correct:', currentHash);
        }
    }

    updateRoomUrlDisplay() {
        const roomUrlElement = document.getElementById('room-url');
        if (roomUrlElement) {
            roomUrlElement.textContent = `halfway.ing/#${this.roomId}`;
        }
    }

    updateRoomTitle(title) {
        if (title && title.trim() !== '') {
            this.roomData.title = title.trim();
            this.saveRoomToStorage();
            
            // Update the display
            const roomTitleDisplay = document.getElementById('room-title-display');
            if (roomTitleDisplay) {
                roomTitleDisplay.textContent = `Room: ${title.trim()}`;
            }
            
            return title.trim();
        }
        return null;
    }

    copyRoomUrl() {
        const url = `${window.location.origin}/#${this.roomId}`;
        return navigator.clipboard.writeText(url);
    }

    saveRoomToStorage(users = []) {
        const roomData = {
            id: this.roomId,
            title: this.roomData.title,
            hostPeerId: this.hostPeerId,
            users: Array.isArray(users) ? users : Array.from(users.values ? users.values() : []),
            lastActivity: Date.now()
        };
        
        localStorage.setItem(`room_${this.roomId}`, JSON.stringify(roomData));
    }

    loadRoomFromStorage() {
        const roomData = localStorage.getItem(`room_${this.roomId}`);
        return roomData ? JSON.parse(roomData) : null;
    }

    becomeHost(peerId) {
        this.isHost = true;
        this.hostPeerId = peerId;
        this.roomData.hostPeerId = peerId;
        this.saveRoomToStorage();
        return true;
    }

    setHost(peerId) {
        this.hostPeerId = peerId;
        this.roomData.hostPeerId = peerId;
        this.isHost = (peerId === this.getCurrentPeerId());
    }

    getCurrentPeerId() {
        // This will be set by the peer connection manager
        return this._currentPeerId;
    }

    setCurrentPeerId(peerId) {
        this._currentPeerId = peerId;
    }
}