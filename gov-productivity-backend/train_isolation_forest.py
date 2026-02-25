#!/usr/bin/env python3
"""
Script to train the Isolation Forest model for Field Employee Weekly KPIs
Uses the CSV file to train the model and saves it
"""

import os
import sys
import pandas as pd

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from ai_models.isolation_forest_model import IsolationForestKPIAnomalyDetector

def train_model():
    """Train the Isolation Forest model using the CSV data"""
    
    # Path to CSV file
    csv_path = os.path.join(backend_dir, "csv_data", "weekly_avg_kpi_150_rows.csv")
    
    # Alternative path in Downloads
    downloads_path = os.path.join(
        os.path.expanduser("~"), 
        "Downloads", 
        "weekly_avg_kpi_150_rows.csv"
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
    
    # Initialize the detector
    model_dir = os.path.join(backend_dir, "ai_models")
    detector = IsolationForestKPIAnomalyDetector(model_dir=model_dir)
    
    # Train the model
    print("\nTraining Isolation Forest model...")
    print(f"Using parameters:")
    print(f"  - contamination: {detector.contamination}")
    print(f"  - n_estimators: {detector.n_estimators}")
    print(f"  - random_state: {detector.random_state}")
    
    try:
        result = detector.train(df, kpi_column="average_kpi_score")
        print("\n✅ Model trained successfully!")
        print(f"Training samples: {result['metadata']['training_samples']}")
        print(f"Mean KPI: {result['metadata']['mean_kpi']:.2f}")
        print(f"Std KPI: {result['metadata']['std_kpi']:.2f}")
        print(f"Model saved to: {detector.model_path}")
        print(f"Metadata saved to: {detector.metadata_path}")
        
        # Test the model with a few predictions
        print("\nTesting model with sample data...")
        test_data = df.tail(10)
        predictions = detector.predict(test_data)
        anomalies = predictions[predictions['is_anomaly'] == True]
        print(f"Test predictions: {len(predictions)} total, {len(anomalies)} anomalies detected")
        
        if len(anomalies) > 0:
            print("\nDetected anomalies in test data:")
            for idx, row in anomalies.iterrows():
                print(f"  - Row {idx}: KPI={row['average_kpi_score']:.2f}, Score={row.get('anomaly_score', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"\n❌ Error training model: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = train_model()
    sys.exit(0 if success else 1)

