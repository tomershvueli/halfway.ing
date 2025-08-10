class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = new Map();
        this.connectionStatuses = new Map();
    }

    initialize() {
        try {
            console.log('UserManager: Starting initialization...');
            
            // Try to load saved name from localStorage
            const savedName = localStorage.getItem('user_name');
            const userName = savedName || this.generatePseudonym();
            
            this.currentUser = {
                id: this.generateUserId(),
                name: userName,
                locations: [],
                peerId: null
            };
            
            // Validate the created user
            if (!this.currentUser.id || !this.currentUser.name) {
                throw new Error('Failed to generate user ID or name');
            }
            
            this.users.set(this.currentUser.id, this.currentUser);
            console.log('UserManager: User created and added to map:', this.currentUser);
            
            // Set the name in the input field
            const nameInput = document.getElementById('current-user-name');
            if (nameInput) {
                nameInput.value = this.currentUser.name;
                console.log('UserManager: Name input field updated');
            } else {
                console.warn('UserManager: Name input field not found');
            }
            
            console.log('UserManager: Initialization complete');
            return this.currentUser;
        } catch (error) {
            console.error('UserManager: Failed to initialize:', error);
            throw error;
        }
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    generatePseudonym() {
        const adjectives = ['Anonymous', 'Bright', 'Swift', 'Clever', 'Gentle', 'Bold', 'Quick', 'Silent', 'Wise', 'Brave'];
        const animals = ['Hawk', 'Wolf', 'Tiger', 'Eagle', 'Bear', 'Lion', 'Fox', 'Deer', 'Owl', 'Cat'];
        const numbers = Math.floor(Math.random() * 1000);
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        
        return `${adj}${animal}${numbers}`;
    }

    updateUserName(name) {
        if (!this.currentUser) {
            console.error('Cannot update user name: currentUser is null');
            return null;
        }
        
        if (name && name.trim() !== '') {
            this.currentUser.name = name.trim();
            this.users.set(this.currentUser.id, this.currentUser);
            
            // Save to localStorage
            localStorage.setItem('user_name', name.trim());
            
            return this.currentUser;
        }
        return null;
    }

    addLocation(location) {
        if (!this.currentUser) {
            console.error('Cannot add location: currentUser is null');
            return null;
        }
        
        this.currentUser.locations.push(location);
        this.users.set(this.currentUser.id, this.currentUser);
        return this.currentUser;
    }

    removeLocation(locationIndex) {
        if (!this.currentUser || !this.currentUser.locations[locationIndex]) {
            console.error('Cannot remove location: invalid index or currentUser is null');
            return null;
        }
        
        this.currentUser.locations.splice(locationIndex, 1);
        this.users.set(this.currentUser.id, this.currentUser);
        return this.currentUser;
    }

    updateUser(user) {
        if (user && user.id !== this.currentUser?.id) {
            this.users.set(user.id, user);
            return true;
        }
        return false;
    }

    removeUser(userId) {
        if (this.users.has(userId)) {
            const user = this.users.get(userId);
            this.users.delete(userId);
            this.connectionStatuses.delete(userId);
            return user;
        }
        return null;
    }

    setConnectionStatus(userId, status) {
        this.connectionStatuses.set(userId, status);
    }

    getConnectionStatus(userId) {
        return this.connectionStatuses.get(userId) || 'offline';
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    getAllLocations() {
        const allLocations = [];
        this.users.forEach(user => {
            allLocations.push(...user.locations);
        });
        return allLocations;
    }

    findUserByPeerId(peerId) {
        for (const [userId, user] of this.users.entries()) {
            if (user.peerId === peerId) {
                return { userId, user };
            }
        }
        return null;
    }

    setPeerId(peerId) {
        if (this.currentUser) {
            this.currentUser.peerId = peerId;
            this.users.set(this.currentUser.id, this.currentUser);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isCurrentUser(userId) {
        return this.currentUser && this.currentUser.id === userId;
    }
}