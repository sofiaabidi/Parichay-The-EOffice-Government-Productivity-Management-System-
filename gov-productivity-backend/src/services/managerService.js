const { query } = require('../config/database');
const kpiService = require('./kpiService');
const taskService = require('./taskService');
const auditService = require('./auditService');

const ETA = 0.6;

const upsertManagerSnapshot = async (managerId, periodStart, periodEnd, metrics) => {
  const sql = `
    INSERT INTO manager_kpi_snapshots (
      manager_id, period_start, period_end,
      avg_team_kpi, review_ratio, final_kpi
    ) VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (manager_id, period_start, period_end)
    DO UPDATE SET
      avg_team_kpi = EXCLUDED.avg_team_kpi,
      review_ratio = EXCLUDED.review_ratio,
      final_kpi = EXCLUDED.final_kpi,
      updated_at = NOW()
    RETURNING *
  `;
  const { rows } = await query(sql, [
    managerId,
    periodStart,
    periodEnd,
    metrics.avgTeamKpi,
    metrics.reviewRatio,
    metrics.finalKpi,
  ]);
  return rows[0];
};

const ensurePeriod = (start, end) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
  const toIso = (value, fallback) => (value ? new Date(value).toISOString() : fallback.toISOString());
  return [toIso(start, first), toIso(end, last)];
};

const computeReviewRatio = async (managerId, periodStart, periodEnd) => {
  const { rows } = await query(
    `
      SELECT
        COUNT(*) FILTER (WHERE reviewed_by = $1 AND reviewed_at IS NOT NULL)::int AS reviewed,
        COUNT(*)::int AS total
      FROM work_files
      WHERE manager_id = $1
        AND created_at BETWEEN $2 AND $3
    `,
    [managerId, periodStart, periodEnd],
  );
  const reviewed = rows[0]?.reviewed || 0;
  const total = rows[0]?.total || 0;
  return total ? reviewed / total : 0;
};

const computeManagerKpi = async (managerId, periodStartInput, periodEndInput) => {
  const [periodStart, periodEnd] = ensurePeriod(periodStartInput, periodEndInput);
  const teamTable = await kpiService.getTeamKpiTable(managerId, periodStart, periodEnd);
  const avgTeamKpi =
    teamTable.length === 0
      ? 0
      : teamTable.reduce((sum, member) => sum + Number(member.finalKpi || member.final_kpi || 0), 0) /
        teamTable.length;
  const reviewRatio = await computeReviewRatio(managerId, periodStart, periodEnd);
  const finalKpi = 100 * (ETA * (avgTeamKpi / 100) + (1 - ETA) * reviewRatio);
  const snapshot = await upsertManagerSnapshot(managerId, periodStart, periodEnd, {
    avgTeamKpi,
    reviewRatio,
    finalKpi,
  });

  await auditService.logAction(managerId, 'MANAGER_KPI_COMPUTED', 'manager_kpi_snapshots', snapshot.id, {
    avgTeamKpi,
    reviewRatio,
    finalKpi,
  });

  return {
    periodStart,
    periodEnd,
    avgTeamKpi,
    reviewRatio,
    finalKpi,
  };
};

const getDashboardSummary = async (managerId, periodStart, periodEnd) => {
  const managerKpi = await computeManagerKpi(managerId, periodStart, periodEnd);
  const teamTable = await kpiService.getTeamKpiTable(managerId, periodStart, periodEnd);

  const avgResp =
    teamTable.length === 0
      ? 0
      : teamTable.reduce((sum, member) => sum + Number(member.responsiveness || 0), 0) / teamTable.length;
  const avgFdr =
    teamTable.length === 0
      ? 0
      : teamTable.reduce((sum, member) => sum + Number(member.fileDisposalRate ?? member.file_disposal_rate ?? 0), 0) /
        teamTable.length;
  const avgTat =
    teamTable.length === 0
      ? 0
      : teamTable.reduce((sum, member) => sum + Number(member.tatScore ?? member.tat_score ?? 0), 0) /
        teamTable.length;

  return {
    managerFinalKpi: managerKpi.finalKpi,
    averageTeamKpi: managerKpi.avgTeamKpi,
    slaAdherence: avgResp,
    fileDisposalRate: avgFdr,
    tatScore: avgTat,
  };
};

const getLeaderboard = async (managerId, periodStart, periodEnd) => {
  const teamTable = await kpiService.getTeamKpiTable(managerId, periodStart, periodEnd);
  return teamTable
    .map((member) => ({
      userId: member.userId,
      finalKpi: Number(member.finalKpi ?? member.final_kpi ?? 0),
      fileDisposalRate: Number(member.fileDisposalRate ?? member.file_disposal_rate ?? 0),
      responsiveness: member.responsiveness || 0,
    }))
    .sort((a, b) => b.finalKpi - a.finalKpi);
};

const getStatusBreakdown = async (managerId) => taskService.getStatusBreakdown(managerId);
const getPendingApprovals = async (managerId) => taskService.getPendingApprovals(managerId);
const getTrends = async (managerId) => taskService.getTrends(managerId);

module.exports = {
  computeManagerKpi,
  getDashboardSummary,
  getLeaderboard,
  getStatusBreakdown,
  getTrends,
  getPendingApprovals,
};

