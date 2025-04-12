from flask import Flask, render_template, request, jsonify, redirect, url_for
import requests
import json
import logging
from datetime import datetime, timedelta
import random
import numpy as np
from ai_model import FloodPredictionModel

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI model
ai_model = FloodPredictionModel()

# Sarawak locations and their characteristics
SARAWAK_LOCATIONS = {
    'sibu': {
        'name': 'Sibu',
        'coordinates': {'lat': 2.287, 'lon': 111.833},
        'river_system': 'Rajang River',
        'flood_threshold': 2.5,
        'population': 162676,
        'risk_factors': ['river_level', 'rainfall', 'tidal_effect']
    },
    'kuching': {
        'name': 'Kuching',
        'coordinates': {'lat': 1.549, 'lon': 110.342},
        'river_system': 'Sarawak River',
        'flood_threshold': 2.8,
        'population': 325132,
        'risk_factors': ['river_level', 'rainfall', 'tidal_effect', 'drainage']
    },
    'miri': {
        'name': 'Miri',
        'coordinates': {'lat': 4.399, 'lon': 113.991},
        'river_system': 'Baram River',
        'flood_threshold': 2.2,
        'population': 234707,
        'risk_factors': ['river_level', 'rainfall', 'coastal_effect']
    },
    'bintulu': {
        'name': 'Bintulu',
        'coordinates': {'lat': 3.171, 'lon': 113.041},
        'river_system': 'Kemena River',
        'flood_threshold': 2.4,
        'population': 114058,
        'risk_factors': ['river_level', 'rainfall', 'tidal_effect']
    },
    'sri_aman': {
        'name': 'Sri Aman',
        'coordinates': {'lat': 1.237, 'lon': 111.462},
        'river_system': 'Lupar River',
        'flood_threshold': 2.3,
        'population': 65661,
        'risk_factors': ['river_level', 'rainfall']
    }
}

def calculate_risk_score(location_data):
    """Calculate risk score based on multiple factors"""
    # Use AI model for prediction
    return ai_model.predict_risk(location_data)

def get_risk_level(score):
    """Convert risk score to risk level"""
    if score >= 75:
        return 'high'
    elif score >= 50:
        return 'medium'
    else:
        return 'low'

def generate_forecast(location):
    """Generate 7-day forecast for a location"""
    # Get location data
    location_data = {
        'temperature': random.uniform(25, 30),  # Random temperature between 25-30°C
        'humidity': random.uniform(70, 90),     # Random humidity between 70-90%
        'rainfall': random.uniform(0, 50),      # Random rainfall between 0-50mm
        'river_level': SARAWAK_LOCATIONS[location]['flood_threshold'] * random.uniform(0.8, 1.2),
        'historical_incidents': random.randint(0, 5)
    }
    
    # Use AI model to generate forecast
    return ai_model.generate_forecast(location_data)

def get_current_conditions(location_id):
    """Get current conditions for a location"""
    try:
        # In a real application, this would fetch data from sensors or APIs
        # For now, we'll generate simulated data
        location = SARAWAK_LOCATIONS[location_id]
        
        # Generate random but realistic data
        water_level = location['flood_threshold'] * random.uniform(0.8, 1.2)
        rainfall = random.uniform(0, 50)
        temperature = random.uniform(25, 30)
        humidity = random.uniform(70, 90)
        
        # Calculate risk level based on conditions
        risk_score = calculate_risk_score({
            'water_level': water_level,
            'rainfall': rainfall,
            'temperature': temperature,
            'humidity': humidity
        })
        
        return {
            'risk_level': get_risk_level(risk_score),
            'water_level': water_level,
            'rainfall': rainfall,
            'temperature': temperature,
            'humidity': humidity,
            'last_updated': datetime.now().isoformat()
        }
    except Exception as e:
        app.logger.error(f"Error getting current conditions: {str(e)}")
        return {}

@app.route('/')
def index():
    return redirect(url_for('predict'))

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    if request.method == 'POST':
        location = request.form.get('location')
        if location not in SARAWAK_LOCATIONS:
            return jsonify({'error': 'Invalid location'}), 400
            
        # Generate prediction data
        forecast = generate_forecast(location)
        current_conditions = forecast[0]
        
        return jsonify({
            'location': SARAWAK_LOCATIONS[location]['name'],
            'current_conditions': current_conditions,
            'forecast': forecast,
            'location_info': SARAWAK_LOCATIONS[location]
        })
    
    return render_template('prediction.html', locations=SARAWAK_LOCATIONS)

