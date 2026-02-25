require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
const fieldEmployeeKpiService = require('./services/fieldEmployeeKpiService');
const staffAdequacyService = require('./services/staffAdequacyService');
const weeklyKpiSnapshotService = require('./services/weeklyKpiSnapshotService');

const PORT = process.env.PORT || 4000;

// Schedule daily check for overdue tasks (15 days past deadline)
const scheduleOverdueTaskCheck = () => {
  const runCheck = async () => {
    try {
      logger.info('[Scheduler] Running overdue task check (15 days past deadline)...');
      const result = await fieldEmployeeKpiService.checkOverdueTasksAndRecalculateKpi();
      logger.info(`[Scheduler] Overdue task check completed: ${result.employeesChecked} employees, ${result.totalOverdueTasks} tasks`);
    } catch (err) {
      logger.error('[Scheduler] Error in overdue task check:', err);
    }
  };

  // Run immediately on startup (in case server was down, wait 30 seconds for DB to be ready)
  setTimeout(runCheck, 30000);

  // Schedule to run daily (every 24 hours)
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(runCheck, ONE_DAY_MS);
  
  logger.info('[Scheduler] Overdue task check scheduled to run daily');
};

// Schedule daily KPI recording (runs at midnight to record the previous day's KPIs)
const scheduleDailyKpiRecording = () => {
  const runDailyKpiRecording = async () => {
    try {
      // Get yesterday's date explicitly (the day that just ended)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      logger.info(`[Scheduler] Running daily KPI recording for date: ${yesterdayStr}...`);
      const results = await fieldEmployeeKpiService.recordDailyKpisForAllEmployees(yesterdayStr);
      const successCount = results.filter(r => r.success).length;
      logger.info(`[Scheduler] Daily KPI recording completed: ${successCount}/${results.length} employees processed for ${yesterdayStr}`);
    } catch (err) {
      logger.error('[Scheduler] Error in daily KPI recording:', err);
    }
  };

  // Calculate milliseconds until next midnight (00:00:00 of next day)
  const getMsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // This sets to 00:00:00 of next day
    return midnight.getTime() - now.getTime();
  };

  // Run at midnight (records the day that just ended)
  const scheduleNextRun = () => {
    const msUntilMidnight = getMsUntilMidnight();
    logger.info(`[Scheduler] Daily KPI recording will run in ${Math.round(msUntilMidnight / 1000 / 60)} minutes (at midnight)`);
    
    setTimeout(() => {
      runDailyKpiRecording();
      // Then schedule to run every 24 hours
      setInterval(runDailyKpiRecording, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  };

  // Initial schedule
  scheduleNextRun();
  
  logger.info('[Scheduler] Daily KPI recording scheduled to run at midnight daily (records previous day)');
};

// Schedule staff adequacy update (runs at midnight to update team_util for the current day)
const scheduleStaffAdequacyUpdate = () => {
  const runStaffAdequacyUpdate = async () => {
    try {
      // Use current date (the day that just started at midnight)
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      logger.info(`[Scheduler] Running staff adequacy update for date: ${todayStr}...`);
      const result = await staffAdequacyService.updateAllStaffAdequacy(todayStr);
      logger.info(`[Scheduler] Staff adequacy update completed: ${result.updatedTeams} teams updated for ${todayStr}`);
    } catch (err) {
      logger.error('[Scheduler] Error in staff adequacy update:', err);
    }
  };

  // Calculate milliseconds until next midnight (00:00:00 of next day)
  const getMsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // This sets to 00:00:00 of next day
    return midnight.getTime() - now.getTime();
  };

  // Run at midnight (updates for the day that just started)
  const scheduleNextRun = () => {
    const msUntilMidnight = getMsUntilMidnight();
    logger.info(`[Scheduler] Staff adequacy update will run in ${Math.round(msUntilMidnight / 1000 / 60)} minutes (at midnight)`);
    
    setTimeout(() => {
      runStaffAdequacyUpdate();
      // Then schedule to run every 24 hours
      setInterval(runStaffAdequacyUpdate, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  };

  // Initial schedule
  scheduleNextRun();
  
  logger.info('[Scheduler] Staff adequacy update scheduled to run at midnight daily (updates current day)');
};

// Schedule weekly KPI snapshot recording (runs on Monday at midnight to record the previous week's KPIs)
const scheduleWeeklyKpiSnapshot = () => {
  const runWeeklyKpiSnapshot = async () => {
    try {
      // Get last week's Monday and Sunday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      
      // Calculate last week's Monday
      const lastWeekMonday = new Date(today);
      const daysToSubtract = dayOfWeek === 0 ? 13 : dayOfWeek + 6; // If Sunday, go back 13 days; otherwise go back to last Monday
      lastWeekMonday.setDate(today.getDate() - daysToSubtract);
      
      // Calculate last week's Sunday
      const lastWeekSunday = new Date(lastWeekMonday);
      lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
      
      const lastWeekMondayStr = lastWeekMonday.toISOString().slice(0, 10);
      const lastWeekSundayStr = lastWeekSunday.toISOString().slice(0, 10);
      
      logger.info(`[Scheduler] Running weekly KPI snapshot for week: ${lastWeekMondayStr} to ${lastWeekSundayStr}...`);
      const result = await weeklyKpiSnapshotService.recordWeeklyKpiSnapshot(lastWeekMondayStr, lastWeekSundayStr);
      logger.info(`[Scheduler] Weekly KPI snapshot completed for week starting ${lastWeekMondayStr}: ${result.average_kpi_scores_of_field}`);
    } catch (err) {
      logger.error('[Scheduler] Error in weekly KPI snapshot:', err);
    }
  };

  // Calculate milliseconds until next Monday at midnight
  const getMsUntilNextMonday = () => {
    const now = new Date();
    const nextMonday = new Date(now);
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // If Sunday, next Monday is tomorrow
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday.getTime() - now.getTime();
  };

  // Run on Monday at midnight (records the week that just ended)
  const scheduleNextRun = () => {
    const msUntilMonday = getMsUntilNextMonday();
    logger.info(`[Scheduler] Weekly KPI snapshot will run in ${Math.round(msUntilMonday / 1000 / 60 / 60)} hours (next Monday at midnight)`);
    
    setTimeout(() => {
      runWeeklyKpiSnapshot();
      // Then schedule to run every 7 days (weekly)
      setInterval(runWeeklyKpiSnapshot, 7 * 24 * 60 * 60 * 1000);
    }, msUntilMonday);
  };

  // Initial schedule
  scheduleNextRun();
  
  logger.info('[Scheduler] Weekly KPI snapshot scheduled to run every Monday at midnight (records previous week)');
};

const start = async () => {
  try {
    await testConnection();
    
    // Check and record weekly KPI snapshot on startup (if needed)
    setTimeout(async () => {
      try {
        logger.info('[Startup] Checking for weekly KPI snapshot...');
        const created = await weeklyKpiSnapshotService.checkAndRecordWeeklySnapshot();
        if (created) {
          logger.info('[Startup] Created new weekly KPI snapshot for current week');
        } else {
          logger.info('[Startup] Weekly KPI snapshot already exists for current week');
        }
      } catch (err) {
        logger.error('[Startup] Error checking weekly KPI snapshot:', err);
      }
    }, 5000); // Wait 5 seconds after DB connection
    
    app.listen(PORT, () => {
      logger.info(`API ready on port ${PORT}`);
      
      // Start scheduled jobs
      scheduleOverdueTaskCheck();
      scheduleDailyKpiRecording();
      scheduleStaffAdequacyUpdate();
      scheduleWeeklyKpiSnapshot();
      logger.info('[Scheduler] All schedulers started');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

start();
