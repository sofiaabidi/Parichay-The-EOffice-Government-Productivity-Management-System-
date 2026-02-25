const { query, getClient } = require('../config/database');
const auditService = require('./auditService');


const DMAX_DPR = 5; // max tolerated late days for DPR
const THETA_DPR = 0.6; 

const DMAX_TASK = 7; 
const TASK_IGNORE_DAYS = 10; 


const LAMBDA_COVERAGE = 0.4;
const LAMBDA_SPEED = 0.3;
const LAMBDA_SUPERVISOR = 0.3;

const UPPER_SPEED_LIMIT = 1.0;

// Overspend limit
const OMAX = 0.15; // 15% overspend threshold


const ensurePeriod = (start, end) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  // First day of month
  const first = new Date(Date.UTC(year, month, 1));
  // Last day of month
  const last = new Date(Date.UTC(year, month + 1, 0));
  
  const toDateString = (value, fallback) => {
    if (value) {
      const date = new Date(value);
      return date.toISOString().slice(0, 10); 
    }
    return fallback.toISOString().slice(0, 10);
  };
  
  const toTimestamp = (value, fallback) => {
    if (value) {
      const date = new Date(value);
      // If it's a date-only string, set to start/end of day
      if (value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For start date, use beginning of day
        if (value === toDateString(value, first)) {
          return new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0, 0, 0, 0
          )).toISOString();
        }
        // For end date, use end of day
        return new Date(Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          23, 59, 59, 999
        )).toISOString();
      }
      return date.toISOString();
    }
    const startTs = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString();
    const endTs = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
    return fallback === first ? startTs : endTs;
  };
  
  const dateStart = toDateString(start, first);
  const dateEnd = toDateString(end, last);
  const tsStart = toTimestamp(start, first);
  const tsEnd = toTimestamp(end, last);
  
  return {
    dateStart, 
    dateEnd,   
    tsStart,   
    tsEnd      
  };
};


const daysDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.max(0, Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)));
};


