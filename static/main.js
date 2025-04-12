// Sarawak locations data
const SARAWAK_LOCATIONS = {
    'sibu': {
        'name': 'Sibu',
        'coordinates': {'lat': 2.287, 'lon': 111.833},
        'river_system': 'Rajang River',
        'flood_threshold': 2.5
    },
    'kuching': {
        'name': 'Kuching',
        'coordinates': {'lat': 1.549, 'lon': 110.342},
        'river_system': 'Sarawak River',
        'flood_threshold': 2.8
    },
    'miri': {
        'name': 'Miri',
        'coordinates': {'lat': 4.399, 'lon': 113.991},
        'river_system': 'Baram River',
        'flood_threshold': 2.2
    },
    'bintulu': {
        'name': 'Bintulu',
        'coordinates': {'lat': 3.171, 'lon': 113.041},
        'river_system': 'Kemena River',
        'flood_threshold': 2.4
    },
    'sri_aman': {
        'name': 'Sri Aman',
        'coordinates': {'lat': 1.237, 'lon': 111.462},
        'river_system': 'Lupar River',
        'flood_threshold': 2.3
    }
};

// Function to validate and format flood data
function validateFloodData(data) {
    if (!data || typeof data !== 'object') {
        console.error('Invalid flood data received');
        return null;
    }

    const validatedData = {};
    for (const [locationId, locationData] of Object.entries(data)) {
        if (!locationData || typeof locationData !== 'object') {
            console.error(`Invalid data for location ${locationId}`);
            continue;
        }

        validatedData[locationId] = {
            name: String(locationData.name || 'Unknown Location'),
            risk_level: ['low', 'medium', 'high'].includes(locationData.risk_level) 
                ? locationData.risk_level 
                : 'low',
            water_level: Math.max(0, Math.min(parseFloat(locationData.water_level) || 0, 10)),
            rainfall: Math.max(0, Math.min(parseFloat(locationData.rainfall) || 0, 500)),
            temperature: Math.max(20, Math.min(parseFloat(locationData.temperature) || 27.5, 35)),
            humidity: Math.max(60, Math.min(parseFloat(locationData.humidity) || 80, 100)),
            last_updated: locationData.last_updated || new Date().toISOString()
        };
    }

    return validatedData;
}

// Function to update the UI with flood data
function updateFloodData(data) {
    const validatedData = validateFloodData(data);
    if (!validatedData) {
        showError('Unable to load flood data. Please try again later.');
        return;
    }

    try {
        // Update each location card
        for (const [locationId, locationData] of Object.entries(validatedData)) {
            const card = document.querySelector(`#${locationId}-card`);
            if (!card) continue;

            // Update risk level
            const riskIndicator = card.querySelector('.risk-indicator');
            if (riskIndicator) {
                riskIndicator.className = `risk-indicator ${locationData.risk_level}`;
                riskIndicator.textContent = locationData.risk_level.toUpperCase();
            }

            // Update metrics
            const metrics = {
                'water-level': `${locationData.water_level.toFixed(1)}m`,
                'rainfall': `${locationData.rainfall.toFixed(1)}mm`,
                'temperature': `${locationData.temperature.toFixed(1)}°C`,
                'humidity': `${locationData.humidity.toFixed(1)}%`
            };

            for (const [metricId, value] of Object.entries(metrics)) {
                const element = card.querySelector(`#${locationId}-${metricId}`);
                if (element) {
                    element.textContent = value;
                }
            }

            // Update last updated time
            const lastUpdated = card.querySelector('.last-updated');
            if (lastUpdated) {
                const date = new Date(locationData.last_updated);
                lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
            }
        }
    } catch (error) {
        console.error('Error updating flood data:', error);
        showError('Error updating the display. Please refresh the page.');
    }
}

