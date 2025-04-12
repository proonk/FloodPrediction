import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime, timedelta

class FloodPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = 'models/flood_prediction_model.joblib'
        self.scaler_path = 'models/scaler.joblib'
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Initialize or load model
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize or load the trained model"""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
        else:
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            # Train with some initial data
            self._train_initial_model()
    
    def _train_initial_model(self):
        """Train the model with some initial synthetic data"""
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        # Features: temperature, humidity, rainfall, river_level, historical_incidents
        X = np.random.rand(n_samples, 5)
        X[:, 0] = X[:, 0] * 15 + 20  # Temperature: 20-35°C
        X[:, 1] = X[:, 1] * 40 + 60  # Humidity: 60-100%
        X[:, 2] = X[:, 2] * 100      # Rainfall: 0-100mm
        X[:, 3] = X[:, 3] * 3        # River level: 0-3m
        X[:, 4] = X[:, 4] * 10       # Historical incidents: 0-10
        
        # Target: flood risk score (0-100)
        y = np.zeros(n_samples)
        for i in range(n_samples):
            y[i] = self._calculate_risk_score(X[i])
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        
        # Save model and scaler
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
    
    def _calculate_risk_score(self, features):
        """Calculate risk score based on features"""
        temp, humidity, rainfall, river_level, historical = features
        
        # Temperature factor (20% weight)
        temp_factor = 1 - abs(temp - 27.5) / 7.5  # Optimal around 27.5°C
        
        # Humidity factor (20% weight)
        humidity_factor = humidity / 100
        
        # Rainfall factor (30% weight)
        rainfall_factor = min(1.0, rainfall / 100)
        
        # River level factor (20% weight)
        river_factor = min(1.0, river_level / 3)
        
        # Historical factor (10% weight)
        historical_factor = min(1.0, historical / 10)
        
        # Calculate weighted score
        score = (
            temp_factor * 20 +
            humidity_factor * 20 +
            rainfall_factor * 30 +
            river_factor * 20 +
            historical_factor * 10
        )
        
        return min(100, max(0, score))
    
    def predict_risk(self, location_data):
        """Predict flood risk for a location"""
        # Validate and sanitize input data
        validated_data = {
            'temperature': min(max(location_data.get('temperature', 27.5), 20), 35),  # 20-35°C
            'humidity': min(max(location_data.get('humidity', 80), 60), 100),        # 60-100%
            'rainfall': max(location_data.get('rainfall', 0), 0),                    # ≥ 0mm
            'river_level': max(location_data.get('river_level', 0), 0),              # ≥ 0m
            'historical_incidents': min(max(location_data.get('historical_incidents', 0), 0), 10)  # 0-10
        }
        
        # Extract features
        features = np.array([
            validated_data['temperature'],
            validated_data['humidity'],
            validated_data['rainfall'],
            validated_data['river_level'],
            validated_data['historical_incidents']
        ]).reshape(1, -1)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict risk score
        risk_score = self.model.predict(features_scaled)[0]
        
        # Ensure risk score is between 0 and 100
        return min(100, max(0, risk_score))
    
    def generate_forecast(self, location_data, days=7):
        """Generate forecast for multiple days"""
        forecast = []
        base_data = location_data.copy()
        
        # Set a fixed seed based on the current date to ensure consistent predictions for the same day
        current_date = datetime.now().date()
        np.random.seed(hash(current_date) % 2**32)
        
        for i in range(days):
            date = datetime.now() + timedelta(days=i)
            
            # Add some randomness to the features with fixed seed and validate ranges
            base_data['temperature'] = min(max(
                base_data.get('temperature', 27.5) + np.random.normal(0, 1),
                20), 35)  # Keep within 20-35°C
            base_data['humidity'] = min(max(
                base_data.get('humidity', 80) + np.random.normal(0, 5),
                60), 100)  # Keep within 60-100%
            base_data['rainfall'] = max(
                base_data.get('rainfall', 0) + np.random.normal(0, 10),
                0)  # Keep ≥ 0mm
            base_data['river_level'] = max(
                base_data.get('river_level', 0) + np.random.normal(0, 0.2),
                0)  # Keep ≥ 0m
            
            # Predict risk score
            risk_score = self.predict_risk(base_data)
            
            forecast.append({
                'date': date.strftime('%Y-%m-%d'),
                'temperature': round(base_data['temperature'], 1),
                'humidity': round(base_data['humidity'], 1),
                'rainfall': round(base_data['rainfall'], 1),
                'river_level': round(base_data['river_level'], 2),
                'risk_score': round(risk_score, 1),
                'risk_level': 'high' if risk_score >= 75 else 'medium' if risk_score >= 50 else 'low'
            })
        
        return forecast 