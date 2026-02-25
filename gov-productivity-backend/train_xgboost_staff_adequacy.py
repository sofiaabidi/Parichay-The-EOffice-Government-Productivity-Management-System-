#!/usr/bin/env python3
"""
Script to train the XGBoost model for Staff Adequacy Prediction
Uses the CSV file to train the model and saves it
"""

import os
import sys
import pandas as pd
import math

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from ai_models.xgboost_staff_adequacy_model import XGBoostStaffAdequacyPredictor

def train_model():
    """Train the XGBoost model using the CSV data"""
    
    # Path to CSV file
    csv_path = os.path.join(backend_dir, "csv_data", "team_prediction_dataset_100.csv")
    
    # Alternative path in Downloads
    downloads_path = os.path.join(
        os.path.expanduser("~"), 
        "Downloads", 
        "team_prediction_dataset_100.csv"
    )
    
    # Try to find the CSV file
    if os.path.exists(csv_path):
        print(f"Reading CSV from: {csv_path}")
        df = pd.read_csv(csv_path)
    elif os.path.exists(downloads_path):
        print(f"Reading CSV from: {downloads_path}")
        df = pd.read_csv(downloads_path)
    else:
        print(f"Error: CSV file not found!")
        print(f"Expected locations:")
        print(f"  - {csv_path}")
        print(f"  - {downloads_path}")
        sys.exit(1)
    
    print(f"Loaded {len(df)} rows from CSV")
    print(f"Columns: {list(df.columns)}")
    
    # Check required columns
    required_cols = ['team_util', 'otm', 'cto', 'current_team_size', 'predicted_required_people']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Error: Missing required columns: {missing_cols}")
        sys.exit(1)
    
    # Initialize the predictor
    model_dir = os.path.join(backend_dir, "ai_models")
    predictor = XGBoostStaffAdequacyPredictor(model_dir=model_dir)
    
    # Train the model
    print("\nTraining XGBoost Regressor model...")
    print(f"Using parameters:")
    for key, value in predictor.model_params.items():
        print(f"  - {key}: {value}")
    
    try:
        result = predictor.train(df, target_column='predicted_required_people', test_size=0.2)
        print("\n✅ Model trained successfully!")
        print(f"Training samples: {result['metadata']['training_samples']}")
        print(f"Test samples: {result['metadata']['test_samples']}")
        print(f"Test R² score: {result['test_score']:.4f}")
        print(f"Model saved to: {predictor.model_path}")
        print(f"Metadata saved to: {predictor.metadata_path}")
        
        # Test the model with a few predictions
        print("\nTesting model with sample data...")
        test_data = df.tail(5)
        predictions = predictor.predict(test_data)
        
        print("\nSample predictions:")
        for idx, row in predictions.iterrows():
            required_ppl = row['required_ppl']
            current_size = row['current_team_size']
            staff_gap = current_size - required_ppl
            status = 'overstaffed' if staff_gap > 1 else ('understaffed' if staff_gap < -1 else 'balanced')
            
            print(f"  Team {row.get('team_id', 'N/A')}: "
                  f"Current={current_size}, Required={required_ppl}, "
                  f"Gap={staff_gap}, Status={status}")
        
        return True
    except Exception as e:
        print(f"\n❌ Error training model: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = train_model()
    sys.exit(0 if success else 1)

