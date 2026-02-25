

require('dotenv').config();
const { query } = require('../../config/database');

// Generate next day's KPI based on previous value (deterministic)
const nextKpi = (prev, weeklyTrend, dayIndex, employeeId, noise = 2) => {
  // Use deterministic pseudo-random based on day and employee ID
  const seed = (dayIndex * 1000 + employeeId) % 1000;
  const drift = ((seed / 1000) * 2 - 1) * noise; // -2 to +2 (deterministic)
  let value = prev + drift + weeklyTrend;

  // clamp 0–100
  value = Math.max(0, Math.min(100, value));

  return Math.round(value * 100) / 100;
};

const generateDailyKpiData = async (days = 30) => {
  console.log(`[Seed] Generating smoother daily KPI data...`);

  const { rows: employees } = await query(
    `SELECT id FROM users WHERE role = 'FIELD_EMPLOYEE'`
  );

  if (!employees.length) {
    console.log(`[Seed] No field employees found.`);
    return;
  }

  const today = new Date();

  for (const employee of employees) {
    // Start each KPI with a stable baseline (deterministic based on employee ID)
    const baseSeed = employee.id % 100;
    let dpr = 70 + (baseSeed % 20);
    let tech = 75 + ((baseSeed * 2) % 20);
    let survey = 80 + ((baseSeed * 3) % 15);
    let exp = 65 + ((baseSeed * 4) % 25);
    let time = 70 + ((baseSeed * 5) % 25);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);

      // WEEKLY TREND (smooth wave: -3 to +3)
      const weeklyTrend = Math.sin((i / 7) * Math.PI * 2) * 3;

      // Generate next day's KPIs (deterministic)
      dpr = nextKpi(dpr, weeklyTrend, i, employee.id, 1.5);
      tech = nextKpi(tech, weeklyTrend, i, employee.id, 1.5);
      survey = nextKpi(survey, weeklyTrend, i, employee.id, 1.2);
      exp = nextKpi(exp, weeklyTrend, i, employee.id, 2);
      time = nextKpi(time, weeklyTrend, i, employee.id, 1.5);

      const overall =
        dpr * 0.2 +
        tech * 0.2 +
        survey * 0.2 +
        exp * 0.2 +
        time * 0.2;

      try {
        await query(
          `
            INSERT INTO field_employee_daily_kpi (
              day, user_id,
              timeliness_quality_dpr,
              technical_compliance_projects,
              survey_accuracy,
              expenditure_vs_targets,
              task_timeliness,
              overall_kpi
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT (day, user_id) DO NOTHING
          `,
          [dateStr, employee.id, dpr, tech, survey, exp, time, overall]
        );
      } catch (err) {
        console.error(err.message);
      }
    }
  }

  console.log("[Seed] Brahmaputra Board daily KPI generation complete!");
};

generateDailyKpiData();
