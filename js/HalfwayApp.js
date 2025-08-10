class HalfwayApp {
    constructor() {
        this.router = new Router();
        this.roomManager = new RoomManager();
        this.userManager = new UserManager();
        this.mapsService = new MapsService();
        this.uiManager = new UIManager(this.userManager, this.mapsService);
        this.webrtcManager = new WebRTCManager(this.roomManager, this.userManager, this.uiManager);
        
        this.initialized = false;
    }

    async init() {
        try {
            console.log('Initializing Halfway.ing app...');
            console.log('Current URL:', window.location.href);
            console.log('Current Path:', window.location.pathname);
            
            // Initialize managers in the correct order
            console.log('Step 1: Initializing room manager...');
            this.roomManager.initialize();
            console.log('✓ Room manager initialized. Room ID:', this.roomManager.roomId);
            
            console.log('Step 2: Initializing user manager...');
            this.userManager.initialize();
            console.log('✓ User manager initialized. User:', this.userManager.currentUser);
            
            // Validate that we have both room and user before proceeding
            if (!this.roomManager.roomId) {
                throw new Error('Room ID not properly initialized');
            }
            if (!this.userManager.currentUser) {
                throw new Error('Current user not properly initialized');
            }
            
            // Set up initial UI
            console.log('Step 3: Setting up UI...');
            this.uiManager.updateUserList();
            this.uiManager.updateMapDisplay();
            
            // Set up event listeners
            console.log('Step 4: Setting up event listeners...');
            this.setupEventListeners();
            
            // Set up themes
            console.log('Step 5: Setting up themes...');
            this.setupThemeToggle();
            this.loadSavedTheme();
            
            // Wait a moment for everything to settle, then initialize WebRTC
            console.log('Step 6: Initializing WebRTC...');
            setTimeout(async () => {
                try {
                    const webrtcSuccess = await this.webrtcManager.initialize();
                    if (webrtcSuccess) {
                        console.log('✓ WebRTC manager initialized successfully');
                    } else {
                        console.error('✗ WebRTC manager failed to initialize');
                    }
                } catch (error) {
                    console.error('✗ WebRTC initialization error:', error);
                }
            }, 100);
            
            this.initialized = true;
            console.log('✓ App initialization complete');
            
        } catch (error) {
            console.error('✗ Failed to initialize app:', error);
            if (this.uiManager) {
                this.uiManager.showToast('Failed to initialize application: ' + error.message, 'error');
            }
        }
    }

    setupEventListeners() {

        // Copy room URL
        const copyUrlBtn = document.getElementById('copy-url');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                this.roomManager.copyRoomUrl()
                    .then(() => this.uiManager.showToast('Room URL copied to clipboard!', 'success'))
                    .catch(() => this.uiManager.showToast('Failed to copy URL', 'error'));
            });
        }

        // Current user name changes
        const currentUserNameInput = document.getElementById('current-user-name');
        if (currentUserNameInput) {
            currentUserNameInput.addEventListener('input', (e) => {
                const updatedUser = this.userManager.updateUserName(e.target.value);
                if (updatedUser) {
                    this.uiManager.updateUserList();
                    if (this.webrtcManager) {
                        this.webrtcManager.broadcastUserUpdate(updatedUser);
                    }
                }
            });
        }

        // Current location button (static one in HTML)
        const currentLocationBtn = document.getElementById('current-location-btn');
        if (currentLocationBtn) {
            currentLocationBtn.addEventListener('click', () => {
                this.uiManager.handleCurrentLocation();
            });
        }

        // Location input (static one in HTML)
        const locationInput = document.querySelector('.location-input');
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.uiManager.handleAddManualLocation(locationInput);
                }
            });
        }

        // Participants toggle
        const participantsToggle = document.getElementById('participants-toggle');
        if (participantsToggle) {
            participantsToggle.addEventListener('click', () => {
                this.toggleParticipants();
            });
        }

        // POI toggle
        const poisToggle = document.getElementById('pois-toggle');
        if (poisToggle) {
            poisToggle.addEventListener('click', () => {
                this.togglePOIs();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // User update events from UI manager
        window.addEventListener('userUpdated', (event) => {
            if (this.webrtcManager && event.detail) {
                this.webrtcManager.broadcastUserUpdate(event.detail);
            }
        });

        // Page visibility change to reconnect if needed
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.webrtcManager && this.webrtcManager.peer && this.webrtcManager.peer.disconnected) {
                this.webrtcManager.reconnectPeer();
            }
        });

        // Handle beforeunload to notify others
        window.addEventListener('beforeunload', () => {
            if (this.webrtcManager && this.userManager.currentUser) {
                this.webrtcManager.notifyUserLeaving();
            }
        });
    }

    // Google Maps callback
    initGoogleMaps() {
        const success = this.mapsService.initGoogleMaps();
        if (success) {
            this.uiManager.setupAutocompleteForExistingInputs();
            console.log('Google Maps initialized and autocomplete set up');
            
            // Set up autocomplete for the main location input
            const locationInput = document.querySelector('.location-input');
            if (locationInput) {
                this.uiManager.addAutocompleteToInput(locationInput);
            }
        }
    }

    // Theme management
    setupThemeToggle() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(currentTheme);
        this.updateThemeIcon(currentTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.applyTheme(newTheme);
        this.updateThemeIcon(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.applyTheme(savedTheme);
            this.updateThemeIcon(savedTheme);
        }
    }
    
    toggleParticipants() {
        const participantsToggle = document.getElementById('participants-toggle');
        const participantsList = document.getElementById('participants-list');
        
        if (participantsToggle && participantsList) {
            participantsToggle.classList.toggle('expanded');
            
            if (participantsToggle.classList.contains('expanded')) {
                participantsList.style.display = 'block';
            } else {
                participantsList.style.display = 'none';
            }
        }
    }
    
    togglePOIs() {
        const poisToggle = document.getElementById('pois-toggle');
        const poisList = document.getElementById('pois-list');
        
        if (poisToggle && poisList) {
            poisToggle.classList.toggle('expanded');
            
            if (poisToggle.classList.contains('expanded')) {
                poisList.style.display = 'block';
            } else {
                poisList.style.display = 'none';
            }
        }
    }

}