@app.route('/sibu')
def sibu():
    return render_template('sibu.html')

@app.route('/location/<location_name>')
def location_detail(location_name):
    if location_name not in SARAWAK_LOCATIONS:
        return render_template('404.html'), 404
        
    location_data = SARAWAK_LOCATIONS[location_name]
    forecast = generate_forecast(location_name)
    
    return render_template('location_detail.html',
                         location=location_data,
                         forecast=forecast)

@app.route('/api/flood-data')
def get_flood_data():
    try:
        # Get current conditions for all locations
        data = {}
        for location_id, location in SARAWAK_LOCATIONS.items():
            # Get current conditions
            current_data = get_current_conditions(location_id)
            
            # Validate the data
            if not isinstance(current_data, dict):
                current_data = {}
            
            # Ensure all required fields are present with valid values
            validated_data = {
                'name': location['name'],
                'risk_level': current_data.get('risk_level', 'low'),
                'water_level': float(current_data.get('water_level', 0)),
                'rainfall': float(current_data.get('rainfall', 0)),
                'temperature': float(current_data.get('temperature', 27.5)),
                'humidity': float(current_data.get('humidity', 80)),
                'last_updated': current_data.get('last_updated', datetime.now().isoformat())
            }
            
            # Validate risk level
            if validated_data['risk_level'] not in ['low', 'medium', 'high']:
                validated_data['risk_level'] = 'low'
            
            # Validate numeric ranges
            validated_data['water_level'] = max(0, min(validated_data['water_level'], 10))  # 0-10m
            validated_data['rainfall'] = max(0, min(validated_data['rainfall'], 500))      # 0-500mm
            validated_data['temperature'] = max(20, min(validated_data['temperature'], 35)) # 20-35°C
            validated_data['humidity'] = max(60, min(validated_data['humidity'], 100))     # 60-100%
            
            data[location_id] = validated_data
        
        return jsonify(data)
    except Exception as e:
        app.logger.error(f"Error getting flood data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/predict/<location_id>')
def predict_flood(location_id):
    try:
        if location_id not in SARAWAK_LOCATIONS:
            return jsonify({'error': 'Location not found'}), 404
            
        # Get current conditions
        current_data = get_current_conditions(location_id)
        
        # Validate current data
        if not isinstance(current_data, dict):
            current_data = {}
            
        # Ensure all required fields are present with valid values
        validated_data = {
            'temperature': float(current_data.get('temperature', 27.5)),
            'humidity': float(current_data.get('humidity', 80)),
            'rainfall': float(current_data.get('rainfall', 0)),
            'river_level': float(current_data.get('water_level', 0)),
            'historical_incidents': int(current_data.get('historical_incidents', 0))
        }
        
        # Validate numeric ranges
        validated_data['temperature'] = max(20, min(validated_data['temperature'], 35)) # 20-35°C
        validated_data['humidity'] = max(60, min(validated_data['humidity'], 100))     # 60-100%
        validated_data['rainfall'] = max(0, min(validated_data['rainfall'], 500))      # 0-500mm
        validated_data['river_level'] = max(0, min(validated_data['river_level'], 10)) # 0-10m
        validated_data['historical_incidents'] = max(0, min(validated_data['historical_incidents'], 10)) # 0-10
        
        # Generate forecast
        forecast = ai_model.generate_forecast(validated_data)
        
        return jsonify({
            'location': SARAWAK_LOCATIONS[location_id]['name'],
            'current_conditions': validated_data,
            'forecast': forecast
        })
    except Exception as e:
        app.logger.error(f"Error generating prediction: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

if __name__ == '__main__':
    logger.info("Flood Prediction System startup")
    logger.info("Initializing AI model...")
    try:
        ai_model = FloodPredictionModel()
        logger.info("AI model initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing AI model: {str(e)}")
        raise

    logger.info("Starting Flask application...")
    app.run(host='0.0.0.0', port=5000, debug=True) 