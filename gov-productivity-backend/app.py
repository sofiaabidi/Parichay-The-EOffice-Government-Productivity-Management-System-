"""
FastAPI application for Isolation Forest based anomaly detection model
for Field Employee Weekly KPIs.

This API provides endpoints to:
- Check model status
- Train the model (when ready)
- Predict anomalies (single or batch)
- Get detected anomalies
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import os
import sys
import io

# Add the backend directory to the path to import the model
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from ai_models.isolation_forest_model import IsolationForestKPIAnomalyDetector
from ai_models.xgboost_staff_adequacy_model import XGBoostStaffAdequacyPredictor

# Initialize FastAPI app
app = FastAPI(
    title="Field Employee KPI Anomaly Detection API",
    description="API for detecting anomalies in Field Employee Weekly KPI scores using Isolation Forest",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this based on your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the model detectors
model_dir = os.path.join(backend_dir, "ai_models")
detector = IsolationForestKPIAnomalyDetector(model_dir=model_dir)
staffAdequacyPredictor = XGBoostStaffAdequacyPredictor(model_dir=model_dir)

# Try to load existing models if available
detector.load_model()
staffAdequacyPredictor.load_model()


# ==================== Pydantic Models ====================

class KPIScoreInput(BaseModel):
    """Input model for single KPI score prediction."""
    kpi_score: float = Field(..., description="The KPI score to check for anomalies", ge=0, le=100)


class KPIScorePrediction(BaseModel):
    """Output model for single KPI score prediction."""
    kpi_score: float
    prediction: int  # -1 for anomaly, 1 for normal
    is_anomaly: bool
    label: str  # 'anomaly' or 'normal'
    anomaly_score: Optional[float] = None


class KPIDataPoint(BaseModel):
    """Model for a single KPI data point."""
    timestamp: Optional[str] = None
    average_kpi_score: Optional[float] = Field(None, description="The average KPI score", ge=0, le=100)
    average_kpi_scores_of_field: Optional[float] = Field(None, description="The average KPI score for field (weekly snapshot)", ge=0, le=100)
    # Add other fields as needed
    
    model_config = {
        "populate_by_name": True
    }


class BatchPredictionRequest(BaseModel):
    """Request model for batch prediction."""
    data: List[KPIDataPoint] = Field(..., description="List of KPI data points to predict")


class TrainingRequest(BaseModel):
    """Request model for training."""
    data: List[KPIDataPoint] = Field(..., description="Training data with KPI scores")
    kpi_column: str = Field(default="average_kpi_score", description="Name of the KPI column")


class TrainingResponse(BaseModel):
    """Response model for training."""
    status: str
    message: str
    metadata: Dict[str, Any]


class ModelStatusResponse(BaseModel):
    """Response model for model status."""
    is_trained: bool
    model_exists: bool
    metadata: Dict[str, Any]
    parameters: Dict[str, Any]
    
    model_config = {
        "populate_by_name": True,
        "protected_namespaces": ()
    }


class AnomalyResult(BaseModel):
    """Model for a detected anomaly."""
    timestamp: Optional[str] = None
    average_kpi_score: float
    prediction: int
    is_anomaly: bool
    anomaly_score: Optional[float] = None


class StaffAdequacyInput(BaseModel):
    """Input model for staff adequacy prediction."""
    team_util: float = Field(..., description="Team utilization rate", ge=0, le=1)
    otm: float = Field(..., description="Output to manpower ratio", ge=0)
    cto: float = Field(..., description="Cost to output ratio", ge=0)
    current_team_size: int = Field(..., description="Current number of team members", ge=0)


class StaffAdequacyPrediction(BaseModel):
    """Output model for staff adequacy prediction."""
    required_ppl: int
    staff_gap: int
    status: str  # 'overstaffed', 'understaffed', or 'balanced'
    raw_prediction: float


# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Field Employee KPI Anomaly Detection API",
        "version": "1.0.0",
        "description": "Isolation Forest based anomaly detection for Field Employee Weekly KPIs",
        "endpoints": {
            "status": "/api/v1/status",
            "train": "/api/v1/train",
            "predict_single": "/api/v1/predict",
            "predict_batch": "/api/v1/predict/batch",
            "anomalies": "/api/v1/anomalies"
        }
    }


@app.get("/api/v1/status", response_model=ModelStatusResponse)
async def get_model_status():
    """
    Get the current status of the Isolation Forest model.
    
    Returns:
        - is_trained: Whether the model has been trained
        - model_exists: Whether a saved model file exists
        - metadata: Training metadata (if available)
        - parameters: Model hyperparameters
    """
    try:
        status = detector.get_status()
        return ModelStatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model status: {str(e)}")


@app.post("/api/v1/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """
    Train the Isolation Forest model on provided KPI data.
    
    Note: The model will not be trained until you explicitly call this endpoint.
    
    Args:
        request: Training request containing KPI data points
        
    Returns:
        Training results with metadata
    """
    try:
        # Convert request data to DataFrame
        if not request.data:
            raise HTTPException(status_code=400, detail="Training data cannot be empty")
        
        # Convert to DataFrame
        data_dict = [item.model_dump() for item in request.data]
        df = pd.DataFrame(data_dict)
        
        # Train the model
        result = detector.train(df, kpi_column=request.kpi_column)
        
        return TrainingResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")


@app.post("/api/v1/train/upload")
async def train_model_from_csv(file: UploadFile = File(...), kpi_column: str = "average_kpi_score"):
    """
    Train the Isolation Forest model from a CSV file upload.
    
    The CSV file should contain a column with KPI scores (default: 'average_kpi_score').
    
    Args:
        file: CSV file containing training data
        kpi_column: Name of the column containing KPI scores
        
    Returns:
        Training results with metadata
    """
    try:
        # Read the uploaded CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        if kpi_column not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Column '{kpi_column}' not found in CSV. Available columns: {list(df.columns)}"
            )
        
        # Train the model
        result = detector.train(df, kpi_column=kpi_column)
        
        return TrainingResponse(**result)
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model from CSV: {str(e)}")


@app.post("/api/v1/predict", response_model=KPIScorePrediction)
async def predict_single(input_data: KPIScoreInput):
    """
    Predict if a single KPI score is an anomaly.
    
    Args:
        input_data: Single KPI score to predict
        
    Returns:
        Prediction result with anomaly status
    """
    try:
        if not detector.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="Model is not trained. Please train the model first using /api/v1/train"
            )
        
        result = detector.predict_single(input_data.kpi_score)
        return KPIScorePrediction(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")


@app.post("/api/v1/predict/batch")
async def predict_batch(request: BatchPredictionRequest):
    """
    Predict anomalies for a batch of KPI data points.
    
    Args:
        request: Batch prediction request containing multiple KPI data points
        
    Returns:
        List of predictions with anomaly status for each data point
    """
    try:
        if not detector.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="Model is not trained. Please train the model first using /api/v1/train"
            )
        
        if not request.data:
            raise HTTPException(status_code=400, detail="Prediction data cannot be empty")
        
        # Convert to DataFrame
        data_dict = [item.model_dump() for item in request.data]
        df = pd.DataFrame(data_dict)
        
        # Make predictions
        predictions = detector.predict(df)
        
        # Convert to response format
        results = []
        for _, row in predictions.iterrows():
            result = {
                "timestamp": row.get("timestamp"),
                "average_kpi_score": float(row["average_kpi_score"]),
                "prediction": int(row["anomaly"]),
                "is_anomaly": bool(row["is_anomaly"]),
                "anomaly_score": float(row["anomaly_score"]) if pd.notna(row.get("anomaly_score")) else None
            }
            results.append(result)
        
        return {
            "status": "success",
            "total_predictions": len(results),
            "anomalies_detected": sum(1 for r in results if r["is_anomaly"]),
            "predictions": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making batch prediction: {str(e)}")


@app.post("/api/v1/predict/upload")
async def predict_batch_from_csv(file: UploadFile = File(...), kpi_column: str = "average_kpi_score"):
    """
    Predict anomalies for KPI data from a CSV file upload.
    
    Args:
        file: CSV file containing KPI data to predict
        kpi_column: Name of the column containing KPI scores
        
    Returns:
        Predictions with anomaly status for each row
    """
    try:
        if not detector.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="Model is not trained. Please train the model first using /api/v1/train"
            )
        
        # Read the uploaded CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        if kpi_column not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Column '{kpi_column}' not found in CSV. Available columns: {list(df.columns)}"
            )
        
        # Make predictions
        predictions = detector.predict(df, kpi_column=kpi_column)
        
        # Convert to response format
        results = []
        for _, row in predictions.iterrows():
            result = {
                "timestamp": row.get("timestamp"),
                "average_kpi_score": float(row[kpi_column]),
                "prediction": int(row["anomaly"]),
                "is_anomaly": bool(row["is_anomaly"]),
                "anomaly_score": float(row["anomaly_score"]) if pd.notna(row.get("anomaly_score")) else None
            }
            # Include all original columns
            for col in df.columns:
                if col not in ["anomaly", "is_anomaly", "anomaly_score"]:
                    result[col] = row[col] if pd.notna(row[col]) else None
            results.append(result)
        
        return {
            "status": "success",
            "total_predictions": len(results),
            "anomalies_detected": sum(1 for r in results if r["is_anomaly"]),
            "predictions": results
        }
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction from CSV: {str(e)}")


@app.post("/api/v1/anomalies")
async def get_anomalies(request: BatchPredictionRequest):
    """
    Get only the detected anomalies from a batch of KPI data.
    
    Args:
        request: Batch prediction request containing multiple KPI data points
        
    Returns:
        List of detected anomalies only
    """
    try:
        if not detector.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="Model is not trained. Please train the model first using /api/v1/train"
            )
        
        if not request.data:
            raise HTTPException(status_code=400, detail="Data cannot be empty")
        
        # Convert to DataFrame
        data_dict = [item.model_dump() for item in request.data]
        df = pd.DataFrame(data_dict)
        
        # Get anomalies
        anomalies_df = detector.get_anomalies(df)
        
        # Convert to response format
        anomalies = []
        for _, row in anomalies_df.iterrows():
            anomaly = {
                "timestamp": row.get("timestamp"),
                "average_kpi_score": float(row["average_kpi_score"]),
                "prediction": int(row["anomaly"]),
                "is_anomaly": True,
                "anomaly_score": float(row["anomaly_score"]) if pd.notna(row.get("anomaly_score")) else None
            }
            anomalies.append(anomaly)
        
        return {
            "status": "success",
            "total_anomalies": len(anomalies),
            "anomalies": anomalies
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")


@app.post("/api/v1/predict/weekly-snapshots")
async def predict_weekly_snapshots(request: BatchPredictionRequest):
    """
    Predict anomalies for weekly KPI snapshot data.
    
    This endpoint is specifically designed for weekly_kpi_snapshots_field data.
    It automatically maps 'average_kpi_scores_of_field' to 'average_kpi_score' 
    since the model was trained with 'average_kpi_score'.
    
    Args:
        request: Batch prediction request containing weekly KPI snapshot data points
        
    Returns:
        Predictions with anomaly status for each weekly snapshot
    """
    try:
        if not detector.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="Model is not trained. Please train the model first using /api/v1/train"
            )
        
        if not request.data:
            raise HTTPException(status_code=400, detail="Prediction data cannot be empty")
        
        # Convert to DataFrame
        data_dict = [item.model_dump() for item in request.data]
        df = pd.DataFrame(data_dict)
        
        # Store original column name for response
        original_kpi_column = None
        if "average_kpi_scores_of_field" in df.columns:
            original_kpi_column = "average_kpi_scores_of_field"
            # Map to the column name the model expects (it was trained with 'average_kpi_score')
            df["average_kpi_score"] = df["average_kpi_scores_of_field"]
            kpi_column = "average_kpi_score"
        elif "average_kpi_score" in df.columns:
            original_kpi_column = "average_kpi_score"
            kpi_column = "average_kpi_score"
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Neither 'average_kpi_score' nor 'average_kpi_scores_of_field' found in data. Available columns: {list(df.columns)}"
            )
        
        # Make predictions using the column name the model expects
        predictions = detector.predict(df, kpi_column=kpi_column)
        
        # Convert to response format
        results = []
        for idx, row in predictions.iterrows():
            # Get the original KPI value
            if original_kpi_column == "average_kpi_scores_of_field":
                kpi_value = float(row["average_kpi_scores_of_field"])
            else:
                kpi_value = float(row["average_kpi_score"])
            
            result = {
                "timestamp": row.get("timestamp"),
                "average_kpi_scores_of_field": kpi_value,
                "prediction": int(row["anomaly"]),
                "is_anomaly": bool(row["is_anomaly"]),
                "anomaly_score": float(row["anomaly_score"]) if pd.notna(row.get("anomaly_score")) else None
            }
            # Include other original columns
            for col in df.columns:
                if col not in ["anomaly", "is_anomaly", "anomaly_score", "average_kpi_score"]:
                    result[col] = row[col] if pd.notna(row[col]) else None
            results.append(result)
        
        return {
            "status": "success",
            "total_predictions": len(results),
            "anomalies_detected": sum(1 for r in results if r["is_anomaly"]),
            "predictions": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")


@app.post("/api/v1/anomalies/upload")
async def get_anomalies_from_csv(file: UploadFile = File(...), kpi_column: str = "average_kpi_score"):
    """
    Get only the detected anomalies from a CSV file upload.
    
    Args:
        file: CSV file containing KPI data
        kpi_column: Name of the column containing KPI scores
        
    Returns:
        List of detected anomalies only
    """
    try:
        if not detector.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="Model is not trained. Please train the model first using /api/v1/train"
            )
        
        # Read the uploaded CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        if kpi_column not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Column '{kpi_column}' not found in CSV. Available columns: {list(df.columns)}"
            )
        
        # Get anomalies
        anomalies_df = detector.get_anomalies(df, kpi_column=kpi_column)
        
        # Convert to response format
        anomalies = []
        for _, row in anomalies_df.iterrows():
            anomaly = {
                "timestamp": row.get("timestamp"),
                "average_kpi_score": float(row[kpi_column]),
                "prediction": int(row["anomaly"]),
                "is_anomaly": True,
                "anomaly_score": float(row["anomaly_score"]) if pd.notna(row.get("anomaly_score")) else None
            }
            # Include all original columns
            for col in df.columns:
                if col not in ["anomaly", "is_anomaly", "anomaly_score"]:
                    anomaly[col] = row[col] if pd.notna(row[col]) else None
            anomalies.append(anomaly)
        
        return {
            "status": "success",
            "total_anomalies": len(anomalies),
            "anomalies": anomalies
        }
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies from CSV: {str(e)}")


@app.post("/api/v1/staff-adequacy/predict", response_model=StaffAdequacyPrediction)
async def predict_staff_adequacy(input_data: StaffAdequacyInput):
    """
    Predict required people for a team using XGBoost model.
    
    Args:
        input_data: Team metrics (team_util, otm, cto, current_team_size)
        
    Returns:
        Prediction result with required_ppl, staff_gap, and status
    """
    try:
        if not staffAdequacyPredictor.is_trained:
            raise HTTPException(
                status_code=400, 
                detail="XGBoost model is not trained. Please train the model first using /api/v1/staff-adequacy/train"
            )
        
        result = staffAdequacyPredictor.predict_single(
            team_util=input_data.team_util,
            otm=input_data.otm,
            cto=input_data.cto,
            current_team_size=input_data.current_team_size
        )
        
        return StaffAdequacyPrediction(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")


@app.post("/api/v1/staff-adequacy/train", response_model=TrainingResponse)
async def train_staff_adequacy_model(request: TrainingRequest):
    """
    Train the XGBoost model for staff adequacy prediction.
    
    Note: The model will not be trained until you explicitly call this endpoint.
    
    Args:
        request: Training request containing team data points
        
    Returns:
        Training results with metadata
    """
    try:
        # Convert request data to DataFrame
        if not request.data:
            raise HTTPException(status_code=400, detail="Training data cannot be empty")
        
        # Convert to DataFrame
        data_dict = [item.model_dump() for item in request.data]
        df = pd.DataFrame(data_dict)
        
        # Check for required columns
        required_cols = ['team_util', 'otm', 'cto', 'current_team_size', 'predicted_required_people']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {missing_cols}. Available: {list(df.columns)}"
            )
        
        # Train the model
        result = staffAdequacyPredictor.train(df, target_column='predicted_required_people')
        
        return TrainingResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")


@app.post("/api/v1/staff-adequacy/train/upload")
async def train_staff_adequacy_from_csv(file: UploadFile = File(...)):
    """
    Train the XGBoost model from a CSV file upload.
    
    The CSV file should contain columns: team_util, otm, cto, current_team_size, predicted_required_people
    
    Args:
        file: CSV file containing training data
        
    Returns:
        Training results with metadata
    """
    try:
        # Read the uploaded CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Check for required columns
        required_cols = ['team_util', 'otm', 'cto', 'current_team_size', 'predicted_required_people']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {missing_cols}. Available: {list(df.columns)}"
            )
        
        # Train the model
        result = staffAdequacyPredictor.train(df, target_column='predicted_required_people')
        
        return TrainingResponse(**result)
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model from CSV: {str(e)}")


@app.get("/api/v1/staff-adequacy/status")
async def get_staff_adequacy_model_status():
    """
    Get the current status of the XGBoost staff adequacy model.
    
    Returns:
        Model status information
    """
    try:
        status = staffAdequacyPredictor.get_status()
        return ModelStatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model status: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

