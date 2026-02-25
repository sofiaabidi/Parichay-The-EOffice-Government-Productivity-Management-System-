"""
XGBoost Regressor Model for Staff Adequacy Prediction
Predicts required_ppl based on team_util, otm, cto, and current_team_size
"""

import os
import pickle
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from typing import List, Dict, Optional
import json
import math


class XGBoostStaffAdequacyPredictor:
    
    def __init__(self, model_dir: str = None):
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.model_dir = model_dir
        self.model = None
        self.is_trained = False
        self.model_path = os.path.join(model_dir, 'xgboost_staff_adequacy_model.pkl')
        self.metadata_path = os.path.join(model_dir, 'xgboost_staff_adequacy_metadata.json')
        
        # Model parameters (default XGBoost parameters)
        self.model_params = {
            'random_state': 42,
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1
        }
        
        # Training metadata
        self.training_metadata = {
            'trained': False,
            'training_samples': 0,
            'test_score': None,
            'feature_names': ['team_util', 'otm', 'cto', 'current_team_size'],
            'trained_at': None
        }
    
    def _create_model(self):
        """Create a new XGBRegressor model with the specified parameters."""
        self.model = XGBRegressor(**self.model_params)
    
    def train(self, data: pd.DataFrame, target_column: str = 'predicted_required_people', test_size: float = 0.2) -> Dict:

        if data.empty:
            raise ValueError("Training data cannot be empty")
        
        # Check required columns
        required_features = ['team_util', 'otm', 'cto', 'current_team_size']
        missing_features = [f for f in required_features if f not in data.columns]
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")
        
        if target_column not in data.columns:
            raise ValueError(f"Target column '{target_column}' not found in data")
        
        # Prepare features (exclude team_id and last_updated if present)
        feature_columns = [col for col in required_features if col in data.columns]
        X = data[feature_columns].copy()
        y = data[target_column].copy()
        
        # Split data
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Create and train the model
        self._create_model()
        self.model.fit(X_train, y_train)
        
        # Evaluate on test set
        test_score = self.model.score(X_test, y_test)
        
        # Update metadata
        self.is_trained = True
        self.training_metadata = {
            'trained': True,
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'test_score': float(test_score),
            'feature_names': feature_columns,
            'trained_at': pd.Timestamp.now().isoformat()
        }
        
        # Save the model
        self.save_model()
        
        return {
            'status': 'success',
            'message': 'Model trained successfully',
            'metadata': self.training_metadata,
            'test_score': float(test_score)
        }
    
    def predict(self, data: pd.DataFrame) -> pd.DataFrame:

        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        if data.empty:
            raise ValueError("Prediction data cannot be empty")
        
        # Check required features
        required_features = self.training_metadata.get('feature_names', ['team_util', 'otm', 'cto', 'current_team_size'])
        missing_features = [f for f in required_features if f not in data.columns]
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")
        
        # Prepare features
        X = data[required_features].copy()
        
        # Handle missing values (fill with 0 or mean)
        X = X.fillna(0)
        
        # Make predictions
        predictions = self.model.predict(X)
        
        # Create result DataFrame
        result = data.copy()
        result['required_ppl'] = [math.ceil(p) for p in predictions]
        
        return result
    
    def predict_single(self, team_util: float, otm: float, cto: float, current_team_size: int) -> Dict:
        
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        # Create DataFrame with single row
        data = pd.DataFrame({
            'team_util': [team_util],
            'otm': [otm],
            'cto': [cto],
            'current_team_size': [current_team_size]
        })
        
        # Make prediction
        prediction = self.model.predict(data)[0]
        required_ppl = math.ceil(prediction)
        
        # Calculate staff gap
        staff_gap = current_team_size - required_ppl
        
        # Determine status
        if staff_gap > 1:
            status = 'overstaffed'
        elif staff_gap < -1:
            status = 'understaffed'
        else:
            status = 'balanced'
        
        return {
            'required_ppl': int(required_ppl),
            'staff_gap': int(staff_gap),
            'status': status,
            'raw_prediction': float(prediction)
        }
    
    def save_model(self):
        """Save the trained model and metadata to disk."""
        if self.model is None:
            raise ValueError("No model to save. Train the model first.")
        
        # Save the model
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save metadata
        with open(self.metadata_path, 'w') as f:
            json.dump(self.training_metadata, f, indent=2)
    
    def load_model(self) -> bool:
        
        if not os.path.exists(self.model_path):
            return False
        
        try:
            # Load the model
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load metadata
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'r') as f:
                    self.training_metadata = json.load(f)
                    self.is_trained = self.training_metadata.get('trained', False)
            
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def get_status(self) -> Dict:
        
        return {
            'is_trained': self.is_trained,
            'model_exists': os.path.exists(self.model_path),
            'metadata': self.training_metadata,
            'parameters': self.model_params
        }

