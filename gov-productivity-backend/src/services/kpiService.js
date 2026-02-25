const { query } = require('../config/database');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

const KPI_PARAMS = {
  lambda: 0.5,
  omega: 0.7,
  T_ref_hours: 48,
  T_target_hours: 3,
  g_star: 1.0,
  k_star: 1.0,
  alpha: 0.6,
  beta: 0.4,
  D_max: 1.0,
  kappa: 0.2,
};

const clamp = (value) => Math.max(0, Math.min(100, value));
const toNumber = (value, fallback = 0) => (value === null || value === undefined ? fallback : Number(value));

const hoursBetween = (start, end) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  return (e - s) / 36e5;
};

const fetchWorkFiles = async (userId, periodStart, periodEnd) => {
  const sql = `
    SELECT 
      wf.*,
      COALESCE(t.draft_number, 1) as draft_number
    FROM work_files wf
    LEFT JOIN tasks t ON t.id = wf.task_id
    WHERE wf.employee_id = $1
      AND wf.created_at >= $2::date
      AND wf.created_at < ($3::date + INTERVAL '1 day')
    ORDER BY wf.created_at ASC
  `;
  const { rows } = await query(sql, [userId, periodStart, periodEnd]);
  console.log(`[KPI Calculation] Fetched ${rows.length} work files for employee ${userId}`);
  // Log is_digital status for debugging
  rows.forEach((file, idx) => {
    console.log(`[KPI Calculation] Work file ${idx + 1}: id=${file.id}, is_digital=${file.is_digital}, completed_at=${file.completed_at ? 'YES' : 'NO'}`);
  });
  return rows;
};

const upsertEmployeeSnapshot = async (userId, periodStart, periodEnd, metrics) => {
  const sql = `
    INSERT INTO employee_kpi_snapshots (
      user_id, period_start, period_end,
      file_disposal_rate, responsiveness, tat_score,
      quality_of_drafting, digital_adoption, final_kpi
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (user_id, period_start, period_end)
    DO UPDATE SET
      file_disposal_rate = EXCLUDED.file_disposal_rate,
      responsiveness = EXCLUDED.responsiveness,
      tat_score = EXCLUDED.tat_score,
      quality_of_drafting = EXCLUDED.quality_of_drafting,
      digital_adoption = EXCLUDED.digital_adoption,
      final_kpi = EXCLUDED.final_kpi,
      updated_at = NOW()
    RETURNING *
  `;
  await query(sql, [
    userId,
    periodStart,
    periodEnd,
    metrics.fileDisposalRate,
    metrics.responsiveness,
    metrics.tatScore,
    metrics.qualityOfDrafting,
    metrics.digitalAdoption,
    metrics.finalKpi,
  ]);
};

const fetchSnapshot = async (userId, periodStart, periodEnd) => {
  const { rows } = await query(
    `
      SELECT *
      FROM employee_kpi_snapshots
      WHERE user_id = $1 AND period_start = $2 AND period_end = $3
    `,
    [userId, periodStart, periodEnd],
  );
  return rows[0];
};

const normalizeMetrics = (metrics = {}) => ({
  fileDisposalRate: Number(metrics.fileDisposalRate ?? metrics.file_disposal_rate ?? 0),
  responsiveness: Number(metrics.responsiveness ?? 0),
  tatScore: Number(metrics.tatScore ?? metrics.tat_score ?? 0),
  qualityOfDrafting: Number(metrics.qualityOfDrafting ?? metrics.quality_of_drafting ?? 0),
  digitalAdoption: Number(metrics.digitalAdoption ?? metrics.digital_adoption ?? 0),
  manualAdjustment: Number(metrics.manualAdjustment ?? metrics.manual_adjustment ?? 0),
  finalKpi: Number(metrics.finalKpi ?? metrics.final_kpi ?? 0),
});

const ensurePeriod = (start, end) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const toDateOnly = (value, fallback) => {
    const date = value ? new Date(value) : fallback;
    return date.toISOString().slice(0, 10);
  };
  return [toDateOnly(start, first), toDateOnly(end, last)];
};

