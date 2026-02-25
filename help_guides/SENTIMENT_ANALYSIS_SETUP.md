# Sentiment Analysis Setup Guide

This guide explains how to set up and use the sentiment analysis feature for feedback.

## Overview

The sentiment analysis system:
- Trains models ONCE using `csv_data/sentiments_150.csv`
- Provides a FastAPI service for real-time predictions
- Automatically analyzes sentiment and emotion when feedback is added
- Stores results in `peer_feedbacks` and `manager_feedbacks` tables

## Prerequisites

1. Python 3.8+ installed
2. Node.js backend running
3. PostgreSQL database with migration `031_add_sentiment_emotion_to_feedbacks.sql` applied

## Step 1: Install Python Dependencies

```bash
cd gov-productivity-backend
pip install -r requirements.txt
```

**Note:** If you encounter import errors with `cached_download` from `huggingface_hub`, run:
```bash
chmod +x requirements_fix.sh
./requirements_fix.sh
```

Or manually fix with:
```bash
pip install --upgrade sentence-transformers transformers huggingface-hub
```

**Dependencies include:**
- `sentence-transformers>=2.3.1` - For text encoding (updated for compatibility)
- `torch>=2.0.0` - PyTorch (required by sentence-transformers)
- `transformers>=4.35.0` - Hugging Face transformers
- `huggingface-hub>=0.20.0` - For model downloading
- `scikit-learn==1.3.2` - For LogisticRegression classifiers
- `fastapi==0.104.1` - For the prediction API
- `uvicorn[standard]==0.24.0` - ASGI server

## Step 2: Train the Model (Run Once)

Train the sentiment analysis model using the CSV data:

```bash
python train_sentiment_analysis.py
```

This will:
- Load data from `csv_data/sentiments_150.csv`
- Train sentiment and emotion classifiers
- Save models to `ai_models/sentiment_analysis/`

**Expected Output:**
```
============================================================
Training Sentiment Analysis Model
============================================================
Loading training data from ...
Loaded 150 training samples
Loading SentenceTransformer model...
Encoding text data...
Training sentiment classifier...
Sentiment Accuracy: 0.9583
...
✅ Model training completed!
✅ Model saved to ai_models/sentiment_analysis/
```

## Step 3: Start the FastAPI Service

Start the sentiment analysis service:

```bash
python sentiment_service.py
```

Or using uvicorn directly:

```bash
uvicorn sentiment_service:app --host 0.0.0.0 --port 8001
```

The service will:
- Load the trained models on startup
- Listen on `http://localhost:8001`
- Provide `/predict` endpoint for single predictions
- Provide `/health` endpoint to check status

**Test the service:**
```bash
curl http://localhost:8001/health
# Should return: {"status":"ok","model_loaded":true}

curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "My teammate is always supportive and helpful."}'
# Should return: {"sentiment":"positive","emotion":"support,cooperation"}
```

## Step 4: Configure Node.js Backend

The Node.js backend automatically calls the sentiment service. Make sure:

1. The FastAPI service is running on port 8001 (or set `SENTIMENT_SERVICE_URL` env var)
2. The backend has axios installed (already in package.json)

**Environment Variable (optional):**
```bash
# In .env file
SENTIMENT_SERVICE_URL=http://localhost:8001
```

## Step 5: Update Existing Feedbacks (Optional)

If you have existing feedbacks without sentiment/emotion, run:

```bash
node update_existing_feedbacks_sentiment.js
```

This will:
- Find all peer and manager feedbacks with comments
- Analyze each comment
- Update the database with sentiment and emotion

## How It Works

### Automatic Analysis

When feedback is created via:
- `POST /api/feedback/peer` - Peer feedback
- `POST /api/feedback/manager` - Manager feedback

The system:
1. Extracts the comment text
2. Calls the FastAPI service to predict sentiment and emotion
3. Stores results in the database
4. Returns the feedback with sentiment/emotion included

### Prediction Values

**Sentiment:**
- `positive` - Green color in frontend
- `negative` - Red color in frontend  
- `neutral` - Gray color in frontend

**Emotion:**
- Various emotions like: `support,cooperation`, `respect,trust`, `anger`, etc.
- Can be `null` if no emotion classifier or no valid prediction

### Frontend Display

The frontend already displays sentiment and emotion:
- Shows "Emotion: [value]" and "Sentiment: [value]"
- Color-coded based on sentiment
- Centered display in feedback cards

## Troubleshooting

### Model Not Found
**Error:** `Model not found at ai_models/sentiment_analysis/`

**Solution:** Run `python train_sentiment_analysis.py` first

### Service Not Available
**Error:** `ECONNREFUSED` or service unavailable

**Solution:** 
1. Make sure FastAPI service is running: `python sentiment_service.py`
2. Check port 8001 is not in use
3. Verify `SENTIMENT_SERVICE_URL` in .env if using custom port

### Slow Predictions
**Issue:** Predictions taking too long

**Solution:**
- Model loads on first request (takes ~5-10 seconds)
- Subsequent predictions are fast (~100-200ms)
- Consider keeping the service always running

### No Emotion Prediction
**Issue:** Emotion is always `null`

**Solution:**
- Check if emotion classifier was trained (look for "Emotion Accuracy" in training output)
- Verify CSV has emotion data in `emotions` column
- Model may not have enough emotion training data

## Files Structure

```
gov-productivity-backend/
├── ai_models/
│   └── sentiment_analysis/
│       ├── sentiment_encoder/          # SentenceTransformer model
│       ├── sentiment_clf.pkl          # Sentiment classifier
│       └── emotion_clf.pkl            # Emotion classifier (if trained)
├── csv_data/
│   └── sentiments_150.csv             # Training data
├── train_sentiment_analysis.py        # Training script (run once)
├── sentiment_service.py               # FastAPI service
├── update_existing_feedbacks_sentiment.js  # Backfill script
└── src/
    └── services/
        └── sentimentAnalysisService.js  # Node.js service client
```

## API Endpoints

### POST `/predict`
Predict sentiment and emotion for a single text.

**Request:**
```json
{
  "text": "My teammate is always supportive."
}
```

**Response:**
```json
{
  "sentiment": "positive",
  "emotion": "support,cooperation"
}
```

### POST `/batch-predict`
Predict for multiple texts.

**Request:**
```json
{
  "texts": ["Text 1", "Text 2", "Text 3"]
}
```

### GET `/health`
Check service health and model status.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

## Notes

- Models are trained once and reused
- FastAPI service should be kept running for real-time predictions
- If service is down, feedback creation will still work but with default values (neutral/Neutral)
- Sentiment analysis is non-blocking - if it fails, feedback is still saved

