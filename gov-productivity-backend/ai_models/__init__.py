"""
AI Models package for anomaly detection and other ML models.
"""

from .isolation_forest_model import IsolationForestKPIAnomalyDetector
from .xgboost_staff_adequacy_model import XGBoostStaffAdequacyPredictor

__all__ = ['IsolationForestKPIAnomalyDetector', 'XGBoostStaffAdequacyPredictor']