const computeFdr = (files) => {
  const totalWeight = files.reduce((sum, file) => sum + toNumber(file.complexity_weight, 1), 0);
  if (!totalWeight) return 0;

  const numerator = files.reduce((sum, file) => {
    if (!file.completed_at) return sum;
    const weight = toNumber(file.complexity_weight, 1);
    const S_i = toNumber(file.target_time_hours, 1);
    const duration = hoursBetween(file.created_at, file.completed_at);
    if (!duration || !S_i) return sum;
    const lateness = Math.max(0, duration / S_i - 1);
    const p_i = Math.max(0, 1 - KPI_PARAMS.lambda * lateness);
    return sum + weight * 1 * p_i;
  }, 0);

  return clamp((100 * numerator) / totalWeight);
};

const computeResponsiveness = (files) => {
  if (!files.length) return 0;

  // Responsiveness should be based on how fast employee completes the task
  // Use completed_at (when work is done) not first_response_at (when work started)
  const responseTimes = files.map((file) => {
    // Only use completed files for responsiveness
    if (!file.completed_at) {
      return null; // Skip incomplete files
    }
    const resp = hoursBetween(file.created_at, file.completed_at);
    return resp ?? KPI_PARAMS.T_ref_hours * 2;
  }).filter(time => time !== null);

  if (responseTimes.length === 0) return 0;

  const completedFiles = files.filter(f => f.completed_at);
  const slaHits = completedFiles.reduce((count, file, idx) => {
    const time = responseTimes[idx];
    if (time === null) return count;
    const within = time <= toNumber(file.sla_time_hours, KPI_PARAMS.T_ref_hours);
    return within ? count + 1 : count;
  }, 0);

  const SLA_rate = completedFiles.length ? slaHits / completedFiles.length : 0;
  const muT = responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length;
  const muT_norm = Math.min(1, muT / KPI_PARAMS.T_ref_hours);
  return clamp(100 * (KPI_PARAMS.omega * SLA_rate + (1 - KPI_PARAMS.omega) * (1 - muT_norm)));
};

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const computeTat = (files) => {
  const completed = files.filter(f => f.completed_at);
  if (!completed.length) {
    console.log('[KPI Calculation] TAT Score: No completed files, returning 0');
    return 0;
  }

  const T_target = KPI_PARAMS.T_target_hours || 3;
  console.log(`[KPI Calculation] TAT Score: T_target = ${T_target} hours, ${completed.length} completed files`);

  const durations = completed.map(file => {
    const d = hoursBetween(file.created_at, file.completed_at);
    return Math.max(d || 0.01, 0.01); // never allow 0
  });

  // exponential decay scoring
  const scores = durations.map(d => Math.exp(-(d / T_target)));
  console.log(`[KPI Calculation] TAT Score: Durations:`, durations.map(d => d.toFixed(2)));
  console.log(`[KPI Calculation] TAT Score: Exponential scores:`, scores.map(s => s.toFixed(4)));

  const weights = completed.map(file => toNumber(file.complexity_weight, 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  console.log(`[KPI Calculation] TAT Score: Total weight = ${totalWeight.toFixed(2)}`);

  // weighted normalization
  const weightedSum = scores.reduce((sum, score, idx) => sum + score * weights[idx], 0);
  const normalized = weightedSum / totalWeight;
  console.log(`[KPI Calculation] TAT Score: Weighted sum = ${weightedSum.toFixed(4)}, Normalized = ${normalized.toFixed(4)}`);

  // consistency penalty
  const avgT = durations.reduce((sum, val) => sum + val, 0) / durations.length;
  const stdT = standardDeviation(durations);
  const cv = avgT === 0 ? 0 : stdT / avgT;
  const consistency = Math.max(0, 1 - KPI_PARAMS.kappa * cv);
  console.log(`[KPI Calculation] TAT Score: Avg duration = ${avgT.toFixed(2)}h, Std dev = ${stdT.toFixed(2)}h, CV = ${cv.toFixed(4)}, Consistency = ${consistency.toFixed(4)}`);

  // final TAT score
  const finalTat = clamp(100 * normalized * consistency);
  console.log(`[KPI Calculation] TAT Score: Final = ${finalTat.toFixed(2)}% (normalized: ${normalized.toFixed(4)} × consistency: ${consistency.toFixed(4)})`);
  return finalTat;
};

const computeQod = (files) => {
  if (!files.length) return 0;
  const D_MAX = 5; // Maximum allowed drafts
  const qualityScores = files.map((file) => {
    const draftNumber = toNumber(file.draft_number, 1);
    // QoD_i = max(0, 1 - (d_i - 1) / (d_max - 1))
    const qod_i = Math.max(0, 1 - (draftNumber - 1) / (D_MAX - 1));
    return qod_i;
  });
  const avg = qualityScores.reduce((sum, val) => sum + val, 0) / qualityScores.length;
  // QoD = 100 × average(QoD_i over all files)
  return clamp(100 * avg);
};

const computeDigitalAdoption = (files) => {
  const totalWeight = files.reduce((sum, file) => sum + toNumber(file.complexity_weight, 1), 0);
  if (!totalWeight) {
    console.log('[KPI Calculation] Digital Adoption: No files found, returning 0');
    return 0;
  }

  let digitalCount = 0;
  let totalCount = 0;

  const numerator = files.reduce((sum, file) => {
    const weight = toNumber(file.complexity_weight, 1);
    const digital = file.is_digital ? 1 : 0;
    totalCount++;
    if (file.is_digital) digitalCount++;
    console.log(`[KPI Calculation] Digital Adoption: File ${file.id} - is_digital: ${file.is_digital}, weight: ${weight}`);
    return sum + weight * digital;
  }, 0);

  const digitalAdoption = clamp((100 * numerator) / totalWeight);
  console.log(`[KPI Calculation] Digital Adoption: ${digitalCount}/${totalCount} files are digital, weighted score: ${digitalAdoption.toFixed(2)}%`);
  return digitalAdoption;
};

const getManualAdjustment = async (userId, periodStart, periodEnd) => {
  const { rows } = await query(
    `
      SELECT delta
      FROM kpi_adjustments
      WHERE user_id = $1
        AND period_start = $2
        AND period_end = $3
    `,
    [userId, periodStart, periodEnd],
  );
  return rows[0]?.delta ? Number(rows[0].delta) : 0;
};

const computeEmployeeKpis = async (userId, periodStartInput, periodEndInput, { persist = true } = {}) => {
  const [periodStart, periodEnd] = ensurePeriod(periodStartInput, periodEndInput);
  console.log(`[KPI Calculation] Starting KPI calculation for employee ${userId}, period: ${periodStart} to ${periodEnd}`);

  const files = await fetchWorkFiles(userId, periodStart, periodEnd);
  console.log(`[KPI Calculation] Found ${files.length} work files for employee ${userId} in period ${periodStart} to ${periodEnd}`);

  const manualAdjustmentEmptyPeriod = await getManualAdjustment(userId, periodStart, periodEnd);

  if (!files.length) {
    console.log(`[KPI Calculation] No work files found for employee ${userId}, returning empty metrics`);
    const emptyMetrics = {
      fileDisposalRate: 0,
      responsiveness: 0,
      tatScore: 0,
      qualityOfDrafting: 0,
      digitalAdoption: 0,
      manualAdjustment: manualAdjustmentEmptyPeriod,
      finalKpi: clamp(manualAdjustmentEmptyPeriod),
    };
    if (persist) {
      await upsertEmployeeSnapshot(userId, periodStart, periodEnd, emptyMetrics);
      console.log(`[KPI Calculation] Stored empty metrics in employee_kpi_snapshots for employee ${userId}`);
    }
    await auditService.logAction(userId, 'EMPLOYEE_KPI_COMPUTED', 'employee_kpi_snapshots', null, {
      periodStart,
      periodEnd,
      finalKpi: 0,
    });
    return emptyMetrics;
  }

  console.log(`[KPI Calculation] Computing individual KPI components for employee ${userId}`);
  const fileDisposalRate = computeFdr(files);
  console.log(`[KPI Calculation] File Disposal Rate: ${fileDisposalRate.toFixed(2)}%`);

  const responsiveness = computeResponsiveness(files);
  console.log(`[KPI Calculation] Responsiveness: ${responsiveness.toFixed(2)}%`);

  const tatScore = computeTat(files);
  console.log(`[KPI Calculation] TAT Score: ${tatScore.toFixed(2)}%`);

  const qualityOfDrafting = computeQod(files);
  console.log(`[KPI Calculation] Quality of Drafting: ${qualityOfDrafting.toFixed(2)}%`);

  const digitalAdoption = computeDigitalAdoption(files);
  console.log(`[KPI Calculation] Digital Adoption: ${digitalAdoption.toFixed(2)}%`);

  const baseFinalKpi = (fileDisposalRate + responsiveness + tatScore + qualityOfDrafting + digitalAdoption) / 5;
  const finalKpi = clamp(baseFinalKpi);
  console.log(`[KPI Calculation] Base Final KPI (before adjustment): ${finalKpi.toFixed(2)}%`);

  const manualAdjustment = await getManualAdjustment(userId, periodStart, periodEnd);
  const adjustedFinalKpi = clamp(finalKpi + manualAdjustment);
  console.log(`[KPI Calculation] Manual Adjustment: ${manualAdjustment.toFixed(2)}`);
  console.log(`[KPI Calculation] Final KPI (after adjustment): ${adjustedFinalKpi.toFixed(2)}%`);

  const metrics = {
    fileDisposalRate,
    responsiveness,
    tatScore,
    qualityOfDrafting,
    digitalAdoption,
    manualAdjustment,
    finalKpi: adjustedFinalKpi,
  };

  if (persist) {
    await upsertEmployeeSnapshot(userId, periodStart, periodEnd, metrics);
    console.log(`[KPI Calculation] Stored KPI metrics in employee_kpi_snapshots for employee ${userId}:`, {
      fileDisposalRate: metrics.fileDisposalRate.toFixed(2),
      responsiveness: metrics.responsiveness.toFixed(2),
      tatScore: metrics.tatScore.toFixed(2),
      qualityOfDrafting: metrics.qualityOfDrafting.toFixed(2),
      digitalAdoption: metrics.digitalAdoption.toFixed(2),
      finalKpi: metrics.finalKpi.toFixed(2)
    });
  }

  await auditService.logAction(userId, 'EMPLOYEE_KPI_COMPUTED', 'employee_kpi_snapshots', userId, {
    periodStart,
    periodEnd,
    finalKpi: adjustedFinalKpi,
  });

  return metrics;
};

const getEmployeeHistory = async (userId) => {
  const { rows } = await query(
    `
      SELECT period_start, period_end, file_disposal_rate as "fileDisposalRate",
             responsiveness, tat_score as "tatScore",
             quality_of_drafting as "qualityOfDrafting",
             digital_adoption as "digitalAdoption",
             final_kpi as "finalKpi"
      FROM employee_kpi_snapshots
      WHERE user_id = $1
      ORDER BY period_start DESC
      LIMIT 12
    `,
    [userId],
  );
  return rows;
};

const getTeamKpiTable = async (managerId, periodStart, periodEnd) => {
  const [start, end] = ensurePeriod(periodStart, periodEnd);

  // Priority 1: Get team members from actual team assignments (team_members table)
  const teamBasedMembers = await query(
    `
      SELECT tm.user_id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      JOIN users u ON u.id = tm.user_id
      WHERE t.manager_id = $1
        AND u.role = 'EMPLOYEE'
        AND u.is_active = TRUE
    `,
    [managerId],
  );

  let teamMembers;
  // If we have team members from assignments, use them
  if (teamBasedMembers.rows.length > 0) {
    teamMembers = teamBasedMembers;
  } else {
    // Priority 2: Fallback to department-based filtering (for backward compatibility)
    const { rows: managerRow } = await query(
      `SELECT department FROM users WHERE id = $1 AND role = 'MANAGER'`,
      [managerId]
    );

    if (managerRow[0] && managerRow[0].department) {
      teamMembers = await query(
        `
          SELECT u.id as user_id
          FROM users u
          WHERE u.department = $1 
            AND u.role = 'EMPLOYEE'
            AND u.is_active = TRUE
            AND NOT EXISTS (
              SELECT 1 FROM team_members tm 
              JOIN teams t ON t.id = tm.team_id 
              WHERE tm.user_id = u.id
            )
        `,
        [managerRow[0].department],
      );
    } else {
      // No team members found
      teamMembers = { rows: [] };
    }
  }

  const results = [];
  for (const row of teamMembers.rows) {
    let metrics = await fetchSnapshot(row.user_id, start, end);
    if (!metrics) {
      metrics = await computeEmployeeKpis(row.user_id, start, end);
    }
    results.push({
      userId: row.user_id,
      ...normalizeMetrics(metrics),
    });
  }
  return results;
};

const applyManualAdjustment = async (userId, actor, delta, reason, periodStartInput, periodEndInput) => {
  const [periodStart, periodEnd] = ensurePeriod(periodStartInput, periodEndInput);
  await query(
    `
      INSERT INTO kpi_adjustments (user_id, manager_id, period_start, period_end, delta, reason)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (user_id, period_start, period_end)
      DO UPDATE SET
        delta = EXCLUDED.delta,
        reason = EXCLUDED.reason,
        created_at = NOW()
    `,
    [userId, actor.id, periodStart, periodEnd, delta, reason || null],
  );

  const metrics = await computeEmployeeKpis(userId, periodStart, periodEnd);

  await auditService.logAction(actor.id, 'KPI_MANUAL_ADJUSTMENT', 'kpi_adjustments', userId, {
    delta,
    reason,
    periodStart,
    periodEnd,
  });

  await notificationService.createNotification(userId, {
    type: 'KPI',
    title: 'KPI adjusted',
    body: `Your KPI for ${periodStart} - ${periodEnd} was adjusted by ${actor.name}.`,
    metadata: { periodStart, periodEnd, delta },
  });

  return metrics;
};

const getEmployeeKpi = async (userId, periodStartInput, periodEndInput) => {
  const [periodStart, periodEnd] = ensurePeriod(periodStartInput, periodEndInput);
  console.log(`[KPI Fetch] Fetching KPI for employee ${userId}, period: ${periodStart} to ${periodEnd}`);

  // First, try to get existing snapshot
  let metrics = await fetchSnapshot(userId, periodStart, periodEnd);

  if (metrics) {
    console.log(`[KPI Fetch] Found existing snapshot in employee_kpi_snapshots for employee ${userId}:`, {
      fileDisposalRate: metrics.file_disposal_rate,
      responsiveness: metrics.responsiveness,
      tatScore: metrics.tat_score,
      qualityOfDrafting: metrics.quality_of_drafting,
      digitalAdoption: metrics.digital_adoption,
      finalKpi: metrics.final_kpi
    });

    // If snapshot exists, fetch current manual adjustment to include in response
    const manualAdjustment = await getManualAdjustment(userId, periodStart, periodEnd);
    metrics.manualAdjustment = manualAdjustment;
    // Note: snapshot's finalKpi already includes the adjustment from when it was computed
    // If adjustment changed, finalKpi would need recomputation, but for now we return snapshot as-is
  } else {
    console.log(`[KPI Fetch] No snapshot found, computing KPI for employee ${userId}`);
    // If no snapshot exists, compute it
    metrics = await computeEmployeeKpis(userId, periodStart, periodEnd);
  }

  // Normalize and return metrics
  const normalized = normalizeMetrics(metrics);
  console.log(`[KPI Fetch] Returning normalized KPI metrics for employee ${userId}:`, normalized);
  return normalized;
};

module.exports = {
  computeEmployeeKpis,
  getEmployeeKpi,
  getEmployeeHistory,
  getTeamKpiTable,
  applyManualAdjustment,
};

