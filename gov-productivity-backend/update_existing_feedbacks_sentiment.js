/**
 * Script to update existing feedbacks with sentiment and emotion predictions
 * Run this once to backfill existing feedbacks in the database
 */

const { query } = require('./src/config/database');
const sentimentAnalysisService = require('./src/services/sentimentAnalysisService');

async function updateExistingFeedbacks() {
  console.log('='.repeat(60));
  console.log('Updating Existing Feedbacks with Sentiment Analysis');
  console.log('='.repeat(60));
  
  // Check if service is available
  const isAvailable = await sentimentAnalysisService.isServiceAvailable();
  if (!isAvailable) {
    console.error('❌ Sentiment Analysis service is not available!');
    console.error('Please make sure the FastAPI service is running on port 8001');
    console.error('Start it with: python sentiment_service.py');
    process.exit(1);
  }
  
  console.log('✅ Sentiment Analysis service is available\n');
  
  try {
    // Get all peer feedbacks without sentiment/emotion
    console.log('Fetching peer feedbacks...');
    const { rows: peerFeedbacks } = await query(`
      SELECT id, comment 
      FROM peer_feedbacks 
      WHERE (sentiment IS NULL OR emotion IS NULL OR sentiment = 'neutral') 
      AND comment IS NOT NULL 
      AND comment != ''
    `);
    
    console.log(`Found ${peerFeedbacks.length} peer feedbacks to update`);
    
    let updatedPeer = 0;
    for (const feedback of peerFeedbacks) {
      try {
        const analysis = await sentimentAnalysisService.predictSentiment(feedback.comment);
        await query(
          `UPDATE peer_feedbacks SET sentiment = $1, emotion = $2 WHERE id = $3`,
          [analysis.sentiment, analysis.emotion, feedback.id]
        );
        updatedPeer++;
        if (updatedPeer % 10 === 0) {
          console.log(`  Updated ${updatedPeer}/${peerFeedbacks.length} peer feedbacks...`);
        }
      } catch (error) {
        console.error(`  Error updating peer feedback ${feedback.id}:`, error.message);
      }
    }
    
    console.log(`✅ Updated ${updatedPeer} peer feedbacks\n`);
    
    // Get all manager feedbacks without sentiment/emotion
    console.log('Fetching manager feedbacks...');
    const { rows: managerFeedbacks } = await query(`
      SELECT id, comment 
      FROM manager_feedbacks 
      WHERE (sentiment IS NULL OR emotion IS NULL OR sentiment = 'neutral') 
      AND comment IS NOT NULL 
      AND comment != ''
    `);
    
    console.log(`Found ${managerFeedbacks.length} manager feedbacks to update`);
    
    let updatedManager = 0;
    for (const feedback of managerFeedbacks) {
      try {
        const analysis = await sentimentAnalysisService.predictSentiment(feedback.comment);
        await query(
          `UPDATE manager_feedbacks SET sentiment = $1, emotion = $2 WHERE id = $3`,
          [analysis.sentiment, analysis.emotion, feedback.id]
        );
        updatedManager++;
        if (updatedManager % 10 === 0) {
          console.log(`  Updated ${updatedManager}/${managerFeedbacks.length} manager feedbacks...`);
        }
      } catch (error) {
        console.error(`  Error updating manager feedback ${feedback.id}:`, error.message);
      }
    }
    
    console.log(`✅ Updated ${updatedManager} manager feedbacks\n`);
    
    console.log('='.repeat(60));
    console.log('Update Complete!');
    console.log('='.repeat(60));
    console.log(`Total updated: ${updatedPeer + updatedManager} feedbacks`);
    console.log(`  - Peer feedbacks: ${updatedPeer}`);
    console.log(`  - Manager feedbacks: ${updatedManager}`);
    
  } catch (error) {
    console.error('❌ Error updating feedbacks:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the update
updateExistingFeedbacks();