// Function to show error messages
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Function to fetch and update flood data
async function fetchFloodData() {
    try {
        const response = await fetch('/api/flood-data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        updateFloodData(data);
    } catch (error) {
        console.error('Error fetching flood data:', error);
        showError('Unable to fetch flood data. Please check your connection and try again.');
    }
}

// Function to fetch prediction data
async function fetchPrediction(locationId) {
    try {
        const response = await fetch(`/api/predict/${locationId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Validate prediction data
        if (!data || !data.forecast || !Array.isArray(data.forecast)) {
            throw new Error('Invalid prediction data received');
        }

        return data;
    } catch (error) {
        console.error('Error fetching prediction:', error);
        showError('Unable to fetch prediction data. Please try again later.');
        return null;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initial data load
    fetchFloodData();

    // Set up periodic updates
    setInterval(fetchFloodData, 300000); // Update every 5 minutes

    // Set up event listeners for prediction buttons
    document.querySelectorAll('.predict-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const locationId = event.target.dataset.location;
            const prediction = await fetchPrediction(locationId);
            if (prediction) {
                updatePredictionDisplay(locationId, prediction);
            }
        });
    });
});

// Function to update the map with flood data
function updateMap(data) {
    // Clear existing markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add markers for each location
    data.forEach(item => {
        if (item.latitude && item.longitude) {
            // Use custom icon for Sibu
            const icon = item.location === 'Sibu' ? sibuIcon : undefined;
            const marker = L.marker([item.latitude, item.longitude], { icon })
                .addTo(map)
                .bindPopup(`
                    <strong>${item.location}</strong><br>
                    Risk Level: ${item.risk_level}<br>
                    Water Level: ${item.water_level} m<br>
                    Rainfall: ${item.rainfall} mm<br>
                    Temperature: ${item.temperature}°C<br>
                    Humidity: ${item.humidity}%<br>
                    Last Updated: ${item.last_updated}
                `);
                
            // Add to map bounds
            map.fitBounds(map.getBounds().extend([item.latitude, item.longitude]));
        }
    });
}

// Function to update risk status
function updateRiskStatus(data) {
    const riskStatus = document.getElementById('risk-status');
    const highRiskAreas = data.filter(item => item.risk_level === 'high');
    
    if (highRiskAreas.length > 0) {
        riskStatus.innerHTML = `
            <div class="alert alert-danger">
                <h6>High Risk Areas:</h6>
                <ul>
                    ${highRiskAreas.map(area => `
                        <li>
                            ${area.location}<br>
                            <small>
                                Water Level: ${area.water_level}m | 
                                Rainfall: ${area.rainfall}mm | 
                                Temp: ${area.temperature}°C
                            </small>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    } else {
        riskStatus.innerHTML = `
            <div class="alert alert-success">
                No high-risk areas at the moment.
            </div>
        `;
    }
}

// Function to update alerts
function updateAlerts(data) {
    const alertsList = document.getElementById('alerts-list');
    const recentAlerts = data
        .filter(item => item.risk_level === 'high')
        .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated))
        .slice(0, 5);

    if (recentAlerts.length > 0) {
        alertsList.innerHTML = `
            <div class="list-group">
                ${recentAlerts.map(alert => `
                    <div class="list-group-item">
                        <h6 class="mb-1">${alert.location}</h6>
                        <small class="text-muted">
                            Water Level: ${alert.water_level}m | 
                            Rainfall: ${alert.rainfall}mm | 
                            Temp: ${alert.temperature}°C<br>
                            Updated: ${alert.last_updated}
                        </small>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        alertsList.innerHTML = `
            <div class="alert alert-info">
                No recent alerts.
            </div>
        `;
    }
}

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add Sibu marker with custom icon
const sibuIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Initialize the map with error handling
function initializeMap() {
    try {
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }

        // Initialize the map
        const map = L.map('map').setView([1.5495, 110.3419], 8); // Sarawak coordinates

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        return map;
    } catch (error) {
        console.error('Error initializing map:', error);
        return null;
    }
}

// Initialize map when the page loads
let map;
document.addEventListener('DOMContentLoaded', () => {
    map = initializeMap();
    if (map) {
        fetchFloodData();
    }
});

// Refresh data every 5 minutes if map is initialized
setInterval(() => {
    if (map) {
        fetchFloodData();
    }
}, 300000); 