const parseNumeric = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[₹$€£,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

// 1. TIMELINESS & QUALITY OF DPR
const calculateDprKpi = async (employeeId, periodStart, periodEnd) => {
  // If period is null, use all historical data
  let sql;
  let params;
  if (periodStart === null || periodEnd === null) {
    sql = `
      SELECT 
        actual_submission_date,
        deadline,
        authenticity_stars,
        data_correctness_stars,
        technical_correctness_stars,
        completeness_stars,
        tools_and_resources_stars
      FROM dpr_reviews
      WHERE reviewed_for = $1
    `;
    params = [employeeId];
    console.log(`[DPR KPI] Calculating for employee ${employeeId} using ALL historical data`);
  } else {
    sql = `
      SELECT 
        actual_submission_date,
        deadline,
        authenticity_stars,
        data_correctness_stars,
        technical_correctness_stars,
        completeness_stars,
        tools_and_resources_stars
      FROM dpr_reviews
      WHERE reviewed_for = $1
        AND actual_submission_date >= $2
        AND actual_submission_date <= $3
    `;
    params = [employeeId, periodStart, periodEnd];
    console.log(`[DPR KPI] Calculating for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
  }
  const { rows } = await query(sql, params);

  if (rows.length === 0) {
    if (periodStart === null || periodEnd === null) {
      console.log(`[DPR KPI] No DPR reviews found for employee ${employeeId} (all historical data)`);
    } else {
      console.log(`[DPR KPI] No DPR reviews found for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
    }
    return 0;
  }
  
  console.log(`[DPR KPI] Found ${rows.length} DPR reviews for employee ${employeeId}`);

  const N_DPR = rows.length;

  // 1A. Timeliness of DPR
  let timelinessSum = 0;
  for (const dpr of rows) {
    const delay_i = Math.max(0, daysDifference(dpr.deadline, dpr.actual_submission_date));
    const T_i = 1 - Math.min(1, delay_i / DMAX_DPR);
    timelinessSum += T_i;
  }
  const Timeliness_DPR = timelinessSum / N_DPR;

  // 1B. Quality of DPR
  const w_auth = 0.20;
  const w_data = 0.20;
  const w_tech = 0.20;
  const w_complete = 0.20;
  const w_tools = 0.20;

  let qualitySum = 0;
  for (const dpr of rows) {
    const auth_i = parseNumeric(dpr.authenticity_stars, 0) / 5;
    const data_i = parseNumeric(dpr.data_correctness_stars, 0) / 5;
    const tech_i = parseNumeric(dpr.technical_correctness_stars, 0) / 5;
    const complete_i = parseNumeric(dpr.completeness_stars, 0) / 5;
    const tools_i = parseNumeric(dpr.tools_and_resources_stars, 0) / 5;

    const Q_i = w_auth * auth_i +
                w_data * data_i +
                w_tech * tech_i +
                w_complete * complete_i +
                w_tools * tools_i;
    qualitySum += Q_i;
  }
  const Quality_DPR = qualitySum / N_DPR;

  // 1C. Final DPR KPI
  const DPR_KPI = 100 * (THETA_DPR * Timeliness_DPR + (1 - THETA_DPR) * Quality_DPR);

  return Math.max(0, Math.min(100, DPR_KPI));
};

// 2. TECHNICAL COMPLIANCE IN PROJECTS
const calculateTechnicalComplianceKpi = async (employeeId, periodStart, periodEnd) => {
  // If period is null, use all historical data
  let sql;
  let params;
  if (periodStart === null || periodEnd === null) {
    sql = `
      SELECT pfvr.technical_compliance
      FROM project_field_visit_ratings pfvr
      JOIN field_visits fv ON fv.id = pfvr.field_visit_id
      WHERE pfvr.employee_id = $1
        AND pfvr.technical_compliance IS NOT NULL
        AND pfvr.technical_compliance > 0
        AND fv.visit_type = 'project'
        AND fv.status = 'completed'
      ORDER BY fv.visit_date ASC
    `;
    params = [employeeId];
    console.log(`[Technical Compliance KPI] Calculating for employee ${employeeId} using ALL historical data`);
  } else {
    sql = `
      SELECT pfvr.technical_compliance
      FROM project_field_visit_ratings pfvr
      JOIN field_visits fv ON fv.id = pfvr.field_visit_id
      WHERE pfvr.employee_id = $1
        AND pfvr.technical_compliance IS NOT NULL
        AND pfvr.technical_compliance > 0
        AND fv.visit_date >= $2::DATE
        AND fv.visit_date <= $3::DATE
        AND fv.visit_type = 'project'
        AND fv.status = 'completed'
      ORDER BY fv.visit_date ASC
    `;
    params = [employeeId, periodStart, periodEnd];
    console.log(`[Technical Compliance KPI] Calculating for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
  }
  const { rows } = await query(sql, params);

  if (rows.length === 0) {
    if (periodStart === null || periodEnd === null) {
      console.log(`[Technical Compliance KPI] No ratings found for employee ${employeeId} (all historical data)`);
    } else {
      console.log(`[Technical Compliance KPI] No ratings found for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
    }
    return 0;
  }

  const N_TC = rows.length;
  let sum = 0;
  for (const row of rows) {
    const TC_i = parseNumeric(row.technical_compliance, 0) / 10;
    sum += TC_i;
  }

  const Technical_Compliance_KPI = 100 * (sum / N_TC);
  
  console.log(`[Technical Compliance KPI] Employee ${employeeId}: N_TC=${N_TC}, sum=${sum}, KPI=${Technical_Compliance_KPI}`);
  
  return Math.max(0, Math.min(100, Technical_Compliance_KPI));
};

// 3. SURVEY ACCURACY KPI
const calculateSurveyKpi = async (employeeId, periodStart, periodEnd) => {
  // If period is null, use all historical data
  let sql;
  let params;
  if (periodStart === null || periodEnd === null) {
    sql = `
      SELECT 
        ss.id as submission_id,
        ss.area_covered,
        ss.time_taken,
        s.total_area as area_planned,
        s.expected_time,
        ss.survey_id
      FROM survey_submissions ss
      JOIN surveys s ON s.id = ss.survey_id
      WHERE ss.submitted_by = $1
        AND ss.approval_status = 'approved'
        AND ss.area_covered IS NOT NULL
        AND ss.area_covered != ''
        AND ss.time_taken IS NOT NULL
        AND ss.time_taken != ''
        AND s.total_area IS NOT NULL
        AND s.total_area != ''
        AND s.expected_time IS NOT NULL
        AND s.expected_time != ''
    `;
    params = [employeeId];
    console.log(`[Survey KPI] Calculating for employee ${employeeId} using ALL historical data`);
  } else {
    sql = `
      SELECT 
        ss.id as submission_id,
        ss.area_covered,
        ss.time_taken,
        s.total_area as area_planned,
        s.expected_time,
        ss.survey_id
      FROM survey_submissions ss
      JOIN surveys s ON s.id = ss.survey_id
      WHERE ss.submitted_by = $1
        AND ss.approval_status = 'approved'
        AND ss.area_covered IS NOT NULL
        AND ss.area_covered != ''
        AND ss.time_taken IS NOT NULL
        AND ss.time_taken != ''
        AND s.total_area IS NOT NULL
        AND s.total_area != ''
        AND s.expected_time IS NOT NULL
        AND s.expected_time != ''
        AND (
          (ss.submitted_at >= $2::TIMESTAMPTZ AND ss.submitted_at <= $3::TIMESTAMPTZ)
          OR
          (ss.reviewed_at IS NOT NULL AND ss.reviewed_at >= $2::TIMESTAMPTZ AND ss.reviewed_at <= $3::TIMESTAMPTZ)
        )
    `;
    params = [employeeId, periodStart, periodEnd];
    console.log(`[Survey KPI] Calculating for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
  }
  const { rows } = await query(sql, params);

  if (rows.length === 0) {
    if (periodStart === null || periodEnd === null) {
      console.log(`[Survey KPI] No approved survey submissions found for employee ${employeeId} (all historical data)`);
    } else {
      console.log(`[Survey KPI] No approved survey submissions found for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
    }
    return 0;
  }

  console.log(`[Survey KPI] Found ${rows.length} approved survey submissions for employee ${employeeId}`);

  let totalCoverage = 0;
  let totalSpeed = 0;
  let totalSupervisor = 0;
  let count = 0;

  const surveySupervisorScores = new Map();

  for (const submission of rows) {
    const AreaCovered = parseNumeric(submission.area_covered, 0);
    const AreaPlanned = parseNumeric(submission.area_planned, 0);
    const TimeTaken = parseNumeric(submission.time_taken, 1);
    const EstimatedTime = parseNumeric(submission.expected_time, 1);

    if (AreaPlanned <= 0 || EstimatedTime <= 0 || TimeTaken <= 0 || AreaCovered < 0) {
      console.log(`[Survey KPI] Skipping submission ${submission.submission_id}: invalid data`, {
        AreaCovered,
        AreaPlanned,
        TimeTaken,
        EstimatedTime
      });
      continue;
    }


    const numPeopleSql = `
      SELECT COUNT(*) as count
      FROM survey_members
      WHERE survey_id = $1
    `;
    const { rows: numPeopleRows } = await query(numPeopleSql, [submission.survey_id]);
    const NumPeople = Math.max(1, parseInt(numPeopleRows[0]?.count || 1));

    const AreaPerPerson = AreaPlanned / NumPeople;
  
    const Coverage = AreaPerPerson > 0 ? Math.min(1, AreaCovered / AreaPerPerson) : 0;

  
    const V_person = AreaCovered / TimeTaken;
   
    const V_plan = EstimatedTime > 0 ? AreaPerPerson / EstimatedTime : 0;
 
    const Speed = V_plan > 0 ? Math.min(UPPER_SPEED_LIMIT, V_person / V_plan) : 0;

   
    let SupervisorScore = 0;
    if (!surveySupervisorScores.has(submission.survey_id)) {
      const supervisorSql = `
        SELECT 
          AVG(sr.rating / 10.0) as avg_rating,
          COUNT(*) as rating_count,
          COUNT(DISTINCT sfv.id) as visit_count
        FROM supervisor_ratings sr
        JOIN survey_field_visits sfv ON sfv.id = sr.survey_field_visit_id
        WHERE sfv.survey_id = $1 AND sr.employee_id = $2
      `;
      const { rows: supervisorRows } = await query(supervisorSql, [submission.survey_id, employeeId]);
      const M = parseInt(supervisorRows[0]?.visit_count || 0);
      
      if (M > 0) {
      
        SupervisorScore = parseNumeric(supervisorRows[0]?.avg_rating, 0);
      } else {
        SupervisorScore = 0;
      }
      
      surveySupervisorScores.set(submission.survey_id, SupervisorScore);
      console.log(`[Survey KPI] Survey ${submission.survey_id} supervisor score: ${SupervisorScore} (from ${M} visits)`);
    } else {
      SupervisorScore = surveySupervisorScores.get(submission.survey_id);
    }

    console.log(`[Survey KPI] Submission ${submission.submission_id}:`, {
      AreaCovered,
      AreaPlanned,
      NumPeople,
      AreaPerPerson,
      Coverage,
      TimeTaken,
      EstimatedTime,
      V_person,
      V_plan,
      Speed,
      SupervisorScore
    });

    totalCoverage += Coverage;
    totalSpeed += Speed;
    totalSupervisor += SupervisorScore;
    count++;
  }

  if (count === 0) {
    console.log(`[Survey KPI] No valid submissions after filtering for employee ${employeeId}`);
    return 0;
  }

  const avgCoverage = totalCoverage / count;
  const avgSpeed = totalSpeed / count;
  const avgSupervisor = totalSupervisor / count;

  console.log(`[Survey KPI] Employee ${employeeId} averages:`, {
    avgCoverage,
    avgSpeed,
    avgSupervisor,
    count
  });

  const Survey_KPI = 100 * (
    LAMBDA_COVERAGE * avgCoverage +
    LAMBDA_SPEED * avgSpeed +
    LAMBDA_SUPERVISOR * avgSupervisor
  );

  const finalKpi = Math.max(0, Math.min(100, Survey_KPI));
  console.log(`[Survey KPI] Final KPI for employee ${employeeId}: ${finalKpi}`);

  return finalKpi;
};

// 4. EXPENDITURE VS FINANCIAL TARGETS
const calculateExpenditureKpi = async (employeeId, periodStart, periodEnd) => {
  console.log(`[Expenditure KPI] Starting calculation for employee ${employeeId}`, {
    periodStart,
    periodEnd,
    periodStartType: typeof periodStart,
    periodEndType: typeof periodEnd
  });

  // If period is null, use all historical data
  let sql;
  let params;
  if (periodStart === null || periodEnd === null) {
    sql = `
      SELECT DISTINCT ON (t.id)
        t.id as task_id,
        t.cost as planned_cost,
        ts.cost as actual_cost,
        ts.status as submission_status,
        ts.submitted_at,
        ts.reviewed_at
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.submitted_by = $1
        AND (ts.status = 'approved' OR ts.status = 'submitted')
        AND ts.cost IS NOT NULL
        AND ts.cost != ''
        AND t.cost IS NOT NULL
        AND t.cost != ''
      ORDER BY t.id, 
               CASE WHEN ts.status = 'approved' THEN 0 ELSE 1 END,
               ts.submitted_at DESC
    `;
    params = [employeeId];
    console.log(`[Expenditure KPI] Calculating for employee ${employeeId} using ALL historical data`);
  } else {
    sql = `
      SELECT DISTINCT ON (t.id)
        t.id as task_id,
        t.cost as planned_cost,
        ts.cost as actual_cost,
        ts.status as submission_status,
        ts.submitted_at,
        ts.reviewed_at
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.submitted_by = $1
        AND (ts.status = 'approved' OR ts.status = 'submitted')
        AND DATE(ts.submitted_at) >= $2::DATE
        AND DATE(ts.submitted_at) <= $3::DATE
        AND ts.cost IS NOT NULL
        AND ts.cost != ''
        AND t.cost IS NOT NULL
        AND t.cost != ''
      ORDER BY t.id, 
               CASE WHEN ts.status = 'approved' THEN 0 ELSE 1 END,
               ts.submitted_at DESC
    `;
    params = [employeeId, periodStart, periodEnd];
    console.log(`[Expenditure KPI] Calculating for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
  }
  
  console.log(`[Expenditure KPI] Executing query with params:`, {
    employeeId,
    periodStart,
    periodEnd,
    periodStartType: typeof periodStart,
    periodEndType: typeof periodEnd
  });
  
  const { rows } = await query(sql, params);

  console.log(`[Expenditure KPI] Query returned ${rows.length} rows`);
  if (rows.length > 0) {
    console.log(`[Expenditure KPI] Sample rows:`, rows.slice(0, 3).map(r => ({
      task_id: r.task_id,
      planned_cost: r.planned_cost,
      actual_cost: r.actual_cost,
      submission_status: r.submission_status,
      submitted_at: r.submitted_at,
      reviewed_at: r.reviewed_at
    })));
  }

  if (rows.length === 0) {
    // Debug: Check if there are any submissions (approved or submitted) at all for this employee
    const debugSql = `
      SELECT 
        ts.id as submission_id,
        ts.task_id,
        ts.status,
        ts.cost as submission_cost,
        ts.submitted_at,
        ts.reviewed_at,
        t.cost as task_cost,
        t.assigned_to
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.submitted_by = $1
        AND (ts.status = 'approved' OR ts.status = 'submitted')
      ORDER BY ts.submitted_at DESC
      LIMIT 10
    `;
    const { rows: debugRows } = await query(debugSql, [employeeId]);
    console.log(`[Expenditure KPI] Debug: Found ${debugRows.length} submissions (approved or submitted) for employee ${employeeId} (any period):`, 
      debugRows.map(r => ({
        submission_id: r.submission_id,
        task_id: r.task_id,
        status: r.status,
        submission_cost: r.submission_cost,
        task_cost: r.task_cost,
        submitted_at: r.submitted_at,
        reviewed_at: r.reviewed_at,
        has_costs: r.submission_cost && r.task_cost ? 'YES' : 'NO'
      }))
    );
    
    if (periodStart === null || periodEnd === null) {
      console.log(`[Expenditure KPI] No submissions with costs found for employee ${employeeId} (all historical data)`);
    } else {
      console.log(`[Expenditure KPI] No submissions with costs found for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
    }
    return 0;
  }

  // Get unique tasks (in case there are multiple approved submissions per task, use the latest one)
  // Planned cost (B_i) = task.cost (set when task is created by manager)
  // Actual cost (C_i) = submission.cost (set when employee submits)
  const taskMap = new Map();
  for (const row of rows) {
    if (!taskMap.has(row.task_id)) {
      const planned = parseNumeric(row.planned_cost, 0);
      const actual = parseNumeric(row.actual_cost, 0);
      console.log(`[Expenditure KPI] Task ${row.task_id}: planned=${row.planned_cost} (parsed=${planned}), actual=${row.actual_cost} (parsed=${actual})`);
      taskMap.set(row.task_id, {
        planned,
        actual
      });
    }
  }

  // Collect cost items (B_i = planned, C_i = actual)
  const costItems = Array.from(taskMap.values()).filter(item => item.planned > 0);

  console.log(`[Expenditure KPI] Processed ${taskMap.size} unique tasks, ${costItems.length} with valid planned costs > 0`);
  if (costItems.length > 0) {
    console.log(`[Expenditure KPI] Cost items:`, costItems.map((item, idx) => ({
      index: idx + 1,
      planned: item.planned,
      actual: item.actual,
      ratio: item.actual / item.planned
    })));
  }

  if (costItems.length === 0) {
    console.log(`[Expenditure KPI] No valid cost items found for employee ${employeeId}`);
    return 0;
  }

  // Calculate totals: PlannedCost_total = Σ B_i, ActualCost_total = Σ C_i
  const PlannedCost_total = costItems.reduce((sum, item) => sum + item.planned, 0);
  const ActualCost_total = costItems.reduce((sum, item) => sum + item.actual, 0);

  console.log(`[Expenditure KPI] Totals calculated:`, {
    PlannedCost_total,
    ActualCost_total,
    ratio: ActualCost_total / PlannedCost_total
  });

  if (PlannedCost_total === 0) {
    console.log(`[Expenditure KPI] PlannedCost_total is 0 for employee ${employeeId}`);
    return 0;
  }

  // 4A. Cost Efficiency
  // CostEfficiency = min(1, PlannedCost_total / ActualCost_total)
  const CostEfficiency = ActualCost_total > 0 ? Math.min(1, PlannedCost_total / ActualCost_total) : 0;
  console.log(`[Expenditure KPI] Cost Efficiency:`, {
    calculation: `min(1, ${PlannedCost_total} / ${ActualCost_total})`,
    result: CostEfficiency
  });

  // 4B. Overspend Penalty
  // Weight of each planned cost: ω_i = B_i / Σ B_i
  // Overspend for each cost item: O_i = max(0, (C_i / B_i) - 1)
  // Weighted overspend: O_total = Σ (ω_i * O_i)
  // Penalty = 1 - min(1, O_total / OMAX)
  let O_total = 0;
  console.log(`[Expenditure KPI] Calculating overspend penalty (OMAX = ${OMAX}):`);
  for (const item of costItems) {
    const omega_i = item.planned / PlannedCost_total;
    const O_i = Math.max(0, (item.actual / item.planned) - 1);
    const contribution = omega_i * O_i;
    O_total += contribution;
    console.log(`[Expenditure KPI]   Item: planned=${item.planned}, actual=${item.actual}, ω_i=${omega_i.toFixed(4)}, O_i=${O_i.toFixed(4)}, contribution=${contribution.toFixed(4)}`);
  }
  console.log(`[Expenditure KPI] O_total = ${O_total.toFixed(4)}`);

  const Penalty = OMAX > 0 ? 1 - Math.min(1, O_total / OMAX) : 1;
  console.log(`[Expenditure KPI] Penalty:`, {
    calculation: `1 - min(1, ${O_total.toFixed(4)} / ${OMAX})`,
    result: Penalty
  });

  // 4C. Final Expenditure KPI
  // Expenditure_KPI = 100 * (0.5 * CostEfficiency + 0.5 * Penalty)
  const Expenditure_KPI = 100 * (0.5 * CostEfficiency + 0.5 * Penalty);

  console.log(`[Expenditure KPI] Final calculation for employee ${employeeId}:`, {
    taskCount: costItems.length,
    PlannedCost_total,
    ActualCost_total,
    CostEfficiency,
    O_total: O_total.toFixed(4),
    Penalty,
    calculation: `100 * (0.5 * ${CostEfficiency.toFixed(4)} + 0.5 * ${Penalty.toFixed(4)})`,
    Expenditure_KPI: Expenditure_KPI.toFixed(2)
  });

  return Math.max(0, Math.min(100, Expenditure_KPI));
};

// 5. ADHERENCE TO TIMELINESS (TASK TIMELINESS)
const calculateTaskTimelinessKpi = async (employeeId, periodStart, periodEnd) => {
  console.log(`[Task Timeliness KPI] Starting calculation for employee ${employeeId}`, {
    periodStart,
    periodEnd
  });

  // Get all completed tasks for this employee
  // Use due_date as PlannedCompletion_i and completed_at as ActualCompletion_i
  // Both are timestamps, calculate delay in days
  // If period is null, use all historical data
  let sql;
  let params;
  if (periodStart === null || periodEnd === null) {
    sql = `
      SELECT 
        t.due_date as planned_completion,
        t.completed_at as actual_completion,
        t.planned_duration,
        t.id as task_id
      FROM tasks t
      WHERE t.assigned_to = $1
        AND t.completed_at IS NOT NULL
        AND t.due_date IS NOT NULL
        AND t.status = 'completed'
    `;
    params = [employeeId];
    console.log(`[Task Timeliness KPI] Calculating for employee ${employeeId} using ALL historical data`);
  } else {
    sql = `
      SELECT 
        t.due_date as planned_completion,
        t.completed_at as actual_completion,
        t.planned_duration,
        t.id as task_id
      FROM tasks t
      WHERE t.assigned_to = $1
        AND t.completed_at IS NOT NULL
        AND t.due_date IS NOT NULL
        AND t.completed_at >= $2::TIMESTAMPTZ
        AND t.completed_at <= $3::TIMESTAMPTZ
        AND t.status = 'completed'
    `;
    params = [employeeId, periodStart, periodEnd];
    console.log(`[Task Timeliness KPI] Calculating for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
  }
  const { rows } = await query(sql, params);

  console.log(`[Task Timeliness KPI] Found ${rows.length} completed tasks for employee ${employeeId}`);

  if (rows.length === 0) {
    if (periodStart === null || periodEnd === null) {
      console.log(`[Task Timeliness KPI] No completed tasks found for employee ${employeeId} (all historical data)`);
    } else {
      console.log(`[Task Timeliness KPI] No completed tasks found for employee ${employeeId} in period ${periodStart} to ${periodEnd}`);
    }
    console.log(`[Task Timeliness KPI] This is expected if no tasks were completed (tasks must be approved/completed to count)`);
    return 0;
  }
  
  console.log(`[Task Timeliness KPI] Found ${rows.length} completed tasks for employee ${employeeId}`);

  // Calculate total planned duration for weighting
  let totalPlannedDuration = 0;
  const taskData = [];

  for (const row of rows) {
    const PlannedCompletion_i = row.planned_completion; // due_date (timestamp)
    const ActualCompletion_i = row.actual_completion; // completed_at (timestamp)
    const PlannedDuration_i = parseNumeric(row.planned_duration, 1);

    if (PlannedDuration_i > 0 && PlannedCompletion_i && ActualCompletion_i) {
      totalPlannedDuration += PlannedDuration_i;
      taskData.push({
        taskId: row.task_id,
        plannedCompletion: PlannedCompletion_i,
        actualCompletion: ActualCompletion_i,
        plannedDuration: PlannedDuration_i
      });
    } else {
      console.log(`[Task Timeliness KPI] Skipping task ${row.task_id}:`, {
        hasPlannedCompletion: !!PlannedCompletion_i,
        hasActualCompletion: !!ActualCompletion_i,
        plannedDuration: PlannedDuration_i
      });
    }
  }

  if (totalPlannedDuration === 0 || taskData.length === 0) {
    console.log(`[Task Timeliness KPI] No valid tasks with planned duration for employee ${employeeId}`);
    return 0;
  }

  console.log(`[Task Timeliness KPI] Processing ${taskData.length} tasks, total planned duration: ${totalPlannedDuration}`);

  // 5A. Calculate delay_i = max(0, ActualCompletion_i - PlannedCompletion_i) for each task
  // 5B. Calculate T_i = 1 - min(1, delay_i / DMAX_TASK) for each task
  // 5B. Weight by expected duration: ω_i = PlannedDuration_i / Σ PlannedDuration_i
  // 5C. Final Timeliness KPI: Task_Timeliness_KPI = 100 * Σ (ω_i * T_i)
  let weightedSum = 0;
  for (const task of taskData) {
    // Calculate delay_i in days (timestamp difference)
    // delay_i = max(0, ActualCompletion_i - PlannedCompletion_i)
    const delay_i = Math.max(0, daysDifference(task.plannedCompletion, task.actualCompletion));
    
    // Calculate T_i = 1 - min(1, delay_i / DMAX_TASK)
    const T_i = 1 - Math.min(1, delay_i / DMAX_TASK);
    
    // Calculate weight: ω_i = PlannedDuration_i / Σ PlannedDuration_i
    const omega_i = task.plannedDuration / totalPlannedDuration;
    
    // Contribution to weighted sum: ω_i * T_i
    const contribution = omega_i * T_i;
    weightedSum += contribution;
    
    console.log(`[Task Timeliness KPI] Task ${task.taskId}:`, {
      plannedCompletion: task.plannedCompletion,
      actualCompletion: task.actualCompletion,
      delay_i: delay_i.toFixed(2),
      T_i: T_i.toFixed(4),
      plannedDuration: task.plannedDuration,
      omega_i: omega_i.toFixed(4),
      contribution: contribution.toFixed(4)
    });
  }

  // 5C. Final Timeliness KPI
  const Task_Timeliness_KPI = 100 * weightedSum;

  console.log(`[Task Timeliness KPI] Final calculation for employee ${employeeId}:`, {
    taskCount: taskData.length,
    totalPlannedDuration,
    weightedSum: weightedSum.toFixed(4),
    Task_Timeliness_KPI: Task_Timeliness_KPI.toFixed(2)
  });

  return Math.max(0, Math.min(100, Task_Timeliness_KPI));
};

// Main function to compute all Field Employee KPIs
const computeFieldEmployeeKpis = async (employeeId, periodStartInput, periodEndInput, { persist = true } = {}) => {
  console.log(`[KPI Service] computeFieldEmployeeKpis called for employee ${employeeId}`, {
    periodStartInput,
    periodEndInput,
    persist
  });
  
  // If no period specified, use ALL historical data for calculation
  // But still use current month for snapshot storage
  const useAllHistoricalData = periodStartInput === null && periodEndInput === null;
  
  let period;
  let dateStart, dateEnd, tsStart, tsEnd;
  
  if (useAllHistoricalData) {
    // For storage, use current month period
    period = ensurePeriod(null, null);
    dateStart = period.dateStart;
    dateEnd = period.dateEnd;
    // For calculation, pass null to use all data
    tsStart = null;
    tsEnd = null;
    console.log(`[KPI Service] Using ALL historical data for calculation, but storing snapshot for period:`, {
      dateStart,
      dateEnd
    });
  } else {
    // Use specified period for both calculation and storage
    period = ensurePeriod(periodStartInput, periodEndInput);
    dateStart = period.dateStart;
    dateEnd = period.dateEnd;
    tsStart = period.tsStart;
    tsEnd = period.tsEnd;
    console.log(`[KPI Service] Period calculated:`, {
      dateStart,
      dateEnd,
      tsStart,
      tsEnd
    });
  }

  
  console.log(`[KPI Service] Step 1: Calculating DPR KPI for employee ${employeeId}...`);
  const dprKpi = await calculateDprKpi(employeeId, tsStart, tsEnd);
  console.log(`[KPI Service] DPR KPI result: ${dprKpi}`);
  
  console.log(`[KPI Service] Step 2: Calculating Technical Compliance KPI for employee ${employeeId}...`);
 
  const technicalComplianceKpi = await calculateTechnicalComplianceKpi(employeeId, useAllHistoricalData ? null : dateStart, useAllHistoricalData ? null : dateEnd);
  console.log(`[KPI Service] Technical Compliance KPI result: ${technicalComplianceKpi}`);
  
  console.log(`[KPI Service] Step 3: Calculating Survey KPI for employee ${employeeId}...`);
  const surveyKpi = await calculateSurveyKpi(employeeId, tsStart, tsEnd);
  console.log(`[KPI Service] Survey KPI result: ${surveyKpi}`);
  
  console.log(`[KPI Service] Step 4: Calculating Expenditure KPI for employee ${employeeId}...`);

  const expenditureKpi = await calculateExpenditureKpi(employeeId, useAllHistoricalData ? null : dateStart, useAllHistoricalData ? null : dateEnd);
  console.log(`[KPI Service] Expenditure KPI result: ${expenditureKpi}`);
  
  console.log(`[KPI Service] Step 5: Calculating Task Timeliness KPI for employee ${employeeId}...`);
  const taskTimelinessKpi = await calculateTaskTimelinessKpi(employeeId, tsStart, tsEnd);
  console.log(`[KPI Service] Task Timeliness KPI result: ${taskTimelinessKpi}`);


  const safeValue = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 0;
    return Math.max(0, Math.min(100, val));
  };

  const safeDprKpi = safeValue(dprKpi);
  const safeTechnicalKpi = safeValue(technicalComplianceKpi);
  const safeSurveyKpi = safeValue(surveyKpi);
  const safeExpenditureKpi = safeValue(expenditureKpi);
  const safeTaskTimelinessKpi = safeValue(taskTimelinessKpi);

  
  const weights = {
    dpr: 0.2,
    technical: 0.2,
    survey: 0.2,
    expenditure: 0.2,
    timeliness: 0.2
  };

  const finalKpi = (
    weights.dpr * safeDprKpi +
    weights.technical * safeTechnicalKpi +
    weights.survey * safeSurveyKpi +
    weights.expenditure * safeExpenditureKpi +
    weights.timeliness * safeTaskTimelinessKpi
  );

  const safeRound = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
  };

  const metrics = {
    dprKpi: safeRound(safeDprKpi),
    technicalComplianceKpi: safeRound(safeTechnicalKpi),
    surveyKpi: safeRound(safeSurveyKpi),
    expenditureKpi: safeRound(safeExpenditureKpi),
    taskTimelinessKpi: safeRound(safeTaskTimelinessKpi),
    finalKpi: safeRound(finalKpi),
    periodStart: dateStart,
    periodEnd: dateEnd
  };

  console.log(`[KPI Service] Step 6: Final metrics calculated for employee ${employeeId}:`, metrics);

  if (persist) {
    console.log(`[KPI Service] Step 7: Persisting KPI to database for employee ${employeeId}...`);
    console.log(`[KPI Service] Note: If new metrics are all zeros, existing valid snapshot will be preserved`);
    const snapshot = await upsertFieldEmployeeSnapshot(employeeId, dateStart, dateEnd, metrics);
    
    // Check if snapshot was preserved (not updated)
    const wasPreserved = snapshot && parseFloat(snapshot.final_kpi || 0) > 0 && 
                        metrics.finalKpi === 0 && 
                        parseFloat(snapshot.final_kpi || 0) !== metrics.finalKpi;
    
    if (wasPreserved) {
      console.log(`[KPI Service] Step 8: Existing snapshot preserved for employee ${employeeId} (old KPIs maintained)`);
      console.log(`[KPI Service] Frontend will continue displaying old KPIs until valid recalculation completes`);
    } else {
      console.log(`[KPI Service] Step 8: KPI persisted/updated successfully for employee ${employeeId}`);
    }
  } else {
    console.log(`[KPI Service] Step 7: Skipping persistence (persist=false) for employee ${employeeId}`);
  }

  await auditService.logAction(employeeId, 'FIELD_EMPLOYEE_KPI_COMPUTED', 'field_employee_kpi_snapshots', employeeId, {
    periodStart: dateStart,
    periodEnd: dateEnd,
    finalKpi: metrics.finalKpi,
  });

  // Trigger promotion score recalculation when KPI changes (async, don't wait)
  // When individual KPI changes:
  // 1. Employee's overall_kpi changes
  // 2. Team KPI changes, affecting all employees' team_contribution
  // 3. Normalization changes for all employees
  // So we MUST recalculate all promotion scores
  // NOTE: This is async and non-blocking - frontend will continue showing old KPIs until recalculation completes
  if (persist) {
    console.log(`[Promotion Score Trigger] ========================================`);
    console.log(`[Promotion Score Trigger] KPI CHANGED - Triggering Promotion Score Recalculation (async)`);
    console.log(`[Promotion Score Trigger] Employee ID: ${employeeId}`);
    console.log(`[Promotion Score Trigger] Final KPI: ${metrics.finalKpi.toFixed(2)}`);
    console.log(`[Promotion Score Trigger] Period: ${dateStart} to ${dateEnd}`);
    console.log(`[Promotion Score Trigger] KPI Components:`, {
      dprKpi: metrics.dprKpi.toFixed(2),
      technicalComplianceKpi: metrics.technicalComplianceKpi.toFixed(2),
      surveyKpi: metrics.surveyKpi.toFixed(2),
      expenditureKpi: metrics.expenditureKpi.toFixed(2),
      taskTimelinessKpi: metrics.taskTimelinessKpi.toFixed(2)
    });
    console.log(`[Promotion Score Trigger] Team KPI will change, affecting all employees' team_contribution`);
    console.log(`[Promotion Score Trigger] Normalization will change for all employees`);
    console.log(`[Promotion Score Trigger] Recalculating all promotion scores (async, non-blocking)...`);
    console.log(`[Promotion Score Trigger] Frontend will continue showing old KPIs until recalculation completes`);
    console.log(`[Promotion Score Trigger] ========================================`);
    
    const promotionScoreService = require('./promotionScoreService');
    
    // Recalculate all promotion scores since KPI changes affect normalization for all employees
    // This is async and non-blocking - the API response is already sent
    promotionScoreService.calculateAndStorePromotionScores()
      .then(results => {
        console.log(`[Promotion Score Trigger] ✅ Successfully recalculated promotion scores for all ${results.length} employees after KPI change`);
        console.log(`[Promotion Score Trigger] Frontend can now fetch updated KPIs`);
        console.log(`[Promotion Score Trigger] ========================================`);
      })
      .catch(err => {
        console.error(`[Promotion Score Trigger] ❌ Error recalculating all promotion scores after KPI change:`, err);
        console.error(`[Promotion Score Trigger] Error stack:`, err.stack);
        console.log(`[Promotion Score Trigger] ========================================`);
      });
  }

  console.log(`[KPI Service] computeFieldEmployeeKpis completed for employee ${employeeId}`);
  return metrics;
};


const upsertFieldEmployeeSnapshot = async (employeeId, periodStart, periodEnd, metrics) => {
  console.log(`[KPI Service] upsertFieldEmployeeSnapshot called for employee ${employeeId}`, {
    periodStart,
    periodEnd,
    metrics
  });
  
  // Always check for existing snapshot first to preserve old values during recalculation
  // Check for exact period match first, then most recent snapshot
  const existingSql = `
    SELECT 
      id, user_id, period_start, period_end,
      dpr_kpi, technical_compliance_kpi, survey_kpi,
      expenditure_kpi, task_timeliness_kpi, final_kpi,
      created_at, updated_at
    FROM field_employee_kpi_snapshots
    WHERE user_id = $1
      AND period_start = $2
      AND period_end = $3
  `;
  const { rows: existingRows } = await query(existingSql, [employeeId, periodStart, periodEnd]);
  
  // If no exact match, get most recent snapshot to preserve individual KPI values
  let existingSnapshot = existingRows.length > 0 ? existingRows[0] : null;
  if (!existingSnapshot) {
    const recentSql = `
      SELECT 
        id, user_id, period_start, period_end,
        dpr_kpi, technical_compliance_kpi, survey_kpi,
        expenditure_kpi, task_timeliness_kpi, final_kpi,
        created_at, updated_at
      FROM field_employee_kpi_snapshots
      WHERE user_id = $1
      ORDER BY period_end DESC, updated_at DESC
      LIMIT 1
    `;
    const { rows: recentRows } = await query(recentSql, [employeeId]);
    existingSnapshot = recentRows.length > 0 ? recentRows[0] : null;
  }
  
  // Get the last valid value for each KPI from all historical snapshots
  // This ensures we preserve values even if the most recent snapshot has zeros
  // Use the MOST RECENT non-zero value for each KPI (not just MAX)
  const historicalSql = `
    SELECT 
      (SELECT dpr_kpi FROM field_employee_kpi_snapshots 
       WHERE user_id = $1 AND dpr_kpi > 0 
       ORDER BY period_end DESC, updated_at DESC LIMIT 1) as last_valid_dpr_kpi,
      (SELECT technical_compliance_kpi FROM field_employee_kpi_snapshots 
       WHERE user_id = $1 AND technical_compliance_kpi > 0 
       ORDER BY period_end DESC, updated_at DESC LIMIT 1) as last_valid_technical_compliance_kpi,
      (SELECT task_timeliness_kpi FROM field_employee_kpi_snapshots 
       WHERE user_id = $1 AND task_timeliness_kpi > 0 
       ORDER BY period_end DESC, updated_at DESC LIMIT 1) as last_valid_task_timeliness_kpi
  `;
  const { rows: historicalRows } = await query(historicalSql, [employeeId]);
  const lastValidValues = historicalRows.length > 0 ? historicalRows[0] : null;
  
  if (lastValidValues) {
    console.log(`[KPI Service] Found last valid historical values:`, {
      dprKpi: lastValidValues.last_valid_dpr_kpi,
      technicalComplianceKpi: lastValidValues.last_valid_technical_compliance_kpi,
      taskTimelinessKpi: lastValidValues.last_valid_task_timeliness_kpi
    });
  }
  
  // Smart merge: preserve existing KPI values if new calculation returns zero
  // This prevents overwriting valid historical data with zeros
  // CRITICAL: Always check historical values first, even if no existing snapshot
  let mergedMetrics = { ...metrics };
  let hasMerged = false;
  
  console.log(`[KPI Service] Checking for values to preserve for employee ${employeeId}`);
  if (existingSnapshot) {
    console.log(`[KPI Service] Existing snapshot values:`, {
      dprKpi: existingSnapshot.dpr_kpi,
      technicalComplianceKpi: existingSnapshot.technical_compliance_kpi,
      surveyKpi: existingSnapshot.survey_kpi,
      expenditureKpi: existingSnapshot.expenditure_kpi,
      taskTimelinessKpi: existingSnapshot.task_timeliness_kpi,
      finalKpi: existingSnapshot.final_kpi
    });
  }
  console.log(`[KPI Service] New calculation values:`, {
    dprKpi: metrics.dprKpi,
    technicalComplianceKpi: metrics.technicalComplianceKpi,
    surveyKpi: metrics.surveyKpi,
    expenditureKpi: metrics.expenditureKpi,
    taskTimelinessKpi: metrics.taskTimelinessKpi,
    finalKpi: metrics.finalKpi
  });
  
  // For each KPI, if new value is 0 but historical value exists, preserve historical value
  // Exception: Survey KPI should always be recalculated (only depends on surveys)
  // Exception: Expenditure KPI should always be recalculated (depends on task submissions)
  
  // DPR KPI: Preserve if new calculation is 0 and historical value exists
  const existingDpr = lastValidValues?.last_valid_dpr_kpi 
    ? parseFloat(lastValidValues.last_valid_dpr_kpi) 
    : (existingSnapshot ? parseFloat(existingSnapshot.dpr_kpi || 0) : 0);
  if (metrics.dprKpi === 0 && existingDpr > 0) {
    mergedMetrics.dprKpi = existingDpr;
    hasMerged = true;
    console.log(`[KPI Service] ✅ Preserving DPR KPI: ${mergedMetrics.dprKpi} (was 0 in new calculation, using historical value ${existingDpr})`);
  }
  
  // Technical Compliance KPI: Preserve if new calculation is 0 and historical value exists
  const existingTechnical = lastValidValues?.last_valid_technical_compliance_kpi 
    ? parseFloat(lastValidValues.last_valid_technical_compliance_kpi) 
    : (existingSnapshot ? parseFloat(existingSnapshot.technical_compliance_kpi || 0) : 0);
  if (metrics.technicalComplianceKpi === 0 && existingTechnical > 0) {
    mergedMetrics.technicalComplianceKpi = existingTechnical;
    hasMerged = true;
    console.log(`[KPI Service] ✅ Preserving Technical Compliance KPI: ${mergedMetrics.technicalComplianceKpi} (was 0 in new calculation, using historical value ${existingTechnical})`);
  }
  
  // Survey KPI: always use new value (only depends on surveys)
  // But if new value is 0 and existing is > 0, log it for debugging
  const existingSurvey = existingSnapshot ? parseFloat(existingSnapshot.survey_kpi || 0) : 0;
  if (metrics.surveyKpi === 0 && existingSurvey > 0) {
    console.log(`[KPI Service] ⚠️  Survey KPI is 0 in new calculation but existing had ${existingSurvey}. Survey KPI is always recalculated, so this may indicate no approved surveys in period.`);
  }
  
  // Expenditure KPI: always use new value (depends on task submissions)
  // But if new value is 0 and existing is > 0, log it for debugging
  const existingExpenditure = existingSnapshot ? parseFloat(existingSnapshot.expenditure_kpi || 0) : 0;
  if (metrics.expenditureKpi === 0 && existingExpenditure > 0) {
    console.log(`[KPI Service] ⚠️  Expenditure KPI is 0 in new calculation but existing had ${existingExpenditure}. Expenditure KPI is always recalculated, so this may indicate no task submissions with costs in period.`);
  }
  
  // Task Timeliness KPI: Preserve if new calculation is 0 and historical value exists
  const existingTimeliness = lastValidValues?.last_valid_task_timeliness_kpi 
    ? parseFloat(lastValidValues.last_valid_task_timeliness_kpi) 
    : (existingSnapshot ? parseFloat(existingSnapshot.task_timeliness_kpi || 0) : 0);
  if (metrics.taskTimelinessKpi === 0 && existingTimeliness > 0) {
    mergedMetrics.taskTimelinessKpi = existingTimeliness;
    hasMerged = true;
    console.log(`[KPI Service] ✅ Preserving Task Timeliness KPI: ${mergedMetrics.taskTimelinessKpi} (was 0 in new calculation, using historical value ${existingTimeliness})`);
  }
  
  if (hasMerged) {
    // Recalculate final KPI with merged values
    const weights = {
      dpr: 0.2,
      technical: 0.2,
      survey: 0.2,
      expenditure: 0.2,
      timeliness: 0.2
    };
    
    mergedMetrics.finalKpi = Math.round((
      weights.dpr * mergedMetrics.dprKpi +
      weights.technical * mergedMetrics.technicalComplianceKpi +
      weights.survey * mergedMetrics.surveyKpi +
      weights.expenditure * mergedMetrics.expenditureKpi +
      weights.timeliness * mergedMetrics.taskTimelinessKpi
    ) * 100) / 100;
    
    console.log(`[KPI Service] ✅ Merged metrics for employee ${employeeId}:`, {
      dprKpi: mergedMetrics.dprKpi,
      technicalComplianceKpi: mergedMetrics.technicalComplianceKpi,
      surveyKpi: mergedMetrics.surveyKpi,
      expenditureKpi: mergedMetrics.expenditureKpi,
      taskTimelinessKpi: mergedMetrics.taskTimelinessKpi,
      finalKpi: mergedMetrics.finalKpi
    });
  } else {
    console.log(`[KPI Service] No values needed to be preserved (no zeros in new calc or no valid historical values)`);
  }
  
  // Use merged metrics for update
  metrics = mergedMetrics;
  
  const sql = `
    INSERT INTO field_employee_kpi_snapshots (
      user_id, period_start, period_end,
      dpr_kpi, technical_compliance_kpi, survey_kpi,
      expenditure_kpi, task_timeliness_kpi, final_kpi
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id, period_start, period_end)
    DO UPDATE SET
      dpr_kpi = EXCLUDED.dpr_kpi,
      technical_compliance_kpi = EXCLUDED.technical_compliance_kpi,
      survey_kpi = EXCLUDED.survey_kpi,
      expenditure_kpi = EXCLUDED.expenditure_kpi,
      task_timeliness_kpi = EXCLUDED.task_timeliness_kpi,
      final_kpi = EXCLUDED.final_kpi,
      updated_at = NOW()
    RETURNING *
  `;
  const { rows } = await query(sql, [
    employeeId,
    periodStart,
    periodEnd,
    metrics.dprKpi,
    metrics.technicalComplianceKpi,
    metrics.surveyKpi,
    metrics.expenditureKpi,
    metrics.taskTimelinessKpi,
    metrics.finalKpi,
  ]);
  
  console.log(`[KPI Service] KPI snapshot upserted for employee ${employeeId}:`, {
    id: rows[0]?.id,
    periodStart: rows[0]?.period_start,
    periodEnd: rows[0]?.period_end,
    surveyKpi: rows[0]?.survey_kpi,
    finalKpi: rows[0]?.final_kpi
  });
  
  // NOTE: Promotion score recalculation is already triggered in computeFieldEmployeeKpis
  // to avoid duplicate triggers. This function only upserts the snapshot.
  return rows[0];
};


const getFieldEmployeeKpiHistory = async (employeeId) => {
  console.log(`[KPI Service] getFieldEmployeeKpiHistory called for employee ${employeeId}`);
  const { rows } = await query(
    `
      SELECT 
        period_start, period_end,
        dpr_kpi as "dprKpi",
        technical_compliance_kpi as "technicalComplianceKpi",
        survey_kpi as "surveyKpi",
        expenditure_kpi as "expenditureKpi",
        task_timeliness_kpi as "taskTimelinessKpi",
        final_kpi as "finalKpi",
        created_at
      FROM field_employee_kpi_snapshots
      WHERE user_id = $1
      ORDER BY period_end DESC
      LIMIT 12
    `,
    [employeeId],
  );
  console.log(`[KPI Service] Found ${rows.length} history records for employee ${employeeId}`);
  return rows;
};


const getFieldEmployeeKpi = async (employeeId, periodStartInput, periodEndInput) => {
  console.log(`[KPI Service] getFieldEmployeeKpi called for employee ${employeeId}`, {
    periodStartInput,
    periodEndInput
  });
  

  if (periodStartInput && periodEndInput) {
    const period = ensurePeriod(periodStartInput, periodEndInput);
    const { dateStart, dateEnd } = period;
    
    console.log(`[KPI Service] Searching for exact period match:`, { dateStart, dateEnd });
    
    const { rows } = await query(
      `
        SELECT 
          period_start, period_end,
          dpr_kpi as "dprKpi",
          technical_compliance_kpi as "technicalComplianceKpi",
          survey_kpi as "surveyKpi",
          expenditure_kpi as "expenditureKpi",
          task_timeliness_kpi as "taskTimelinessKpi",
          final_kpi as "finalKpi"
        FROM field_employee_kpi_snapshots
        WHERE user_id = $1
          AND period_start = $2
          AND period_end = $3
        ORDER BY period_end DESC
        LIMIT 1
      `,
      [employeeId, dateStart, dateEnd],
    );
    
    if (rows[0]) {
      console.log(`[KPI Service] Found exact period match in DB for employee ${employeeId}:`, {
        periodStart: rows[0].period_start,
        periodEnd: rows[0].period_end,
        surveyKpi: rows[0].surveyKpi,
        finalKpi: rows[0].finalKpi
      });
      return rows[0];
    } else {
      console.log(`[KPI Service] No exact period match found for employee ${employeeId}, trying most recent...`);
    }
  }
  
  console.log(`[KPI Service] Fetching most recent KPI snapshot for employee ${employeeId}...`);
  const { rows } = await query(
    `
      SELECT 
        period_start, period_end,
        dpr_kpi as "dprKpi",
        technical_compliance_kpi as "technicalComplianceKpi",
        survey_kpi as "surveyKpi",
        expenditure_kpi as "expenditureKpi",
        task_timeliness_kpi as "taskTimelinessKpi",
        final_kpi as "finalKpi"
      FROM field_employee_kpi_snapshots
      WHERE user_id = $1
      ORDER BY period_end DESC, updated_at DESC
      LIMIT 1
    `,
    [employeeId],
  );
  
  if (rows[0]) {
    console.log(`[KPI Service] Found most recent KPI in DB for employee ${employeeId}:`, {
      periodStart: rows[0].period_start,
      periodEnd: rows[0].period_end,
      surveyKpi: rows[0].surveyKpi,
      finalKpi: rows[0].finalKpi
    });
  } else {
    console.log(`[KPI Service] No KPI found in DB for employee ${employeeId}`);
  }
  
  return rows[0] || null;
};


const DEADLINE_KPI_RECALCULATION_DAYS = 15; // Recalculate KPI 15 days after task deadline


const checkOverdueTasksAndRecalculateKpi = async () => {
  console.log(`[Task Timeliness KPI] Checking for tasks ${DEADLINE_KPI_RECALCULATION_DAYS} days past deadline...`);
  
  
  const deadlineThreshold = new Date();
  deadlineThreshold.setDate(deadlineThreshold.getDate() - DEADLINE_KPI_RECALCULATION_DAYS);
  
  deadlineThreshold.setHours(0, 0, 0, 0);
  
  
  const sql = `
    SELECT DISTINCT 
      t.assigned_to as employee_id,
      COUNT(*) as overdue_task_count
    FROM tasks t
    WHERE t.assigned_to IS NOT NULL
      AND t.due_date IS NOT NULL
      AND t.due_date <= $1::DATE
      AND t.status != 'completed'
      AND t.status != 'rejected'
    GROUP BY t.assigned_to
  `;
  
  const { rows } = await query(sql, [deadlineThreshold.toISOString().split('T')[0]]);
  
  if (rows.length === 0) {
    console.log(`[Task Timeliness KPI] No overdue tasks found (${DEADLINE_KPI_RECALCULATION_DAYS} days past deadline)`);
    return {
      employeesChecked: 0,
      totalOverdueTasks: 0
    };
  }
  
  console.log(`[Task Timeliness KPI] Found ${rows.length} employees with tasks ${DEADLINE_KPI_RECALCULATION_DAYS} days past deadline`);
  
  // Recalculate KPI for each affected employee
  const results = [];
  for (const row of rows) {
    const employeeId = row.employee_id;
    const overdueTaskCount = parseInt(row.overdue_task_count);
    
    console.log(`[Task Timeliness KPI] Recalculating KPI for employee ${employeeId} (${overdueTaskCount} overdue tasks)`);
    
    try {
      const result = await computeFieldEmployeeKpis(
        employeeId,
        null,
        null,
        { persist: true }
      );
      console.log(`[Task Timeliness KPI]  Successfully recalculated KPI for employee ${employeeId} due to overdue tasks:`, {
        taskTimelinessKpi: result.taskTimelinessKpi?.toFixed(2),
        finalKpi: result.finalKpi?.toFixed(2)
      });
      results.push({ employeeId, success: true, overdueTaskCount });
    } catch (err) {
      console.error(`[Task Timeliness KPI]  Error recalculating KPI for employee ${employeeId} due to overdue tasks:`, err);
      results.push({ employeeId, success: false, overdueTaskCount, error: err.message });
    }
  }
  
  return {
    employeesChecked: rows.length,
    totalOverdueTasks: rows.reduce((sum, row) => sum + parseInt(row.overdue_task_count), 0),
    results
  };
};

const checkIgnoredTasksAndRecalculateKpi = async () => {
  console.log(`[KPI Service] Checking for ignored tasks (threshold: ${TASK_IGNORE_DAYS} days)...`);
  
  const ignoreThreshold = new Date();
  ignoreThreshold.setDate(ignoreThreshold.getDate() - TASK_IGNORE_DAYS);
  
  const sql = `
    SELECT DISTINCT t.assigned_to as employee_id
    FROM tasks t
    WHERE t.assigned_to IS NOT NULL
      AND t.status IN ('pending', 'in-progress', 'awaiting-review')
      AND (
        t.updated_at IS NULL 
        OR t.updated_at < $1::TIMESTAMPTZ
      )
      AND t.due_date IS NOT NULL
  `;
  
  const { rows } = await query(sql, [ignoreThreshold]);
  
  if (rows.length === 0) {
    console.log(`[KPI Service] No ignored tasks found (threshold: ${TASK_IGNORE_DAYS} days)`);
    return;
  }
  
  const employeeIds = [...new Set(rows.map(r => r.employee_id))];
  console.log(`[KPI Service] Found ${employeeIds.length} employees with ignored tasks. Recalculating KPIs...`);
  

  for (const employeeId of employeeIds) {
    computeFieldEmployeeKpis(employeeId, null, null, { persist: true })
      .then(result => {
        console.log(`[KPI Service] Recalculated KPI for employee ${employeeId} due to ignored tasks:`, {
          taskTimelinessKpi: result.taskTimelinessKpi?.toFixed(2),
          finalKpi: result.finalKpi?.toFixed(2)
        });
      })
      .catch(err => {
        console.error(`[KPI Service]  Error recalculating KPI for employee ${employeeId} due to ignored tasks:`, err);
      });
  }
};

const getFieldEmployeeDailyKpiHistory = async (employeeId, limit = 30) => {
  console.log(`[Daily KPI Service] getFieldEmployeeDailyKpiHistory called for employee ${employeeId}`);
  const { rows } = await query(
    `
      SELECT 
        day,
        timeliness_quality_dpr as "timelinessQualityDpr",
        technical_compliance_projects as "technicalComplianceProjects",
        survey_accuracy as "surveyAccuracy",
        expenditure_vs_targets as "expenditureVsTargets",
        task_timeliness as "taskTimeliness",
        overall_kpi as "overallKpi",
        created_at
      FROM field_employee_daily_kpi
      WHERE user_id = $1
      ORDER BY day DESC
      LIMIT $2
    `,
    [employeeId, limit],
  );
  console.log(`[Daily KPI Service] Found ${rows.length} daily KPI records for employee ${employeeId}`);
  return rows.reverse(); 
};


const computeAndStoreDailyKpi = async (employeeId, targetDate) => {
  console.log(`[Daily KPI Service] computeAndStoreDailyKpi called for employee ${employeeId}, date: ${targetDate}`);
  

  const dayStart = new Date(targetDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setUTCHours(23, 59, 59, 999);
  
  const dayStartStr = dayStart.toISOString().slice(0, 10); // YYYY-MM-DD
  const dayEndStr = dayEnd.toISOString().slice(0, 10);
  

  const kpi = await computeFieldEmployeeKpis(
    employeeId,
    dayStartStr,
    dayEndStr,
    { persist: false } 
  );
  
  
  const sql = `
    INSERT INTO field_employee_daily_kpi (
      day, user_id,
      timeliness_quality_dpr,
      technical_compliance_projects,
      survey_accuracy,
      expenditure_vs_targets,
      task_timeliness,
      overall_kpi
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (day, user_id)
    DO UPDATE SET
      timeliness_quality_dpr = EXCLUDED.timeliness_quality_dpr,
      technical_compliance_projects = EXCLUDED.technical_compliance_projects,
      survey_accuracy = EXCLUDED.survey_accuracy,
      expenditure_vs_targets = EXCLUDED.expenditure_vs_targets,
      task_timeliness = EXCLUDED.task_timeliness,
      overall_kpi = EXCLUDED.overall_kpi,
      updated_at = NOW()
    RETURNING *
  `;
  
  const { rows } = await query(sql, [
    dayStartStr,
    employeeId,
    kpi.dprKpi,
    kpi.technicalComplianceKpi,
    kpi.surveyKpi,
    kpi.expenditureKpi,
    kpi.taskTimelinessKpi,
    kpi.finalKpi,
  ]);
  
  console.log(`[Daily KPI Service] Daily KPI stored for employee ${employeeId}, date: ${targetDate}`);
  return rows[0];
};

// Record daily KPIs for all field employees (to be called at end of day)
const recordDailyKpisForAllEmployees = async (targetDate = null) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  // Use yesterday's date if no target date provided (since we're recording at end of day)
  if (!targetDate) {
    date.setDate(date.getDate() - 1);
  }
  const dateStr = date.toISOString().slice(0, 10);
  
  console.log(`[Daily KPI Service] Recording daily KPIs for all field employees, date: ${dateStr}`);
  

  const { rows: employees } = await query(
    `SELECT id FROM users WHERE role = 'FIELD_EMPLOYEE'`
  );
  
  console.log(`[Daily KPI Service] Found ${employees.length} field employees`);
  
  const results = [];
  for (const employee of employees) {
    try {
      const result = await computeAndStoreDailyKpi(employee.id, dateStr);
      results.push({ employeeId: employee.id, success: true, result });
    } catch (error) {
      console.error(`[Daily KPI Service] Error recording daily KPI for employee ${employee.id}:`, error);
      results.push({ employeeId: employee.id, success: false, error: error.message });
    }
  }
  
  console.log(`[Daily KPI Service] Completed recording daily KPIs. Success: ${results.filter(r => r.success).length}/${results.length}`);
  return results;
};

module.exports = {
  computeFieldEmployeeKpis,
  getFieldEmployeeKpi,
  getFieldEmployeeKpiHistory,
  getFieldEmployeeDailyKpiHistory,
  computeAndStoreDailyKpi,
  recordDailyKpisForAllEmployees,
  calculateDprKpi,
  calculateTechnicalComplianceKpi,
  calculateSurveyKpi,
  calculateExpenditureKpi,
  calculateTaskTimelinessKpi,
  checkIgnoredTasksAndRecalculateKpi,
  checkOverdueTasksAndRecalculateKpi,
  TASK_IGNORE_DAYS,
  DEADLINE_KPI_RECALCULATION_DAYS,
};

