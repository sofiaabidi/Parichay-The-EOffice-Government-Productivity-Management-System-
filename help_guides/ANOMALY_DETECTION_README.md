# Isolation Forest Anomaly Detection for Field Employee Weekly KPIs

This document provides a comprehensive guide for setting up and using the Isolation Forest-based anomaly detection system for Field Employee Weekly KPIs.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Training the Model](#training-the-model)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Database Schema](#database-schema)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The system uses **Isolation Forest** machine learning algorithm to detect anomalies in weekly aggregated KPI scores for field employees and managers. The model is trained on historical data and can identify unusual patterns (high spikes or low dips) in productivity metrics.

### Key Features

- **Automatic Weekly Recording**: System automatically records weekly KPI snapshots every Monday
- **Real-time Anomaly Detection**: Predicts anomalies for the last 12 weeks of data
- **Visual Dashboard**: Interactive bar chart showing normal weeks vs anomalies
- **FastAPI Integration**: Separate Python service for ML model inference

---

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/TS)     │
│                 │
│ Productivity    │
│ Anomaly Chart   │
└────────┬────────┘
         │
         │ HTTP Requests
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ Node.js │ │ FastAPI  │
│ Backend │ │ (Python) │
│         │ │          │
│ Express │ │ ML Model │
│ API     │ │ Service  │
└────┬────┘ └────┬─────┘
     │           │
     │           │
     ▼           ▼
┌─────────────────────┐
│   PostgreSQL DB     │
│                     │
│ weekly_kpi_        │
│ snapshots_field    │
└─────────────────────┘
```

### Components

1. **Frontend Component**: `ProductivityAnomalyChart.tsx`
   - Fetches last 12 weekly snapshots from Node.js backend
   - Sends data to FastAPI for anomaly prediction
   - Displays results in interactive bar chart

2. **Node.js Backend**:
   - `weeklyKpiSnapshotService.js`: Calculates and stores weekly KPIs
   - `fieldOrgController.js`: API endpoint for fetching snapshots
   - Automatic weekly recording on server startup

3. **FastAPI Service** (`app.py`):
   - Isolation Forest model inference
   - Endpoints for training and prediction
   - Model persistence (saved to `ai_models/` folder)

4. **Database**:
   - `weekly_kpi_snapshots_field` table stores weekly aggregated KPIs

---

## Setup Instructions

### Prerequisites

1. **Python 3.8+** with required packages:
   ```bash
   cd gov-productivity-backend
   pip install -r requirements.txt
   ```

2. **Node.js** backend dependencies (already installed)

3. **PostgreSQL** database with migrations applied

### Step 1: Prepare CSV Data

Ensure the CSV file is in the correct location:
```bash
# Copy CSV to csv_data folder (if not already there)
cp ~/Downloads/weekly_avg_kpi_150_rows.csv gov-productivity-backend/csv_data/
```

### Step 2: Train the Model

Train the Isolation Forest model using the provided script:

```bash
cd gov-productivity-backend
python train_isolation_forest.py
```

**Expected Output:**
```
Reading CSV from: /path/to/csv_data/weekly_avg_kpi_150_rows.csv
Loaded 150 rows from CSV
Columns: ['timestamp', 'average_kpi_score']

Training Isolation Forest model...
Using parameters:
  - contamination: 0.05
  - n_estimators: 300
  - random_state: 42

✅ Model trained successfully!
Training samples: 150
Mean KPI: 69.21
Std KPI: 10.84
Model saved to: /path/to/ai_models/isolation_forest_model.pkl
Metadata saved to: /path/to/ai_models/model_metadata.json
```

### Step 3: Seed Database (Optional)

If you want historical data, run the seed script:

```bash
cd gov-productivity-backend
node src/database/seeds/010_seed_weekly_kpi_snapshots_field.js
```

This will:
- Read the last 30 rows from the CSV
- Calculate timestamps going backwards from current time
- Insert data into `weekly_kpi_snapshots_field` table

### Step 4: Start Services

**Terminal 1 - Node.js Backend:**
```bash
cd gov-productivity-backend
npm start
# or for development
npm run dev
```

**Terminal 2 - FastAPI Service:**
```bash
cd gov-productivity-backend
python app.py
# or with uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Configure Environment Variables

