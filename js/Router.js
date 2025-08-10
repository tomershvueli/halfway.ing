class Router {
    constructor() {
        this.setupRouting();
    }

    setupRouting() {
        // Handle hash changes (for room navigation)
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Show the app immediately - no redirects
        this.showApp();
    }

    handleRoute() {
        const hash = window.location.hash;
        console.log('Router: Current hash:', hash);
        
        // Always show the app - hash routing works with static hosts
        this.showApp();
        
        // Dispatch room change event for other components to handle
        const roomId = hash ? hash.substring(1) : null;
        window.dispatchEvent(new CustomEvent('roomChanged', { 
            detail: { roomId, hash } 
        }));
    }

    showApp() {
        // Ensure the app container is visible
        const appContainer = document.querySelector('.app');
        if (appContainer) {
            appContainer.style.display = 'flex';
        }
    }

    // Method to programmatically navigate to a room
    navigateToRoom(roomId) {
        if (roomId) {
            window.location.hash = roomId;
        } else {
            window.location.hash = '';
        }
        this.handleRoute();
    }
}