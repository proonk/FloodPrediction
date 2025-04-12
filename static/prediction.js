// Function to populate location dropdown
async function populateLocations() {
    try {
        const response = await fetch('/api/flood-data');
        const data = await response.json();
        
        if (data.success) {
            const locationSelect = document.getElementById('location');
            const locations = [...new Set(data.data.map(item => item.location))];
            
            // Add Sibu, Sarawak as a location option
            if (!locations.includes('Sibu, Sarawak')) {
                locations.push('Sibu, Sarawak');
            }
            
            // Sort locations alphabetically
            locations.sort();
            
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

// Function to get prediction
async function getPrediction(location, date) {
    try {
        const response = await fetch('/api/flood-data');
        const data = await response.json();
        
        if (data.success) {
            const locationData = data.data.find(item => item.location === location);
            
            if (locationData) {
                // Simple prediction logic based on historical data
                const riskLevel = calculateRiskLevel(locationData, date);
                displayPrediction(location, riskLevel);
            } else {
                displayError('Location data not found');
            }
        } else {
            displayError('Failed to fetch prediction data');
        }
    } catch (error) {
        console.error('Error getting prediction:', error);
        displayError('An error occurred while getting the prediction');
    }
}

// Function to calculate risk level
function calculateRiskLevel(locationData, date) {
    // This is a simplified prediction model
    // In a real application, this would use more sophisticated algorithms
    const riskFactors = {
        historical_risk: locationData.risk_level === 'High' ? 0.7 : 0.3,
        seasonal_factor: isRainySeason(date) ? 0.6 : 0.2,
        recent_activity: locationData.last_updated ? 0.5 : 0.1
    };
    
    const totalRisk = Object.values(riskFactors).reduce((a, b) => a + b, 0);
    
    if (totalRisk > 1.2) return 'High';
    if (totalRisk > 0.8) return 'Medium';
    return 'Low';
}

// Function to check if date is in rainy season
function isRainySeason(date) {
    const month = new Date(date).getMonth();
    // Simplified: Consider October to March as rainy season in Sarawak
    return month >= 9 || month <= 2;
}

// Function to display prediction results
function displayPrediction(location, riskLevel) {
    const resultsDiv = document.getElementById('prediction-results');
    const riskClass = {
        'High': 'danger',
        'Medium': 'warning',
        'Low': 'success'
    }[riskLevel];
    
    resultsDiv.innerHTML = `
        <div class="alert alert-${riskClass}">
            <h5>Prediction Results for ${location}</h5>
            <p>Risk Level: <strong>${riskLevel}</strong></p>
            <p>Date: ${document.getElementById('date').value}</p>
            <hr>
            <p class="mb-0">
                ${getRiskDescription(riskLevel)}
            </p>
        </div>
    `;
}

// Function to get risk description
function getRiskDescription(riskLevel) {
    const descriptions = {
        'High': 'High probability of flooding. Take necessary precautions and monitor the situation closely.',
        'Medium': 'Moderate risk of flooding. Stay alert and prepare for possible flooding.',
        'Low': 'Low risk of flooding. Continue monitoring the situation.'
    };
    return descriptions[riskLevel];
}

// Function to display error
function displayError(message) {
    const resultsDiv = document.getElementById('prediction-results');
    resultsDiv.innerHTML = `
        <div class="alert alert-danger">
            ${message}
        </div>
    `;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    populateLocations();
    
    document.getElementById('prediction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const location = document.getElementById('location').value;
        const date = document.getElementById('date').value;
        
        if (location && date) {
            getPrediction(location, date);
        } else {
            displayError('Please select both location and date');
        }
    });
}); 