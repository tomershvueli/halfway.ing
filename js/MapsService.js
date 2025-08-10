class MapsService {
    constructor() {
        this.geocodeCache = new Map();
        this.googleMapsLoaded = false;
        this.autocompleteService = null;
        this.placesService = null;
        this.map = null;
        this.markers = [];
        this.apiKey = 'AIzaSyAyUHqKt9DHK_8ZvD8X-PoQdKcN1MY_zJM';
    }

    initGoogleMaps() {
        this.googleMapsLoaded = true;
        if (window.google && window.google.maps && window.google.maps.places) {
            this.autocompleteService = new google.maps.places.AutocompleteService();
            this.initializeMap();
            console.log('Google Maps API loaded successfully');
            return true;
        }
        console.error('Google Maps API not available');
        return false;
    }
    
    initializeMap() {
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }
        
        // Initialize the map centered on the US
        this.map = new google.maps.Map(mapElement, {
            zoom: 4,
            center: { lat: 39.8283, lng: -98.5795 }, // Center of US
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });
        
        // Initialize places service for POI queries
        this.placesService = new google.maps.places.PlacesService(this.map);
        console.log('Map initialized successfully');
    }
    
    addMarker(location, title, type = 'user', user = null) {
        if (!this.map) return null;
        
        let icon;
        let color;
        
        switch (type) {
            case 'current-user':
                icon = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
                color = '#2563eb';
                break;
            case 'user':
                icon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
                color = '#ef4444';
                break;
            case 'midpoint':
                icon = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
                color = '#10b981';
                break;
            default:
                icon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
                color = '#ef4444';
        }
        
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: this.map,
            title: title,
            icon: icon
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 8px;">
                    <h4 style="margin: 0 0 4px 0; color: ${color};">${title}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        ${location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                    </p>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            // Close all other info windows
            this.markers.forEach(m => {
                if (m.infoWindow) m.infoWindow.close();
            });
            infoWindow.open(this.map, marker);
        });
        
        const markerData = { 
            marker, 
            infoWindow, 
            type, 
            user, 
            location 
        };
        
        this.markers.push(markerData);
        return markerData;
    }
    
    clearMarkers(type = null) {
        this.markers = this.markers.filter(markerData => {
            if (type === null || markerData.type === type) {
                markerData.marker.setMap(null);
                return false;
            }
            return true;
        });
    }
    
    updateMapView(locations) {
        if (!this.map || !locations || locations.length === 0) return;
        
        const bounds = new google.maps.LatLngBounds();
        locations.forEach(location => {
            bounds.extend(new google.maps.LatLng(location.lat, location.lng));
        });
        
        this.map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
        });
    }

    async geocodeAddress(address) {
        try {
            // Check cache first
            if (this.geocodeCache.has(address)) {
                return this.geocodeCache.get(address);
            }

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const location = {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    address: result.formatted_address
                };
                
                // Cache the result
                this.geocodeCache.set(address, location);
                return location;
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    calculateMidpoint(locations) {
        if (!locations || locations.length === 0) {
            return null;
        }
        
        const totalLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
        const totalLng = locations.reduce((sum, loc) => sum + loc.lng, 0);
        
        return {
            lat: totalLat / locations.length,
            lng: totalLng / locations.length
        };
    }

    async fetchPOIs(midpoint) {
        if (!midpoint) {
            console.log('No midpoint provided for POI search');
            return [];
        }
        
        if (!this.placesService) {
            console.log('Places service not ready yet');
            return [];
        }
        
        if (!window.google || !window.google.maps) {
            console.log('Google Maps not loaded yet');
            return [];
        }
        
        return new Promise((resolve, reject) => {
            try {
                const request = {
                    location: new google.maps.LatLng(midpoint.lat, midpoint.lng),
                    radius: 5000,
                    types: ['restaurant', 'cafe', 'bar']
                };
                
                this.placesService.nearbySearch(request, (results, status) => {
                    try {
                        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                            const pois = results.map(place => ({
                                id: place.place_id,
                                name: place.name,
                                address: place.vicinity || place.formatted_address,
                                rating: place.rating || 0,
                                priceLevel: place.price_level || 0,
                                category: this.categorizePOI(place.types || []),
                                isOpen: place.opening_hours ? place.opening_hours.open_now : null,
                                location: {
                                    lat: place.geometry.location.lat(),
                                    lng: place.geometry.location.lng()
                                }
                            }));
                            console.log(`Found ${pois.length} POIs`);
                            resolve(pois);
                        } else {
                            console.log('Places API status:', status);
                            resolve([]);
                        }
                    } catch (innerError) {
                        console.error('Error processing Places API results:', innerError);
                        resolve([]);
                    }
                });
            } catch (error) {
                console.error('Error calling Places API:', error);
                resolve([]);
            }
        });
    }

    categorizePOI(types) {
        // Food & Dining (primary categories)
        if (types.includes('restaurant')) return 'restaurant';
        if (types.includes('meal_takeaway') || types.includes('food') || types.includes('meal_delivery')) return 'fast_food';
        if (types.includes('cafe') || types.includes('bakery')) return 'cafe';
        if (types.includes('bar') || types.includes('night_club') || types.includes('liquor_store')) return 'bar';
        
        // Everything else goes to 'other' - shopping, entertainment, services, etc.
        return 'other';
    }

    getAutocompletePredictions(input) {
        return new Promise((resolve, reject) => {
            if (!this.autocompleteService) {
                reject(new Error('Autocomplete service not available'));
                return;
            }

            this.autocompleteService.getPlacePredictions({
                input: input,
                types: ['establishment', 'geocode']
            }, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    resolve(predictions);
                } else {
                    reject(new Error(`Autocomplete failed: ${status}`));
                }
            });
        });
    }

    openPOIInMaps(poi) {
        const query = encodeURIComponent(poi.name + ' ' + poi.address);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(url, '_blank');
    }
}