"""
FastAPI Service for Sentiment Analysis
Provides endpoints for predicting sentiment and emotion
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import sys

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from ai_models.sentiment_analysis_model import SentimentAnalysisModel

app = FastAPI(title="Sentiment Analysis Service", version="1.0.0")

# Global model instance
model = None

class PredictionRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    sentiment: str
    emotion: str

class BatchPredictionRequest(BaseModel):
    texts: list[str]

def load_model():
    """Load the trained sentiment analysis model"""
    global model
    if model is None:
        model_dir = os.path.join(backend_dir, "ai_models", "sentiment_analysis")
        if not os.path.exists(model_dir):
            raise FileNotFoundError(
                f"Model not found at {model_dir}. Please run train_sentiment_analysis.py first."
            )
        model = SentimentAnalysisModel()
        model.load(model_dir)
    return model

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    try:
        load_model()
        print("✅ Sentiment Analysis Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        print("Make sure to run train_sentiment_analysis.py first")

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict_sentiment(request: PredictionRequest):
    """Predict sentiment and emotion for given text"""
    try:
        if model is None:
            load_model()
        
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        result = model.predict(request.text.strip())
        
        return PredictionResponse(
            sentiment=result["sentiment"],
            emotion=result["emotion"] or "Neutral"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/batch-predict")
async def batch_predict(request: BatchPredictionRequest):
    """Predict sentiment and emotion for multiple texts"""
    try:
        if model is None:
            load_model()
        
        results = []
        for text in request.texts:
            if text and text.strip():
                result = model.predict(text.strip())
                results.append({
                    "text": text,
                    "sentiment": result["sentiment"],
                    "emotion": result["emotion"] or "Neutral"
                })
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

