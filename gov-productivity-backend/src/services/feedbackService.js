const { query } = require('../config/database');
const auditService = require('./auditService');
const sentimentAnalysisService = require('./sentimentAnalysisService');

// Task feedback (for task rejections)
const addFeedback = async (taskId, fromUserId, toUserId, payload) => {
  const sql = `
    INSERT INTO task_feedbacks (
      task_id, from_user_id, to_user_id, rating, comment
    ) VALUES ($1,$2,$3,$4,$5)
    RETURNING *
  `;
  const { rows } = await query(sql, [taskId, fromUserId, toUserId, payload.rating, payload.comment || null]);
  await auditService.logAction(fromUserId, 'TASK_FEEDBACK_ADDED', 'task_feedbacks', rows[0].id, {
    taskId,
    rating: payload.rating,
  });
  return rows[0];
};

// Peer-to-peer feedback
const addPeerFeedback = async (fromUserId, toUserId, payload) => {
  // Analyze sentiment and emotion from comment text
  let sentiment = 'neutral';
  let emotion = 'Neutral';
  
  if (payload.comment && payload.comment.trim()) {
    try {
      const analysis = await sentimentAnalysisService.predictSentiment(payload.comment);
      sentiment = analysis.sentiment;
      emotion = analysis.emotion;
      console.log(`[Sentiment Analysis] Peer feedback - Sentiment: ${sentiment}, Emotion: ${emotion}`);
    } catch (error) {
      console.error(`[Sentiment Analysis] Error analyzing peer feedback:`, error.message);
      // Continue with default values if analysis fails
    }
  }
  
  const sql = `
    INSERT INTO peer_feedbacks (
      from_user_id, to_user_id, regarding, rating, comment, sentiment, emotion
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    fromUserId,
    toUserId,
    payload.regarding || null,
    payload.rating,
    payload.comment || null,
    sentiment,
    emotion,
  ]);
  await auditService.logAction(fromUserId, 'PEER_FEEDBACK_ADDED', 'peer_feedbacks', rows[0].id, {
    toUserId,
    rating: payload.rating,
    sentiment,
    emotion,
  });
  
  // Trigger promotion score recalculation when feedback is received (async, don't wait)
  // Since normalization affects all employees, recalculate all promotion scores
  console.log(`[Promotion Score Trigger] PEER FEEDBACK RECEIVED - Triggering Promotion Score Recalculation`);
  console.log(`[Promotion Score Trigger] Employee ID: ${toUserId}, Rating: ${payload.rating}`);
  
  const promotionScoreService = require('./promotionScoreService');
  promotionScoreService.calculateAndStorePromotionScores()
    .then(results => {
      console.log(`[Promotion Score Trigger] ✅ Successfully recalculated promotion scores for all ${results.length} employees after peer feedback`);
    })
    .catch(err => {
      console.error(`[Promotion Score Trigger] ❌ Error recalculating promotion scores after peer feedback:`, err);
    });
  
  return rows[0];
};

// Manager-to-employee feedback
const addManagerFeedback = async (managerId, employeeId, payload) => {
  // Analyze sentiment and emotion from comment text
  let sentiment = 'neutral';
  let emotion = 'Neutral';
  
  if (payload.comment && payload.comment.trim()) {
    try {
      const analysis = await sentimentAnalysisService.predictSentiment(payload.comment);
      sentiment = analysis.sentiment;
      emotion = analysis.emotion;
      console.log(`[Sentiment Analysis] Manager feedback - Sentiment: ${sentiment}, Emotion: ${emotion}`);
    } catch (error) {
      console.error(`[Sentiment Analysis] Error analyzing manager feedback:`, error.message);
      // Continue with default values if analysis fails
    }
  }
  
  const sql = `
    INSERT INTO manager_feedbacks (
      manager_id, employee_id, regarding, rating, comment, sentiment, emotion
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    managerId,
    employeeId,
    payload.regarding || null,
    payload.rating,
    payload.comment || null,
    sentiment,
    emotion,
  ]);
  await auditService.logAction(managerId, 'MANAGER_FEEDBACK_ADDED', 'manager_feedbacks', rows[0].id, {
    employeeId,
    rating: payload.rating,
    sentiment,
    emotion,
  });
  
  
  console.log(`[Promotion Score Trigger] MANAGER FEEDBACK RECEIVED - Triggering Promotion Score Recalculation`);
  console.log(`[Promotion Score Trigger] Employee ID: ${employeeId}, Rating: ${payload.rating}`);
  
  const promotionScoreService = require('./promotionScoreService');
  promotionScoreService.calculateAndStorePromotionScores()
    .then(results => {
      console.log(`[Promotion Score Trigger]  Successfully recalculated promotion scores for all ${results.length} employees after manager feedback`);
    })
    .catch(err => {
      console.error(`[Promotion Score Trigger]  Error recalculating promotion scores after manager feedback:`, err);
    });
  
  return rows[0];
};

// Get feedback for user (peer + manager feedbacks, NOT task feedbacks)
const getFeedbackForUser = async (userId) => {
  // Get peer feedbacks
  const { rows: peerRows } = await query(
    `
      SELECT 
        pf.id, pf.regarding, pf.rating, pf.comment, pf.created_at,
        pf.sentiment, pf.emotion,
        u.name AS from_name, u.role AS from_role,
        'peer' AS feedback_type
      FROM peer_feedbacks pf
      JOIN users u ON u.id = pf.from_user_id
      WHERE pf.to_user_id = $1
      ORDER BY pf.created_at DESC
    `,
    [userId],
  );

  // Get manager feedbacks
  const { rows: managerRows } = await query(
    `
      SELECT 
        mf.id, mf.regarding, mf.rating, mf.comment, mf.created_at,
        mf.sentiment, mf.emotion,
        u.name AS from_name, u.role AS from_role,
        'manager' AS feedback_type
      FROM manager_feedbacks mf
      JOIN users u ON u.id = mf.manager_id
      WHERE mf.employee_id = $1
      ORDER BY mf.created_at DESC
    `,
    [userId],
  );

  // Combine and sort by date
  const allFeedbacks = [...peerRows, ...managerRows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return allFeedbacks;
};

module.exports = {
  addFeedback,
  addPeerFeedback,
  addManagerFeedback,
  getFeedbackForUser,
};

