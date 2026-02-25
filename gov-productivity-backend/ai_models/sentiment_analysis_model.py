

import os
import pickle
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import numpy as np

class SentimentAnalysisModel:
    """Sentiment and Emotion Analysis Model"""
    
    def __init__(self):
        self.encoder_model = None
        self.sentiment_clf = None
        self.emotion_clf = None
        self.is_trained = False
        
    def train(self, csv_path):
        """Train the model using CSV data"""
        print(f"Loading training data from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        print(f"Loaded {len(df)} training samples")
        
        # Initialize encoder
        print("Loading SentenceTransformer model...")
        self.encoder_model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Encode text
        print("Encoding text data...")
        X = self.encoder_model.encode(df["text"].tolist())
        
        # Prepare labels
        y_sentiment = df["sentiment"]  # positive / negative / neutral
        y_emotion = df["emotions"]     # various emotions
        
        # Train/test split for sentiment
        print("Splitting data for sentiment classification...")
        X_train, X_test, y_sent_train, y_sent_test = train_test_split(
            X, y_sentiment, test_size=0.2, random_state=42
        )
        
        # Train sentiment classifier
        print("Training sentiment classifier...")
        self.sentiment_clf = LogisticRegression(max_iter=1000, random_state=42)
        self.sentiment_clf.fit(X_train, y_sent_train)
        
        # Evaluate sentiment
        sentiment_pred = self.sentiment_clf.predict(X_test)
        sentiment_acc = accuracy_score(y_sent_test, sentiment_pred)
        print(f"Sentiment Accuracy: {sentiment_acc:.4f}")
        print("\nSentiment Classification Report:")
        print(classification_report(y_sent_test, sentiment_pred))
        
        # Handle emotion training (filter NaN values)
        print("\nPreparing emotion data...")
        valid_emotion_indices = y_emotion.dropna().index.values
        X_emotion_filtered = X[valid_emotion_indices]
        y_emotion_filtered = y_emotion.loc[valid_emotion_indices]
        
        if len(y_emotion_filtered) > 0:
            print(f"Training emotion classifier on {len(y_emotion_filtered)} samples...")
            X_emo_train, X_emo_test, y_emo_train, y_emo_test = train_test_split(
                X_emotion_filtered, y_emotion_filtered, test_size=0.2, random_state=42
            )
            
            # Train emotion classifier
            self.emotion_clf = LogisticRegression(max_iter=1000, random_state=42)
            self.emotion_clf.fit(X_emo_train, y_emo_train)
            
            # Evaluate emotion
            emotion_pred = self.emotion_clf.predict(X_emo_test)
            emotion_acc = accuracy_score(y_emo_test, emotion_pred)
            print(f"Emotion Accuracy: {emotion_acc:.4f}")
            print("\nEmotion Classification Report:")
            print(classification_report(y_emo_test, emotion_pred))
        else:
            print("Warning: No valid emotion data found")
            self.emotion_clf = None
        
        self.is_trained = True
        print("\nModel training completed!")
        
    def predict(self, text):
        """Predict sentiment and emotion for given text"""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first or load a saved model.")
        
        # Encode text
        text_embedding = self.encoder_model.encode([text])
        
        # Predict sentiment
        sentiment = self.sentiment_clf.predict(text_embedding)[0]
        
        # Predict emotion (if classifier exists)
        emotion = None
        if self.emotion_clf is not None:
            emotion = self.emotion_clf.predict(text_embedding)[0]
        
        return {
            "sentiment": sentiment,
            "emotion": emotion
        }
    
    def save(self, model_dir):
        """Save the trained model"""
        os.makedirs(model_dir, exist_ok=True)
        
        # Save encoder (it's a transformer model, we'll need to save it separately)
        encoder_path = os.path.join(model_dir, "sentiment_encoder")
        self.encoder_model.save(encoder_path)
        
        # Save classifiers
        with open(os.path.join(model_dir, "sentiment_clf.pkl"), "wb") as f:
            pickle.dump(self.sentiment_clf, f)
        
        if self.emotion_clf is not None:
            with open(os.path.join(model_dir, "emotion_clf.pkl"), "wb") as f:
                pickle.dump(self.emotion_clf, f)
        
        print(f"Model saved to {model_dir}")
    
    def load(self, model_dir):
        """Load a saved model"""
        encoder_path = os.path.join(model_dir, "sentiment_encoder")
        self.encoder_model = SentenceTransformer(encoder_path)
        
        with open(os.path.join(model_dir, "sentiment_clf.pkl"), "rb") as f:
            self.sentiment_clf = pickle.load(f)
        
        emotion_clf_path = os.path.join(model_dir, "emotion_clf.pkl")
        if os.path.exists(emotion_clf_path):
            with open(emotion_clf_path, "rb") as f:
                self.emotion_clf = pickle.load(f)
        
        self.is_trained = True
        print(f"Model loaded from {model_dir}")

