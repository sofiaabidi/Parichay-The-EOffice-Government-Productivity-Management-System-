/**
 * Sentiment Analysis Service
 * Calls the Python FastAPI service to predict sentiment and emotion
 */

const axios = require('axios');

const SENTIMENT_SERVICE_URL = process.env.SENTIMENT_SERVICE_URL || 'http://localhost:8001';

/**
 * Predict sentiment and emotion for a given text
 * @param {string} text - The feedback text to analyze
 * @returns {Promise<{sentiment: string, emotion: string}>}
 */
async function predictSentiment(text) {
  try {
    if (!text || !text.trim()) {
      return {
        sentiment: 'neutral',
        emotion: 'Neutral'
      };
    }

    const response = await axios.post(
      `${SENTIMENT_SERVICE_URL}/predict`,
      { text: text.trim() },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout
      }
    );

    return {
      sentiment: response.data.sentiment || 'neutral',
      emotion: response.data.emotion || 'Neutral'
    };
  } catch (error) {
    console.error('[Sentiment Analysis] Error predicting sentiment:', error.message);
    
    // If service is unavailable, return default values
    if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
      console.warn('[Sentiment Analysis] Service unavailable, using default values');
      return {
        sentiment: 'neutral',
        emotion: 'Neutral'
      };
    }
    
    throw error;
  }
}

/**
 * Check if the sentiment analysis service is available
 * @returns {Promise<boolean>}
 */
async function isServiceAvailable() {
  try {
    const response = await axios.get(`${SENTIMENT_SERVICE_URL}/health`, {
      timeout: 5000
    });
    return response.data.model_loaded === true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  predictSentiment,
  isServiceAvailable
};