**Frontend** (`.env` or `vite.config.ts`):
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_FASTAPI_URL=http://localhost:8000
```

**Backend** (`.env`):
```env
PORT=4000
PGHOST=localhost
PGPORT=5432
PGDATABASE=gov_productivity
PGUSER=postgres
PGPASSWORD=postgres
```

---

## Training the Model

### Manual Training

The model can be trained via:

1. **Python Script** (recommended):
   ```bash
   python train_isolation_forest.py
   ```

2. **FastAPI Endpoint**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/train/upload \
     -F "file=@csv_data/weekly_avg_kpi_150_rows.csv" \
     -F "kpi_column=average_kpi_score"
   ```

3. **FastAPI JSON Endpoint**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/train \
     -H "Content-Type: application/json" \
     -d '{
       "data": [
         {"timestamp": "2024-01-01", "average_kpi_score": 75.5},
         {"timestamp": "2024-01-08", "average_kpi_score": 78.2}
       ]
     }'
   ```

### Model Parameters

The model uses the following hyperparameters (matching the notebook):
- **contamination**: 0.05 (expects 5% of data to be anomalies)
- **n_estimators**: 300 (number of trees in the forest)
- **random_state**: 42 (for reproducibility)
- **max_samples**: 'auto' (default)

### Model Storage

Trained models are saved to:
- **Model**: `gov-productivity-backend/ai_models/isolation_forest_model.pkl`
- **Metadata**: `gov-productivity-backend/ai_models/model_metadata.json`

---

## API Endpoints

### Node.js Backend Endpoints

#### GET `/api/field-org/weekly-kpi-snapshots`
Fetch weekly KPI snapshots.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 12)

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2024-11-04",
    "average_kpi_scores_of_field": 70.47,
    "total_field_employees": 7,
    "total_field_managers": 2,
    "created_at": "2024-12-09T10:00:00Z",
    "updated_at": "2024-12-09T10:00:00Z"
  }
]
```

### FastAPI Endpoints

#### GET `/api/v1/status`
Check model training status.

**Response:**
```json
{
  "is_trained": true,
  "model_exists": true,
  "metadata": {
    "trained": true,
    "training_samples": 150,
    "mean_kpi": 69.21,
    "std_kpi": 10.84
  },
  "parameters": {
    "contamination": 0.05,
    "n_estimators": 300,
    "random_state": 42
  }
}
```

#### POST `/api/v1/predict/weekly-snapshots`
Predict anomalies for weekly snapshot data.

**Request Body:**
```json
{
  "data": [
    {
      "timestamp": "2024-11-04",
      "average_kpi_scores_of_field": 70.47
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "total_predictions": 12,
  "anomalies_detected": 2,
  "predictions": [
    {
      "timestamp": "2024-11-04",
      "average_kpi_scores_of_field": 70.47,
      "prediction": 1,
      "is_anomaly": false,
      "anomaly_score": 0.15
    },
    {
      "timestamp": "2024-10-28",
      "average_kpi_scores_of_field": 96.44,
      "prediction": -1,
      "is_anomaly": true,
      "anomaly_score": -0.25
    }
  ]
}
```

**Prediction Values:**
- `prediction: 1` = Normal
- `prediction: -1` = Anomaly
- `is_anomaly: true/false` = Boolean flag
- `anomaly_score` = Lower values indicate higher anomaly likelihood

#### POST `/api/v1/train`
Train the model with JSON data.

#### POST `/api/v1/train/upload`
Train the model with CSV file upload.

---

## Frontend Integration

### Component: `ProductivityAnomalyChart.tsx`

**Location:** `frontend/src/pages/FieldOrg/components/ProductivityAnomalyChart.tsx`

**Features:**
- Fetches last 12 weekly snapshots from Node.js backend
- Sends data to FastAPI for anomaly prediction
- Displays interactive bar chart with:
  - Normal weeks (blue bars)
  - High spike anomalies (green bars)
  - Low dip anomalies (amber bars)
  - Average reference line

**Data Flow:**
```
1. Component mounts → useEffect triggers
2. Call fieldOrgAPI.getWeeklyKpiSnapshots(12)
3. Receive snapshots from Node.js backend
4. Format data for FastAPI
5. POST to FastAPI /api/v1/predict/weekly-snapshots
6. Receive predictions
7. Combine snapshots + predictions
8. Render bar chart
```

### API Integration

**File:** `frontend/src/services/api.ts`

Added method:
```typescript
fieldOrgAPI.getWeeklyKpiSnapshots(limit?: number)
```

