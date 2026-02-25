#!/usr/bin/env python3
"""
Script to train the Sentiment Analysis model for Feedback
Trains on CSV data and saves the model
Run this script ONCE to train the model
"""

import os
import sys

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from ai_models.sentiment_analysis_model import SentimentAnalysisModel

def train_model():
    """Train the sentiment analysis model using the CSV data"""
    
    # Path to CSV file
    csv_path = os.path.join(backend_dir, "csv_data", "sentiments_150.csv")
    
    # Alternative path check
    if not os.path.exists(csv_path):
        print(f"CSV file not found at {csv_path}")
        downloads_path = os.path.join(
            os.path.expanduser("~"), 
            "Downloads", 
            "sentiments_150.csv"
        )
        if os.path.exists(downloads_path):
            csv_path = downloads_path
            print(f"Using CSV from Downloads: {csv_path}")
        else:
            raise FileNotFoundError(f"CSV file not found at {csv_path} or {downloads_path}")
    
    # Model directory
    model_dir = os.path.join(backend_dir, "ai_models", "sentiment_analysis")
    
    print("=" * 60)
    print("Training Sentiment Analysis Model")
    print("=" * 60)
    
    # Initialize and train model
    model = SentimentAnalysisModel()
    model.train(csv_path)
    
    # Save model
    print("\nSaving model...")
    model.save(model_dir)
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"Model saved to: {model_dir}")
    print("\nYou can now use the FastAPI service for predictions.")

if __name__ == "__main__":
    train_model()

