import { jsPDF } from 'jspdf';

export function generatePDFReport() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper function to add text with auto page break
  const addText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal', color: number[] = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += size * 0.5;
    });
    y += 3;
  };

  const addSection = (title: string) => {
    y += 5;
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, y - 6, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Title
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FIELD ORGANISATION DASHBOARD', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Comprehensive Analytics Report', pageWidth / 2, 23, { align: 'center' });
  
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(9);
  doc.text(`Generated on: ${date}`, pageWidth / 2, 30, { align: 'center' });
  
  y = 45;
  doc.setTextColor(0, 0, 0);

  // Executive Summary
  addSection('EXECUTIVE SUMMARY');
  addText('This report provides a comprehensive overview of field operations, staffing levels, performance metrics, and strategic recommendations for the Field Organisation.', 10);

  // Staffing Status Overview
  addSection('STAFFING STATUS OVERVIEW');
  addText('Understaffed Field Units: 3', 10, 'bold', [220, 38, 38]);
  addText('Additional manpower required immediately for optimal operations.', 9);
  y += 2;
  
  addText('Overstaffed Field Units: 1', 10, 'bold', [245, 158, 11]);
  addText('Redistribution recommended to balance workload across teams.', 9);
  y += 2;
  
  addText('Balanced Teams: 8', 10, 'bold', [16, 185, 129]);
  addText('Optimally staffed with balanced workload distribution.', 9);
  y += 2;
  
  addText('Total Active Field Projects: 24', 10, 'bold', [99, 102, 241]);
  addText('Ongoing projects currently in progress across all field offices.', 9);
  y += 5;
  
  addText('OVERALL ASSESSMENT: The organization requires staffing optimization with 3 units needing immediate attention.', 10, 'bold', [79, 70, 229]);

  // KPI Performance Metrics
  addSection('KPI PERFORMANCE METRICS');
  
  addText('Average Manager KPI Score: 87/100', 11, 'bold', [139, 92, 246]);
  addText('Key Performance Factors:', 10, 'bold');
  addText('• Leadership effectiveness', 9);
  addText('• Decision-making quality', 9);
  addText('• Resource allocation', 9);
  addText('• Team coordination', 9);
  addText('• Field supervision', 9);
  y += 5;
  
  addText('Average Field Employee KPI Score: 82/100', 11, 'bold', [6, 182, 212]);
  addText('Key Performance Factors:', 10, 'bold');
  addText('• Timeliness & quality of DPR preparation', 9);
  addText('• Survey accuracy', 9);
  addText('• Adherence to project timelines', 9);
  addText('• Expenditure vs. financial targets', 9);
  addText('• Physical progress of works', 9);
  addText('• Compliance with technical standards', 9);

  // AI-Driven Insights
  addSection('AI-DRIVEN INSIGHTS & PREDICTIONS');
  
  doc.setFillColor(254, 243, 199);
  doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
  addText('⚠ Field Team Alpha may experience workload pressure next month', 10, 'bold', [180, 83, 9]);
  addText('Recommendation: Consider workload redistribution or temporary support', 9);
  y += 3;
  
  doc.setFillColor(254, 226, 226);
  doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
  addText('⚠ Productivity dip detected in 3 field staff members', 10, 'bold', [220, 38, 38]);
  addText('Recommendation: Investigate causes and provide necessary support', 9);
  y += 3;
  
  doc.setFillColor(254, 243, 199);
  doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
  addText('⚠ Survey & Documentation unit likely to face staffing shortage', 10, 'bold', [234, 88, 12]);
  addText('Recommendation: Prioritize hiring for this critical unit', 9);

  // New Page for detailed data
  doc.addPage();
  y = 20;

  // Promotion Candidates
  addSection('PROMOTION CANDIDATES');
  addText('The following employees have demonstrated exceptional performance and are recommended for promotion:', 9);
  y += 3;
  
  const promotions = [
    'Rajesh Kumar - Performance: 94 | Manager Rating: 4.8★',
    'Priya Sharma - Performance: 91 | Manager Rating: 4.7★',
    'Amit Patel - Performance: 89 | Manager Rating: 4.6★',
    'Sneha Reddy - Performance: 88 | Manager Rating: 4.5★',
    'Vikram Singh - Performance: 87 | Manager Rating: 4.5★',
  ];
  
  promotions.forEach((p, i) => {
    addText(`${i + 1}. ${p}`, 9);
  });

  // Training Requirements
  addSection('TRAINING REQUIREMENTS');
  addText('Employees requiring skill development and training interventions:', 9);
  y += 3;
  
  const training = [
    'Rahul Verma - KPI: 68 | Skill Gap: Documentation',
    'Anjali Gupta - KPI: 71 | Skill Gap: Technical Skills',
    'Suresh Mehta - KPI: 69 | Skill Gap: Time Management',
    'Kavita Joshi - KPI: 72 | Skill Gap: Financial Planning',
    'Deepak Rao - KPI: 70 | Skill Gap: Quality Control',
  ];
  
  training.forEach((t, i) => {
    addText(`${i + 1}. ${t}`, 9);
  });

  // Active Projects Summary
  addSection('ACTIVE PROJECTS SUMMARY');
  
  const projects = [
    'Highway Survey - Phase 1 | Progress: 68% | Status: Active',
    'Bridge Construction | Progress: 45% | Status: Active',
    'Road Expansion Project | Progress: 32% | Status: Delayed',
    'Railway Survey | Progress: 58% | Status: Active',
    'Metro Line Extension | Progress: 25% | Status: On Hold',
    'Drainage System Upgrade | Progress: 72% | Status: Active',
  ];
  
  projects.forEach((p, i) => {
    const status = p.includes('Delayed') ? [220, 38, 38] : p.includes('On Hold') ? [245, 158, 11] : [16, 185, 129];
    addText(`${i + 1}. ${p}`, 9, 'normal', status);
  });

  // Workload Forecast
  addSection('WORKLOAD FORECAST ANALYSIS');
  addText('Current Month Average: 72.5', 10, 'bold');
  addText('Next Month Forecast: 78.2 (+7.9%)', 10, 'bold', [245, 158, 11]);
  addText('Confidence Interval: ±8 points', 9);
  y += 3;
  addText('Trend Analysis: Increasing workload expected', 10, 'bold');
  addText('Recommendation: Prepare for increased staffing needs and resource allocation', 9);

  // Productivity Anomalies
  addSection('PRODUCTIVITY ANOMALIES (Last 12 Weeks)');
  addText('Week 3: High Spike (92) - Temporary project push', 9, 'normal', [16, 185, 129]);
  addText('Week 6: Low Dip (58) - Holiday period impact', 9, 'normal', [220, 38, 38]);
  addText('Week 9: High Spike (95) - Deadline-driven performance', 9, 'normal', [16, 185, 129]);
  y += 3;
  addText('Average Productivity: 77 | Standard Deviation: 8.2', 10, 'bold');

  // New page for recommendations
  doc.addPage();
  y = 20;

  // Recommendations
  addSection('STRATEGIC RECOMMENDATIONS');
  
  addText('1. IMMEDIATE ACTIONS (0-1 Month):', 11, 'bold', [220, 38, 38]);
  addText('• Address understaffing in 3 field units with urgent recruitment', 9);
  addText('• Investigate productivity dips in identified employees', 9);
  addText('• Expedite hiring for Survey & Documentation unit', 9);
  addText('• Implement temporary workload redistribution for Team Alpha', 9);
  y += 5;
  
  addText('2. SHORT-TERM INITIATIVES (1-3 Months):', 11, 'bold', [245, 158, 11]);
  addText('• Implement comprehensive training programs for 5 identified employees', 9);
  addText('• Review and optimize workload distribution across all teams', 9);
  addText('• Process promotions for top 5 performing candidates', 9);
  addText('• Establish monthly performance review cycles', 9);
  y += 5;
  
  addText('3. LONG-TERM STRATEGY (3-6 Months):', 11, 'bold', [16, 185, 129]);
  addText('• Develop comprehensive succession planning framework', 9);
  addText('• Enhance KPI monitoring and analytics systems', 9);
  addText('• Implement predictive analytics for proactive workload management', 9);
  addText('• Create mentorship programs for high-potential employees', 9);
  addText('• Establish quarterly strategic planning reviews', 9);

  // Footer
  y += 10;
  addLine();
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Report generated by Field Organisation Dashboard System', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('CONFIDENTIAL - For Authorized Personnel Only', pageWidth / 2, y, { align: 'center' });

  // Save the PDF
  doc.save(`Field_Organisation_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
