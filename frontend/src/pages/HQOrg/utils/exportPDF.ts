import jsPDF from 'jspdf';
import { toast } from 'sonner@2.0.3';

export const exportToPDF = () => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Title
    pdf.setFontSize(22);
    pdf.setTextColor(37, 99, 235);
    pdf.text('HQ Organisation Dashboard', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Real-time staffing, performance and workload insights', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);

    // Staffing Status Overview
    yPosition += 15;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('STAFFING STATUS OVERVIEW', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    const staffingData = [
      { label: 'Understaffed Teams', value: '8', note: '3 departments need immediate hiring' },
      { label: 'Overstaffed Teams', value: '3', note: 'Potential for resource reallocation' },
      { label: 'Balanced Teams', value: '12', note: 'Maintain current staffing levels' },
      { label: 'Total Active Projects', value: '47', note: '23 projects on track, 24 need monitoring' }
    ];

    staffingData.forEach((item) => {
      pdf.text(`${item.label}: ${item.value}`, 25, yPosition);
      yPosition += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`  └ ${item.note}`, 25, yPosition);
      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
    });

    // KPI Scores
    yPosition += 5;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('KEY PERFORMANCE INDICATORS', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text('Average Manager KPI Score: 87 / 100 (Excellent Performance)', 25, yPosition);
    yPosition += 7;
    pdf.text('Average Employee KPI Score: 79 / 100 (Good Performance)', 25, yPosition);

    // AI Insights
    yPosition += 15;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('AI DATA-DRIVEN INSIGHTS', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const insights = [
      'Team Alpha may experience workload pressure next month.',
      'Potential productivity dip detected in 3 employees.',
      'Documentation unit is likely to face staffing shortage.'
    ];

    insights.forEach((insight) => {
      pdf.text(`• ${insight}`, 25, yPosition);
      yPosition += 7;
    });

    // Promotion Candidates
    yPosition += 8;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PROMOTION CANDIDATES', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const promotions = [
      { name: 'Sarah Chen', score: '94', rating: '4.8' },
      { name: 'Michael Torres', score: '91', rating: '4.7' },
      { name: 'Emily Watson', score: '89', rating: '4.6' },
      { name: 'James Park', score: '88', rating: '4.5' }
    ];

    promotions.forEach((person) => {
      pdf.text(`${person.name} - Performance: ${person.score}/100, Rating: ${person.rating}/5.0`, 25, yPosition);
      yPosition += 6;
    });

    // Training Needed
    yPosition += 8;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TRAINING RECOMMENDATIONS', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const training = [
      { name: 'Alex Rivera', issue: 'Deadline adherence', gap: 'Project Management' },
      { name: 'Lisa Anderson', issue: 'Communication gaps', gap: 'Technical Writing' },
      { name: 'David Kim', issue: 'Quality control', gap: 'Quality Assurance' }
    ];

    training.forEach((person) => {
      pdf.text(`${person.name} - Issue: ${person.issue}, Skill Gap: ${person.gap}`, 25, yPosition);
      yPosition += 6;
    });

    // Footer
    yPosition = pdf.internal.pageSize.height - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    // Save PDF
    pdf.save('HQ_Dashboard_Report.pdf');
    toast.success('Report exported successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to export report');
  }
};
