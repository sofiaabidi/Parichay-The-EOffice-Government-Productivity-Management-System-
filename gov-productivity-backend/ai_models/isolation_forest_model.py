

import os
import pickle
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Optional, Tuple
import json


class IsolationForestKPIAnomalyDetector:
    
    
    def __init__(self, model_dir: str = None):
        
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.model_dir = model_dir
        self.model = None
        self.is_trained = False
        self.model_path = os.path.join(model_dir, 'isolation_forest_model.pkl')
        self.metadata_path = os.path.join(model_dir, 'model_metadata.json')
        
        # Model parameters (matching the notebook)
        self.contamination = 0.05
        self.n_estimators = 300
        self.random_state = 42
        self.max_samples = 'auto'
        
        # Training metadata
        self.training_metadata = {
            'trained': False,
            'training_samples': 0,
            'mean_kpi': None,
            'std_kpi': None,
            'trained_at': None
        }
    
    def _create_model(self):
        """Create a new IsolationForest model with the specified parameters."""
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_estimators=self.n_estimators,
            max_samples=self.max_samples
        )
    
    def train(self, data: pd.DataFrame, kpi_column: str = 'average_kpi_score') -> Dict:
        
        if data.empty:
            raise ValueError("Training data cannot be empty")
        
        if kpi_column not in data.columns:
            raise ValueError(f"Column '{kpi_column}' not found in data")
        
        # Extract KPI scores for training
        train_df = data[[kpi_column]].copy()
        
        # Create and train the model
        self._create_model()
        self.model.fit(train_df)
        
        # Calculate statistics
        mean_kpi = train_df[kpi_column].mean()
        std_kpi = train_df[kpi_column].std()
        
        # Update metadata
        self.is_trained = True
        self.training_metadata = {
            'trained': True,
            'training_samples': len(train_df),
            'mean_kpi': float(mean_kpi),
            'std_kpi': float(std_kpi),
            'trained_at': pd.Timestamp.now().isoformat()
        }
        
        # Save the model
        self.save_model()
        
        return {
            'status': 'success',
            'message': 'Model trained successfully',
            'metadata': self.training_metadata
        }
    
    def predict(self, data: pd.DataFrame, kpi_column: str = 'average_kpi_score') -> pd.DataFrame:
        
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        if data.empty:
            raise ValueError("Prediction data cannot be empty")
        
        if kpi_column not in data.columns:
            raise ValueError(f"Column '{kpi_column}' not found in data")
        
        
        predict_df = data[[kpi_column]].copy()
        
        
        if kpi_column != 'average_kpi_score':
            predict_df = predict_df.rename(columns={kpi_column: 'average_kpi_score'})
        
        # Make predictions
        predictions = self.model.predict(predict_df)
        
        # Create result DataFrame
        result = data.copy()
        result['anomaly'] = predictions
        result['is_anomaly'] = (predictions == -1)
        
        # Add anomaly scores (decision function)
        if hasattr(self.model, 'decision_function'):
            result['anomaly_score'] = self.model.decision_function(predict_df)
        else:
            result['anomaly_score'] = None
        
        return result
    
    def predict_single(self, kpi_score: float) -> Dict:
        
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        # Create DataFrame with single value
        data = pd.DataFrame({'average_kpi_score': [kpi_score]})
        
        # Make prediction
        prediction = self.model.predict(data)
        is_anomaly = prediction[0] == -1
        
        result = {
            'kpi_score': kpi_score,
            'prediction': int(prediction[0]),
            'is_anomaly': bool(is_anomaly),
            'label': 'anomaly' if is_anomaly else 'normal'
        }
        
        # Add anomaly score if available
        if hasattr(self.model, 'decision_function'):
            anomaly_score = self.model.decision_function(data)[0]
            result['anomaly_score'] = float(anomaly_score)
        
        return result
    
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
            'parameters': {
                'contamination': self.contamination,
                'n_estimators': self.n_estimators,
                'random_state': self.random_state,
                'max_samples': self.max_samples
            }
        }
    
    def get_anomalies(self, data: pd.DataFrame, kpi_column: str = 'average_kpi_score') -> pd.DataFrame:
        
        predictions = self.predict(data, kpi_column)
        anomalies = predictions[predictions['is_anomaly'] == True]
        return anomalies

