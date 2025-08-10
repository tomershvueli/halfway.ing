class WebRTCManager {
    constructor(roomManager, userManager, uiManager) {
        this.roomManager = roomManager;
        this.userManager = userManager;
        this.uiManager = uiManager;
        
        this.peer = null;
        this.connections = new Map();
        this.roomPeers = new Set(); // Track all peers in this room
        this.discoveryChannel = null; // For room-based peer discovery
        
        this.rtcConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // { urls: 'stun:stun2.l.google.com:19302' },
                // { urls: 'stun:stun3.l.google.com:19302' },
                // { urls: 'stun:stun4.l.google.com:19302' },
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ]
        };
    }

    async initialize() {
        if (!window.Peer) {
            console.error('PeerJS not loaded');
            this.uiManager.showToast('PeerJS library not loaded', 'error');
            return false;
        }

        // Validate room ID and user ID before creating peer
        if (!this.roomManager.roomId || !this.userManager.currentUser?.id) {
            console.error('WebRTC: Cannot initialize - missing room ID or user ID');
            console.error('Room ID:', this.roomManager.roomId);
            console.error('User ID:', this.userManager.currentUser?.id);
            this.uiManager.showToast('Failed to initialize connection - invalid room or user', 'error');
            return false;
        }

        // Find the next available peer index for this room
        const peerIndex = await this.findNextAvailablePeerIndex();
        const peerId = `${this.roomManager.roomId}_${peerIndex}`;
        
        console.log('WebRTC: Initializing peer with sequential ID:', peerId);
        console.log('WebRTC: Room ID:', this.roomManager.roomId);
        console.log('WebRTC: Peer Index:', peerIndex);
        
        // Store our peer index for reference
        this.peerIndex = peerIndex;
        
        // Initialize PeerJS with public servers
        this.peer = new Peer(peerId, {
            config: this.rtcConfiguration
        });

        this.setupPeerEventHandlers();
        return true;
    }
    
    async findNextAvailablePeerIndex() {
        console.log('WebRTC: Finding next available peer index...');
        
        // Try to connect to peers with indexes 0, 1, 2, etc. until we find an available slot
        for (let index = 0; index < 12; index++) { // Limit to 12 peers max
            const testPeerId = `${this.roomManager.roomId}_${index}`;
            console.log(`Testing if peer index ${index} is available (${testPeerId})...`);
            
            const isAvailable = await this.testPeerAvailability(testPeerId);
            if (isAvailable) {
                console.log(`Peer index ${index} is available!`);
                return index;
            } else {
                console.log(`Peer index ${index} is taken, trying next...`);
            }
        }
        
        // Fallback: if all slots are taken, use a random high number
        console.warn('All sequential slots taken, using random high index');
        return Math.floor(Math.random() * 1000) + 100;
    }
    
    testPeerAvailability(peerId) {
        return new Promise((resolve) => {
            console.log(`Testing availability of peer: ${peerId}`);
            
            // Create a temporary peer to test if the ID is available
            const testPeer = new Peer(peerId, {
                config: this.rtcConfiguration
            });
            
            const timeout = setTimeout(() => {
                testPeer.destroy();
                resolve(false); // ID is taken if we can't connect with it
            }, 2000);
            
            testPeer.on('open', () => {
                console.log(`Peer ID ${peerId} is available!`);
                clearTimeout(timeout);
                testPeer.destroy();
                resolve(true); // ID is available
            });
            
            testPeer.on('error', (error) => {
                console.log(`Peer ID ${peerId} is taken:`, error.type);
                clearTimeout(timeout);
                testPeer.destroy();
                resolve(false); // ID is taken
            });
        });
    }

    setupPeerEventHandlers() {
        this.peer.on('open', (id) => {
            console.log('Peer connected with ID:', id);
            this.userManager.setPeerId(id);
            this.roomManager.setCurrentPeerId(id);
            this.uiManager.showToast('Connected to peer network', 'success');
            
            // Join the room
            this.joinRoom();
        });

        this.peer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);
            this.handleIncomingConnection(conn);
        });

        this.peer.on('disconnected', () => {
            console.log('Peer disconnected');
            this.uiManager.showToast('Disconnected from peer network', 'warning');
        });

        this.peer.on('error', (error) => {
            console.error('Peer error:', error);
            // this.uiManager.showToast('Connection error: ' + error.message, 'error');
            
            // Try to reconnect after a delay
            setTimeout(() => {
                this.reconnectPeer();
            }, 3000);
        });
    }

    reconnectPeer() {
        if (this.peer && !this.peer.destroyed) {
            this.peer.reconnect();
        } else {
            this.initialize();
        }
    }

    joinRoom() {
        console.log('WebRTC: Joining room with sequential peer discovery...');
        console.log('My peer index:', this.peerIndex);
        
        // Connect to all existing peers with lower indexes
        this.connectToExistingPeers();
        
        // Determine if we're the host (index 0)
        if (this.peerIndex === 0) {
            console.log('I am peer 0 - becoming the host');
            this.becomeHost();
        } else {
            console.log(`I am peer ${this.peerIndex} - joining existing room`);
            this.uiManager.showToast(`Joined as ${this.userManager.currentUser.name}`, 'info');
        }
    }
    
    connectToExistingPeers() {
        console.log('Connecting to existing peers with lower indexes...');
        
        // Connect to all peers with indexes 0 through (myIndex - 1)
        for (let i = 0; i < this.peerIndex; i++) {
            const existingPeerId = `${this.roomManager.roomId}_${i}`;
            console.log(`Connecting to peer ${i}: ${existingPeerId}`);
            this.connectToPeer(existingPeerId);
        }
        
        // Also try higher indexes in case some peers left and rejoined
        for (let i = this.peerIndex + 1; i < 12; i++) {
            const potentialPeerId = `${this.roomManager.roomId}_${i}`;
            console.log(`Checking for higher index peer ${i}: ${potentialPeerId}`);
            this.connectToPeer(potentialPeerId);
        }
    }
    
    connectToPeer(peerId) {
        if (peerId === this.peer.id || this.connections.has(peerId)) {
            return; // Don't connect to ourselves or already connected peers
        }
        
        console.log('Attempting connection to peer:', peerId);
        const conn = this.peer.connect(peerId);
        
        conn.on('open', () => {
            console.log('Successfully connected to peer:', peerId);
            this.handleConnection(conn, peerId);
            this.roomPeers.add(peerId);
            
            // Send join request
            conn.send({
                type: 'join-room',
                user: this.userManager.currentUser
            });
        });
        
        conn.on('error', (error) => {
            // Silently ignore connection errors during discovery - this is normal
            // Don't show any toast messages for failed peer connections
        });
    }

    becomeHost() {
        this.roomManager.becomeHost(this.peer.id);
        this.roomPeers.add(this.peer.id); // Add ourselves to the peer list
        this.uiManager.showToast('You are the room host', 'info');
        console.log('Became host of room:', this.roomManager.roomId);
        console.log('Current peers in room:', Array.from(this.roomPeers));
    }

    connectToHost(hostPeerId) {
        console.log('Connecting to host:', hostPeerId);
        
        const conn = this.peer.connect(hostPeerId);
        
        conn.on('open', () => {
            console.log('Connected to host');
            this.handleConnection(conn, hostPeerId);
            
            // Request room state
            conn.send({
                type: 'join-room',
                user: this.userManager.currentUser
            });
        });

        conn.on('error', (error) => {
            console.error('Failed to connect to host:', error);
            this.uiManager.showToast('Failed to connect to room host', 'error');
            
            // If can't connect to host, try to become host
            setTimeout(() => {
                this.becomeHost();
            }, 2000);
        });
    }

    handleIncomingConnection(conn) {
        conn.on('open', () => {
            this.handleConnection(conn, conn.peer);
        });
    }

    handleConnection(conn, peerId) {
        this.connections.set(peerId, conn);
        
        // Find user by peer ID and update connection status
        const userInfo = this.userManager.findUserByPeerId(peerId);
        if (userInfo) {
            this.uiManager.updateConnectionStatus(userInfo.userId, 'connected');
        }

        conn.on('data', (data) => {
            this.handlePeerMessage(data, peerId);
        });

        conn.on('close', () => {
            console.log('Connection closed:', peerId);
            this.connections.delete(peerId);
            
            const userInfo = this.userManager.findUserByPeerId(peerId);
            if (userInfo) {
                this.uiManager.updateConnectionStatus(userInfo.userId, 'disconnected');
            }
        });

        conn.on('error', (error) => {
            console.error('Connection error:', error);
            this.connections.delete(peerId);
            
            const userInfo = this.userManager.findUserByPeerId(peerId);
            if (userInfo) {
                this.uiManager.updateConnectionStatus(userInfo.userId, 'error');
            }
        });
    }

    handlePeerMessage(data, fromPeerId) {
        console.log('Received message:', data, 'from:', fromPeerId);
        
        switch (data.type) {
            case 'join-room':
                this.handleUserJoin(data.user, fromPeerId);
                break;
                
            case 'room-state':
                this.handleRoomState(data.roomState);
                break;
                
            case 'user-update':
                this.handleUserUpdate(data.user);
                break;
                
            case 'room-title-update':
                this.handleRoomTitleUpdate(data.title);
                break;
                
            case 'user-leaving':
                this.handleUserLeaving(data.userId);
                break;
                
            case 'peer-list':
                this.handlePeerList(data.peers);
                break;
                
        }
    }

    handleUserJoin(user, fromPeerId) {
        // Any existing user can handle new joiners, not just the host
        // Add user to room
        user.peerId = fromPeerId;
        this.userManager.updateUser(user);
        this.roomManager.saveRoomToStorage(this.userManager.getAllUsers());
        this.uiManager.updateUserList();
        this.uiManager.updateMapDisplay();
        
        // Send room state to new user
        const conn = this.connections.get(fromPeerId);
        if (conn) {
            conn.send({
                type: 'room-state',
                roomState: {
                    title: this.roomManager.roomData.title,
                    users: this.userManager.getAllUsers()
                }
            });
        }
        
        // Notify other users
        this.broadcastToAll({
            type: 'user-update',
            user: user
        }, fromPeerId);
        
        // Send list of other peers to new user
        const otherPeers = this.userManager.getAllUsers()
            .filter(u => u.id !== user.id && u.peerId)
            .map(u => u.peerId);
        
        if (otherPeers.length > 0) {
            conn.send({
                type: 'peer-list',
                peers: otherPeers
            });
        }
        
        this.uiManager.showToast(`${user.name} joined the room`, 'info');
    }

    handleRoomState(roomState) {
        // Update room title
        const roomTitleInput = document.getElementById('room-title');
        if (roomTitleInput) {
            roomTitleInput.value = roomState.title;
        }
        this.roomManager.roomData.title = roomState.title;
        
        // Update users
        this.userManager.users.clear();
        roomState.users.forEach(user => {
            this.userManager.users.set(user.id, user);
            if (user.id !== this.userManager.currentUser.id) {
                this.uiManager.updateConnectionStatus(user.id, 'connected');
            }
        });
        
        this.uiManager.updateUserList();
        this.uiManager.updateMapDisplay();
        this.roomManager.saveRoomToStorage(this.userManager.getAllUsers());
    }

    handleUserUpdate(user) {
        this.uiManager.handleUserUpdate(user);
        this.roomManager.saveRoomToStorage(this.userManager.getAllUsers());
    }

    handleRoomTitleUpdate(title) {
        const roomTitleInput = document.getElementById('room-title');
        if (roomTitleInput) {
            roomTitleInput.value = title;
        }
        this.roomManager.roomData.title = title;
        this.roomManager.saveRoomToStorage(this.userManager.getAllUsers());
    }

    handleUserLeaving(userId) {
        this.uiManager.handleUserLeft(userId);
        this.roomManager.saveRoomToStorage(this.userManager.getAllUsers());
    }

    handlePeerList(peers) {
        // Connect to other peers in the room
        peers.forEach(peerId => {
            if (peerId !== this.peer.id && !this.connections.has(peerId)) {
                const conn = this.peer.connect(peerId);
                
                conn.on('open', () => {
                    this.handleConnection(conn, peerId);
                    
                    // Announce yourself to the peer
                    conn.send({
                        type: 'user-update',
                        user: this.userManager.currentUser
                    });
                });
            }
        });
    }

    broadcastToAll(message, excludePeerId = null) {
        this.connections.forEach((conn, peerId) => {
            if (peerId !== excludePeerId && conn.open) {
                try {
                    conn.send(message);
                } catch (error) {
                    console.error('Failed to send message to', peerId, error);
                }
            }
        });
    }

    broadcastUserUpdate(user) {
        this.broadcastToAll({
            type: 'user-update',
            user: user
        });
        this.roomManager.saveRoomToStorage(this.userManager.getAllUsers());
    }

    broadcastRoomTitleUpdate(title) {
        this.broadcastToAll({
            type: 'room-title-update',
            title: title
        });
    }

    notifyUserLeaving() {
        if (this.userManager.currentUser) {
            this.broadcastToAll({
                type: 'user-leaving',
                userId: this.userManager.currentUser.id
            });
        }
    }
}