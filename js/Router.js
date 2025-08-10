class Router {
    constructor() {
        this.setupRouting();
    }

    setupRouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Show the app immediately - no redirects
        this.showApp();
    }

    handleRoute() {
        const path = window.location.pathname;
        console.log('Router: Current path:', path);
        
        // Always show the app - no 404s in SPA
        // Let RoomManager extract the room ID from the current URL
        this.showApp();
    }

    showApp() {
        // Ensure the app container is visible
        const appContainer = document.querySelector('.app');
        if (appContainer) {
            appContainer.style.display = 'flex';
        }
    }

    // Method to programmatically navigate (if needed)
    navigateTo(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }
}