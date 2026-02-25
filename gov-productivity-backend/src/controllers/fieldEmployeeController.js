const fieldEmployeeService = require('../services/fieldEmployeeService');

const getMyProjects = async (req, res, next) => {
  try {
    const projects = await fieldEmployeeService.getMyProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const getMySurveys = async (req, res, next) => {
  try {
    const surveys = await fieldEmployeeService.getMySurveys(req.user.id);
    res.json(surveys);
  } catch (error) {
    next(error);
  }
};

const submitSurveySubmission = async (req, res, next) => {
  try {
    const submission = await fieldEmployeeService.submitSurveySubmission(
      req.user.id,
      req.body.survey_id,
      req.body
    );
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

const getMyKPI = async (req, res, next) => {
  try {
    console.log(`[KPI Controller] GET /field/employee/kpi - Employee ID: ${req.user.id}`);
    const { periodStart, periodEnd } = req.query;
    console.log(`[KPI Controller] Request params:`, { periodStart, periodEnd });
    
    const fieldEmployeeKpiService = require('../services/fieldEmployeeKpiService');
    
    // Fetch from DB first (values are stored when surveys are approved/recalculated)
    console.log(`[KPI Controller] Step 1: Fetching KPI from DB for employee ${req.user.id}...`);
    let kpi = await fieldEmployeeKpiService.getFieldEmployeeKpi(
      req.user.id,
      periodStart,
      periodEnd
    );
    
    // If not found in DB, calculate and store it
    if (!kpi) {
      console.log(`[KPI Controller] Step 2: No KPI found in DB for employee ${req.user.id}, calculating...`);
      kpi = await fieldEmployeeKpiService.computeFieldEmployeeKpis(
        req.user.id,
        periodStart,
        periodEnd,
        { persist: true }
      );
      console.log(`[KPI Controller] Step 3: Calculated and stored KPI for employee ${req.user.id}:`, {
        dprKpi: kpi.dprKpi,
        technicalComplianceKpi: kpi.technicalComplianceKpi,
        surveyKpi: kpi.surveyKpi,
        expenditureKpi: kpi.expenditureKpi,
        taskTimelinessKpi: kpi.taskTimelinessKpi,
        finalKpi: kpi.finalKpi,
        periodStart: kpi.periodStart,
        periodEnd: kpi.periodEnd
      });
    } else {
      console.log(`[KPI Controller] Step 2: Fetched KPI from DB for employee ${req.user.id}:`, {
        dprKpi: kpi.dprKpi,
        technicalComplianceKpi: kpi.technicalComplianceKpi,
        surveyKpi: kpi.surveyKpi,
        expenditureKpi: kpi.expenditureKpi,
        taskTimelinessKpi: kpi.taskTimelinessKpi,
        finalKpi: kpi.finalKpi,
        periodStart: kpi.period_start || kpi.periodStart,
        periodEnd: kpi.period_end || kpi.periodEnd
      });
    }
    
    console.log(`[KPI Controller] Step 4: Sending response to frontend for employee ${req.user.id}`);
    res.json(kpi);
  } catch (error) {
    console.error(`[KPI Controller] ERROR for employee ${req.user.id}:`, error);
    next(error);
  }
};

const getMyKPIHistory = async (req, res, next) => {
  try {
    console.log(`[KPI Controller] GET /field/employee/kpi/history - Employee ID: ${req.user.id}`);
    const history = await fieldEmployeeService.getMyKPIHistory(req.user.id);
    console.log(`[KPI Controller] Returning KPI history for employee ${req.user.id}:`, {
      historyCount: Array.isArray(history) ? history.length : 0
    });
    res.json(history);
  } catch (error) {
    console.error(`[KPI Controller] ERROR fetching history for employee ${req.user.id}:`, error);
    next(error);
  }
};

const getMyDailyKPIHistory = async (req, res, next) => {
  try {
    console.log(`[Daily KPI Controller] GET /field/employee/kpi/daily-history - Employee ID: ${req.user.id}`);
    const fieldEmployeeKpiService = require('../services/fieldEmployeeKpiService');
    const limit = parseInt(req.query.limit) || 30;
    const history = await fieldEmployeeKpiService.getFieldEmployeeDailyKpiHistory(req.user.id, limit);
    console.log(`[Daily KPI Controller] Returning daily KPI history for employee ${req.user.id}:`, {
      historyCount: Array.isArray(history) ? history.length : 0
    });
    res.json(history);
  } catch (error) {
    console.error(`[Daily KPI Controller] ERROR fetching daily history for employee ${req.user.id}:`, error);
    next(error);
  }
};

const getLocationById = async (req, res, next) => {
  try {
    const location = await fieldEmployeeService.getLocationById(req.params.locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    next(error);
  }
};

const getMyLocations = async (req, res, next) => {
  try {
    const locations = await fieldEmployeeService.getMyLocations(req.user.id);
    res.json(locations);
  } catch (error) {
    next(error);
  }
};

const saveLocation = async (req, res, next) => {
  try {
    const location = await fieldEmployeeService.saveLocation(req.user.id, req.body);
    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    const result = await fieldEmployeeService.deleteLocation(req.user.id, req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyFieldVisits = async (req, res, next) => {
  try {
    const visits = await fieldEmployeeService.getMyFieldVisits(req.user.id);
    res.json(visits);
  } catch (error) {
    next(error);
  }
};

const getMyTrainings = async (req, res, next) => {
  try {
    const trainings = await fieldEmployeeService.getMyTrainings(req.user.id);
    res.json(trainings);
  } catch (error) {
    next(error);
  }
};

const getMyPeers = async (req, res, next) => {
  try {
    console.log(`[getMyPeers] Request from user ${req.user.id} (${req.user.email}), role: ${req.user.role}`);
    const peers = await fieldEmployeeService.getMyPeers(req.user.id);
    console.log(`[getMyPeers] Returning ${peers.length} peers for user ${req.user.id}`);
    res.json({ members: peers });
  } catch (error) {
    console.error(`[getMyPeers] Error for user ${req.user.id}:`, error);
    next(error);
  }
};

const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await fieldEmployeeService.getMyFeedback(req.user.id);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

const getAvailableSkills = async (req, res, next) => {
  try {
    const skills = await fieldEmployeeService.getAvailableSkills();
    res.json(skills);
  } catch (error) {
    next(error);
  }
};

const getMySkills = async (req, res, next) => {
  try {
    const skills = await fieldEmployeeService.getMySkills(req.user.id);
    res.json(skills);
  } catch (error) {
    next(error);
  }
};

const saveMySkills = async (req, res, next) => {
  try {
    const { skills } = req.body; // Array of skill names
    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: 'Skills must be an array' });
    }
    const savedSkills = await fieldEmployeeService.saveMySkills(req.user.id, skills);
    res.json(savedSkills);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProjects,
  getMySurveys,
  submitSurveySubmission,
  getMyKPI,
  getMyKPIHistory,
  getMyDailyKPIHistory,
  getLocationById,
  getMyLocations,
  saveLocation,
  deleteLocation,
  getMyFieldVisits,
  getMyTrainings,
  getMyPeers,
  getMyFeedback,
  getAvailableSkills,
  getMySkills,
  saveMySkills,
};

