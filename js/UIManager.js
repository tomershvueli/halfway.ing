class UIManager {
    constructor(userManager, mapsService) {
        this.userManager = userManager;
        this.mapsService = mapsService;
        this.midpoint = null;
        this.pois = [];
        this.autocompleteInputs = new Set();
    }

    updateUserList() {
        const participantsList = document.getElementById('participants-list');
        const participantsCount = document.getElementById('participants-count');
        const participantsNumber = document.getElementById('participants-number');
        
        if (!participantsList) return;
        
        const users = this.userManager.getAllUsers();
        const userCount = users.length;
        
        // Update participant count displays
        if (participantsCount) {
            participantsCount.textContent = `${userCount} connected`;
        }
        if (participantsNumber) {
            participantsNumber.textContent = userCount;
        }
        
        // Update participants list
        if (userCount === 0) {
            participantsList.innerHTML = '<p class="participants-empty">No participants yet</p>';
        } else {
            participantsList.innerHTML = '';
            users.forEach((user, userId) => {
                const isCurrentUser = this.userManager.isCurrentUser(userId);
                const userElement = this.createParticipantElement(user, isCurrentUser);
                participantsList.appendChild(userElement);
            });
        }
    }
    
    createParticipantElement(user, isCurrentUser) {
        const participantDiv = document.createElement('div');
        participantDiv.className = `participant-item ${isCurrentUser ? 'current-participant' : ''}`;
        
        const participantName = document.createElement('div');
        participantName.className = 'participant-name';
        participantName.textContent = user.name;
        
        const participantLocations = document.createElement('div');
        participantLocations.className = 'participant-locations';
        
        if (user.locations && user.locations.length > 0) {
            user.locations.forEach((location, index) => {
                const locationDiv = document.createElement('div');
                locationDiv.className = 'participant-location';
                locationDiv.style.display = 'flex';
                locationDiv.style.justifyContent = 'space-between';
                locationDiv.style.alignItems = 'center';
                
                const locationText = document.createElement('span');
                locationText.textContent = location.address;
                locationDiv.appendChild(locationText);
                
                // Add remove button only for current user
                if (isCurrentUser) {
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'x';
                    removeBtn.className = 'location-remove-btn';
                    removeBtn.style.cssText = `
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        cursor: pointer;
                        font-size: 14px;
                        line-height: 1;
                        margin-left: 8px;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    
                    removeBtn.addEventListener('mouseenter', () => {
                        removeBtn.style.background = '#dc2626';
                    });
                    
                    removeBtn.addEventListener('mouseleave', () => {
                        removeBtn.style.background = '#ef4444';
                    });
                    
                    removeBtn.addEventListener('click', () => {
                        this.handleRemoveLocation(index);
                    });
                    
                    locationDiv.appendChild(removeBtn);
                }
                
                participantLocations.appendChild(locationDiv);
            });
        } else {
            const noLocationDiv = document.createElement('div');
            noLocationDiv.className = 'participant-location empty';
            noLocationDiv.textContent = 'No location set';
            participantLocations.appendChild(noLocationDiv);
        }
        
        participantDiv.appendChild(participantName);
        participantDiv.appendChild(participantLocations);
        
        return participantDiv;
    }

    createUserElement(user, isCurrentUser) {
        const userDiv = document.createElement('div');
        userDiv.className = `user-item ${isCurrentUser ? 'current-user' : ''}`;
        
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        const userHeader = document.createElement('div');
        userHeader.style.display = 'flex';
        userHeader.style.justifyContent = 'space-between';
        userHeader.style.alignItems = 'center';
        
        const userName = document.createElement('div');
        userName.className = 'user-name-display';
        userName.textContent = user.name;
        userName.style.padding = '0.5rem';
        userName.style.fontWeight = '600';
        
        // Make current user name editable
        if (isCurrentUser) {
            userName.style.cursor = 'pointer';
            userName.style.border = '1px dashed transparent';
            userName.style.borderRadius = '0.25rem';
            userName.title = 'Click to edit your name';
            
            userName.addEventListener('click', () => {
                this.makeNameEditable(userName, user);
            });
            
            userName.addEventListener('mouseenter', () => {
                userName.style.borderColor = 'var(--primary-color)';
                userName.style.backgroundColor = 'var(--background-color)';
            });
            
            userName.addEventListener('mouseleave', () => {
                userName.style.borderColor = 'transparent';
                userName.style.backgroundColor = 'transparent';
            });
        }
        
        // Add connection status indicator for other users
        if (!isCurrentUser) {
            const connectionStatus = document.createElement('div');
            connectionStatus.className = 'connection-status';
            const status = this.userManager.getConnectionStatus(user.id);
            connectionStatus.textContent = status === 'connected' ? '🟢' : status === 'connecting' ? '🟡' : '🔴';
            connectionStatus.title = `Connection: ${status}`;
            connectionStatus.style.fontSize = '0.75rem';
            userHeader.appendChild(connectionStatus);
        }
        
        const userLocations = document.createElement('div');
        userLocations.className = 'user-locations-display';
        
        user.locations.forEach(location => {
            const locationDiv = document.createElement('div');
            locationDiv.className = 'location-display';
            locationDiv.textContent = location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
            locationDiv.style.fontSize = '0.875rem';
            locationDiv.style.color = 'var(--text-secondary)';
            locationDiv.style.padding = '0.25rem 0.5rem';
            userLocations.appendChild(locationDiv);
        });
        
        userHeader.appendChild(userName);
        userInfo.appendChild(userHeader);
        userInfo.appendChild(userLocations);
        userDiv.appendChild(userInfo);
        
        if (isCurrentUser) {
            const controls = this.createUserControls();
            userDiv.appendChild(controls);
        }
        
        return userDiv;
    }

    createUserControls() {
        const controls = document.createElement('div');
        controls.innerHTML = `
            <div class="user-locations">
                <div class="location-item">
                    <button class="location-btn" id="current-location-btn-dynamic">
                        📍 Use Current Location
                    </button>
                </div>
                <div class="location-item" style="position: relative;">
                    <input type="text" class="location-input-dynamic" placeholder="Enter address..." 
                           aria-label="Enter address">
                    <button class="add-location-btn-dynamic">+</button>
                </div>
            </div>
        `;
        
        // Add event listeners to the new elements
        const locationBtn = controls.querySelector('#current-location-btn-dynamic');
        const locationInput = controls.querySelector('.location-input-dynamic');
        const addBtn = controls.querySelector('.add-location-btn-dynamic');
        
        if (locationBtn) {
            locationBtn.addEventListener('click', () => this.handleCurrentLocation());
        }
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleAddManualLocation(locationInput));
        }
        
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddManualLocation(locationInput);
                }
            });
            
            // Add autocomplete if maps service is ready
            if (this.mapsService.googleMapsLoaded) {
                this.addAutocompleteToInput(locationInput);
            }
        }
        
        return controls;
    }

    async handleCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by this browser.', 'error');
            return;
        }

        this.showToast('Getting your location...', 'info');
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                address: 'Current Location'
            };
            
            const updatedUser = this.userManager.addLocation(location);
            if (updatedUser) {
                this.updateUserList();
                this.updateMapDisplay();
                this.showToast('Location added successfully!', 'success');
                
                // Notify other components
                this.dispatchUserUpdate(updatedUser);
            }
        } catch (error) {
            let message = 'Failed to get location: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Position unavailable';
                    break;
                case error.TIMEOUT:
                    message += 'Request timeout';
                    break;
                default:
                    message += 'Unknown error';
                    break;
            }
            this.showToast(message, 'error');
        }
    }

    async handleAddManualLocation(input) {
        if (!input) {
            this.showToast('Could not find input field', 'error');
            return;
        }
        
        const address = input.value.trim();
        
        if (!address) {
            this.showToast('Please enter an address', 'warning');
            return;
        }
        
        try {
            this.showToast('Looking up address...', 'info');
            const location = await this.mapsService.geocodeAddress(address);
            
            if (location) {
                const updatedUser = this.userManager.addLocation(location);
                if (updatedUser) {
                    input.value = '';
                    this.updateUserList();
                    this.updateMapDisplay();
                    this.showToast('Location added successfully!', 'success');
                    
                    // Notify other components
                    this.dispatchUserUpdate(updatedUser);
                }
            } else {
                this.showToast('Address not found', 'error');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            this.showToast('Failed to geocode address', 'error');
        }
    }

    updateMapDisplay() {
        const allLocations = this.userManager.getAllLocations();
        this.midpoint = this.mapsService.calculateMidpoint(allLocations);
        
        // Clear existing markers
        this.mapsService.clearMarkers();
        
        if (allLocations.length === 0) {
            this.pois = [];
            this.updatePOIsList();
            return;
        }
        
        // Add markers for all user locations
        const currentUser = this.userManager.currentUser;
        const allUsers = this.userManager.getAllUsers();
        
        allUsers.forEach(user => {
            user.locations.forEach(location => {
                const isCurrentUser = user.id === currentUser.id;
                const markerType = isCurrentUser ? 'current-user' : 'user';
                const markerTitle = isCurrentUser ? `You: ${location.address}` : `${user.name}: ${location.address}`;
                
                this.mapsService.addMarker(location, markerTitle, markerType, user);
            });
        });
        
        // Add midpoint marker if we have locations
        if (this.midpoint) {
            this.mapsService.addMarker(this.midpoint, 'Midpoint', 'midpoint');
            
            // Update map view to show all markers
            const allMapLocations = [...allLocations, this.midpoint];
            this.mapsService.updateMapView(allMapLocations);
            
            // Fetch POIs for the midpoint (with a small delay to ensure Places API is ready)
            setTimeout(() => {
                this.fetchAndDisplayPOIs();
            }, 500);
        } else {
            // Just show user locations
            this.mapsService.updateMapView(allLocations);
        }
    }

    async fetchAndDisplayPOIs() {
        if (!this.midpoint) {
            this.pois = [];
            this.updatePOIsList();
            return;
        }
        
        try {
            console.log('Fetching POIs for midpoint:', this.midpoint);
            this.pois = await this.mapsService.fetchPOIs(this.midpoint);
            console.log('POIs fetched:', this.pois.length);
            this.updatePOIsList();
        } catch (error) {
            console.error('Error fetching POIs:', error);
            this.pois = [];
            this.updatePOIsList();
            // Don't show error toast to avoid cluttering UI
        }
    }

    updatePOIsList(poisToShow = null) {
        const poisList = document.getElementById('pois-list');
        const poisCount = document.getElementById('pois-count');
        const poisFilters = document.getElementById('pois-filters');
        
        if (!poisList) {
            console.error('POI list element not found');
            return;
        }
        
        const displayPois = poisToShow || this.pois;
        console.log('Updating POI list with', displayPois.length, 'POIs');
        
        // Update POI count
        if (poisCount) {
            poisCount.textContent = displayPois.length;
        }
        
        // Show/hide filters based on whether we have POIs
        if (poisFilters) {
            poisFilters.style.display = this.pois.length > 0 ? 'block' : 'none';
        }
        
        // Setup filter event listener if not already done
        this.setupFilterEventListener();
        
        if (displayPois.length === 0) {
            poisList.innerHTML = '<p class="pois-empty">No places found matching your criteria</p>';
            return;
        }
        
        poisList.innerHTML = '';
        
        // Group POIs by category
        const groupedPOIs = displayPois.reduce((groups, poi) => {
            const category = poi.category || 'other';
            if (!groups[category]) groups[category] = [];
            groups[category].push(poi);
            return groups;
        }, {});
        
        // Create category sections
        Object.entries(groupedPOIs).forEach(([category, pois]) => {
            const categorySection = this.createCategorySection(category, pois);
            poisList.appendChild(categorySection);
        });
        
        console.log('POI list updated successfully with', Object.keys(groupedPOIs).length, 'categories');
    }

    createPOIElement(poi) {
        const poiDiv = document.createElement('div');
        poiDiv.className = 'poi-item';
        
        const poiInfo = document.createElement('div');
        poiInfo.className = 'poi-info';
        
        const poiName = document.createElement('div');
        poiName.className = 'poi-name';
        poiName.textContent = poi.name;
        
        const poiAddress = document.createElement('div');
        poiAddress.className = 'poi-address';
        poiAddress.textContent = poi.address;
        
        const poiDetails = document.createElement('div');
        poiDetails.className = 'poi-details';
        
        if (poi.rating && poi.rating > 0) {
            const rating = document.createElement('span');
            rating.className = 'poi-rating';
            rating.textContent = `⭐ ${poi.rating.toFixed(1)}`;
            poiDetails.appendChild(rating);
        }
        
        if (poi.priceLevel && poi.priceLevel > 0) {
            const price = document.createElement('span');
            price.className = 'poi-price';
            price.textContent = '$'.repeat(poi.priceLevel);
            poiDetails.appendChild(price);
        }
        
        poiInfo.appendChild(poiName);
        poiInfo.appendChild(poiAddress);
        poiInfo.appendChild(poiDetails);
        
        // Make the entire POI item clickable
        poiDiv.addEventListener('click', () => {
            this.mapsService.openPOIInMaps(poi);
        });
        
        poiDiv.appendChild(poiInfo);
        
        return poiDiv;
    }

    createCategorySection(category, pois) {
        const categoryNames = {
            'restaurant': 'Restaurants',
            'cafe': 'Cafes',
            'bar': 'Bars'
        };

        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = `${categoryNames[category] || category} (${pois.length})`;
        
        categoryHeader.appendChild(categoryTitle);
        
        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        
        pois.forEach(poi => {
            const poiElement = this.createPOIElement(poi);
            categoryContent.appendChild(poiElement);
        });
        
        categorySection.appendChild(categoryHeader);
        categorySection.appendChild(categoryContent);
        
        return categorySection;
    }

    filterPOIs() {
        const categoryFilter = document.getElementById('category-filter');
        const openNowFilter = document.getElementById('open-now-filter');
        
        if (!categoryFilter || !openNowFilter) return;
        
        let filteredPOIs = this.pois;
        
        if (categoryFilter.value) {
            filteredPOIs = filteredPOIs.filter(poi => poi.category === categoryFilter.value);
        }
        
        if (openNowFilter.checked) {
            filteredPOIs = filteredPOIs.filter(poi => poi.isOpen === true);
        }
        
        this.updatePOIsList(filteredPOIs);
    }

    setupFilterEventListener() {
        const categoryFilter = document.getElementById('category-filter');
        const openNowFilter = document.getElementById('open-now-filter');
        
        if (categoryFilter && !categoryFilter.hasAttribute('data-listener-added')) {
            categoryFilter.setAttribute('data-listener-added', 'true');
            categoryFilter.addEventListener('change', () => {
                this.filterPOIs();
            });
        }
        
        if (openNowFilter && !openNowFilter.hasAttribute('data-listener-added')) {
            openNowFilter.setAttribute('data-listener-added', 'true');
            openNowFilter.addEventListener('change', () => {
                this.filterPOIs();
            });
        }
    }

    addAutocompleteToInput(input) {
        if (!this.mapsService.googleMapsLoaded || this.autocompleteInputs.has(input)) {
            console.log('Autocomplete not ready:', {
                googleMapsLoaded: this.mapsService.googleMapsLoaded,
                alreadyHasInput: this.autocompleteInputs.has(input)
            });
            return;
        }
        
        console.log('Adding autocomplete to input:', input);
        this.autocompleteInputs.add(input);
        
        // Use Google Maps Places Autocomplete directly
        if (window.google && window.google.maps && window.google.maps.places) {
            const autocomplete = new google.maps.places.Autocomplete(input, {
                types: ['geocode', 'establishment'],
                fields: ['formatted_address', 'geometry', 'name', 'types']
            });
            
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                
                if (place.geometry) {
                    console.log('Place selected:', place.formatted_address || place.name);
                    
                    // Create location object - use business name if available, otherwise address
                    const displayName = place.name && place.types && place.types.includes('establishment') 
                        ? place.name 
                        : place.formatted_address;
                    
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: displayName || place.formatted_address
                    };
                    
                    // Add the location
                    const updatedUser = this.userManager.addLocation(location);
                    if (updatedUser) {
                        this.updateUserList();
                        this.updateMapDisplay();
                        this.showToast('Location added successfully!', 'success');
                        
                        // Clear the input
                        input.value = '';
                        
                        // Notify other components
                        this.dispatchUserUpdate(updatedUser);
                    }
                } else {
                    console.log('No geometry found for place');
                }
            });
            
            console.log('Google Maps autocomplete initialized');
        } else {
            console.error('Google Maps Places API not available');
        }
    }

    handleRemoveLocation(locationIndex) {
        console.log('Removing location at index:', locationIndex);
        const updatedUser = this.userManager.removeLocation(locationIndex);
        if (updatedUser) {
            console.log('Location removed successfully, updating UI');
            this.updateUserList();
            this.updateMapDisplay();
            this.showToast('Location removed successfully!', 'success');
            this.dispatchUserUpdate(updatedUser);
        } else {
            console.error('Failed to remove location');
            this.showToast('Failed to remove location', 'error');
        }
    }

    setupAutocompleteForExistingInputs() {
        const locationInputs = document.querySelectorAll('.location-input, .location-input-dynamic');
        locationInputs.forEach(input => {
            this.addAutocompleteToInput(input);
        });
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    dispatchUserUpdate(user) {
        // Dispatch custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));
    }

    updateConnectionStatus(userId, status) {
        this.userManager.setConnectionStatus(userId, status);
        this.updateUserList();
    }

    handleUserUpdate(user) {
        if (this.userManager.updateUser(user)) {
            this.updateUserList();
            this.updateMapDisplay();
        }
    }

    handleUserLeft(userId) {
        const removedUser = this.userManager.removeUser(userId);
        if (removedUser) {
            this.updateUserList();
            this.updateMapDisplay();
            this.showToast(`${removedUser.name} left the room`, 'info');
        }
    }
    
    makeNameEditable(nameElement, user) {
        const originalName = user.name;
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.style.width = '100%';
        input.style.padding = '0.5rem';
        input.style.border = '1px solid var(--primary-color)';
        input.style.borderRadius = '0.25rem';
        input.style.fontSize = 'inherit';
        input.style.fontWeight = 'inherit';
        input.style.backgroundColor = 'var(--background-color)';
        input.style.color = 'var(--text-color)';
        
        // Replace the name display with input
        nameElement.textContent = '';
        nameElement.appendChild(input);
        nameElement.style.padding = '0';
        input.focus();
        input.select();
        
        const finishEditing = () => {
            const newName = input.value.trim();
            if (newName && newName !== originalName) {
                const updatedUser = this.userManager.updateUserName(newName);
                if (updatedUser) {
                    this.updateUserList();
                    this.dispatchUserUpdate(updatedUser);
                    this.showToast('Name updated!', 'success');
                }
            } else {
                // Restore original name
                nameElement.textContent = originalName;
                nameElement.style.padding = '0.5rem';
            }
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                nameElement.textContent = originalName;
                nameElement.style.padding = '0.5rem';
            }
        });
    }
}