---

## Database Schema

### Table: `weekly_kpi_snapshots_field`

**Migration:** `025_weekly_kpi_snapshots_field.sql`

```sql
CREATE TABLE weekly_kpi_snapshots_field (
  id SERIAL PRIMARY KEY,
  timestamp DATE NOT NULL UNIQUE,
  average_kpi_scores_of_field NUMERIC(5,2) NOT NULL,
  total_field_employees INTEGER DEFAULT 0,
  total_field_managers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Formula:**
```
average_kpi_scores_of_field = 
  (sum of all field employees final_kpi + sum of all field managers final_kpi) / 
  (total number of field employees + total number of field managers)
```

### Automatic Weekly Recording

The system automatically:
1. **On Server Startup**: Checks if current week has a snapshot, creates one if missing
2. **Every Monday at Midnight**: Records the previous week's aggregated KPI

**Service:** `weeklyKpiSnapshotService.js`
- `checkAndRecordWeeklySnapshot()`: Called on server startup
- `scheduleWeeklyKpiSnapshot()`: Scheduled job for weekly recording

---

## Troubleshooting

### Model Not Trained Error

**Error:** `Model is not trained. Please train the model first`

**Solution:**
```bash
cd gov-productivity-backend
python train_isolation_forest.py
```

### FastAPI Connection Error

**Error:** `Failed to fetch` or CORS errors

**Solutions:**
1. Ensure FastAPI is running on port 8000
2. Check `VITE_FASTAPI_URL` in frontend `.env`
3. Verify CORS settings in `app.py`

### No Data in Chart

**Possible Causes:**
1. Database table is empty
2. No weekly snapshots recorded yet
3. API endpoint returning empty array

**Solutions:**
1. Run seed script: `node src/database/seeds/010_seed_weekly_kpi_snapshots_field.js`
2. Wait for automatic weekly recording (or trigger manually)
3. Check backend logs for errors

### Column Name Mismatch

**Error:** `Column 'average_kpi_score' not found`

**Solution:**
The FastAPI endpoint `/api/v1/predict/weekly-snapshots` automatically handles both:
- `average_kpi_score` (from CSV training data)
- `average_kpi_scores_of_field` (from database)

### Model File Not Found

**Error:** Model file doesn't exist

**Solution:**
1. Train the model: `python train_isolation_forest.py`
2. Verify files exist:
   - `ai_models/isolation_forest_model.pkl`
   - `ai_models/model_metadata.json`

---

## File Structure

```
gov-productivity-backend/
├── ai_models/
│   ├── __init__.py
│   ├── isolation_forest_model.py      # Model class
│   ├── isolation_forest_model.pkl     # Trained model (after training)
│   └── model_metadata.json            # Training metadata
├── csv_data/
│   └── weekly_avg_kpi_150_rows.csv    # Training data
├── app.py                              # FastAPI service
├── train_isolation_forest.py          # Training script
├── requirements.txt                    # Python dependencies
└── src/
    ├── services/
    │   └── weeklyKpiSnapshotService.js # Weekly KPI calculation
    ├── controllers/
    │   └── fieldOrgController.js      # API controllers
    └── routes/
        └── fieldOrgRoutes.js           # API routes

frontend/
└── src/
    ├── pages/
    │   └── FieldOrg/
    │       └── components/
    │           └── ProductivityAnomalyChart.tsx  # Frontend component
    └── services/
        └── api.ts                      # API client
```

---

## Summary of Steps

1. ✅ **Train Model**: Run `python train_isolation_forest.py`
2. ✅ **Seed Database** (optional): Run seed script for historical data
3. ✅ **Start Services**: Node.js backend + FastAPI + Frontend
4. ✅ **View Dashboard**: Navigate to Field Organization page
5. ✅ **Automatic Updates**: System records weekly snapshots automatically

---

## Additional Resources

- **Isolation Forest Documentation**: [scikit-learn.org](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- **Recharts Documentation**: [recharts.org](https://recharts.org/)

---

## Notes

- The model expects weekly data points with KPI scores between 0-100
- Anomalies are detected based on statistical isolation (not threshold-based)
- The system uses 5% contamination rate (expects ~5% anomalies)
- Weekly snapshots are calculated from `field_employee_kpi_snapshots` and `manager_kpi_snapshots` tables
- The frontend displays the last 12 weeks of data

---

**Last Updated:** December 2024

