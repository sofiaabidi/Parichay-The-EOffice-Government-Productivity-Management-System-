

-- Feedback from Manager Rajesh Kumar (ID 2) to his employees
INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Feedback to Priya Sharma (ID 3)
  (2, 3, 'Overall Performance', 4, 'Good technical work on embankment design. Some areas need more attention to detail.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '25 days'),
  (2, 3, 'Project Management', 3, 'Need to improve on-time project delivery. Several deadlines were missed this quarter.', 'negative', 'disappointment', NOW() - INTERVAL '18 days'),
  
  -- Feedback to Amit Verma (ID 4)
  (2, 4, 'Technical Skills', 5, 'Excellent hydrology analysis work. Very thorough and accurate reporting.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '22 days'),
  (2, 4, 'Communication', 3, 'Communication with team members needs improvement. More proactive updates would help.', 'neutral', 'stress,frustration', NOW() - INTERVAL '15 days'),
  
  -- Feedback to Deepak Singh (ID 8)
  (2, 8, 'Work Quality', 4, 'Good quality work on monthly reports. Continue maintaining this standard.', 'positive', 'respect,trust', NOW() - INTERVAL '20 days'),
  (2, 8, 'Timeliness', 2, 'Reports are consistently submitted late. This affects overall project timelines.', 'negative', 'frustration,anger', NOW() - INTERVAL '12 days');

-- Feedback from Manager Suresh Das (ID 5) to his employees
INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Feedback to Neha Patel (ID 6)
  (5, 6, 'Design Quality', 5, 'Outstanding flood protection design work. The technical approach is exemplary.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '24 days'),
  (5, 6, 'Team Collaboration', 3, 'Work well independently but need more engagement with team members on collaborative projects.', 'neutral', 'stress,frustration', NOW() - INTERVAL '17 days'),
  
  -- Feedback to Kiran Reddy (ID 7)
  (5, 7, 'Technical Skills', 4, 'Good hydrology data validation skills. Keep up the good work.', 'positive', 'support,cooperation', NOW() - INTERVAL '21 days'),
  (5, 7, 'Project Delivery', 2, 'Hydrology validation tasks are consistently delayed. This is causing project bottlenecks.', 'negative', 'anger,stress', NOW() - INTERVAL '14 days');

-- Feedback from Field Manager Vikram Mehta (ID 9) to his employees
INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Feedback to Arjun Sharma (ID 10)
  (9, 10, 'Field Work Quality', 5, 'Excellent embankment site measurements. Very detailed and accurate field documentation.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '28 days'),
  (9, 10, 'Time Management', 4, 'Good time management on field visits. Could improve efficiency on data entry tasks.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '19 days'),
  
  -- Feedback to Priya Das (ID 11)
  (9, 11, 'Survey Work', 4, 'Good embankment photo documentation. Consider taking more angles for comprehensive coverage.', 'positive', 'support,cooperation', NOW() - INTERVAL '26 days'),
  (9, 11, 'Documentation', 3, 'Survey documentation needs more detail. Some reports lack critical information.', 'neutral', 'disappointment', NOW() - INTERVAL '16 days'),
  
  -- Feedback to Amit Kumar (ID 12)
  (9, 12, 'Technical Knowledge', 5, 'Excellent technical knowledge in flood management. Your expertise is valuable to the team.', 'positive', 'respect,trust', NOW() - INTERVAL '23 days'),
  (9, 12, 'Cost Estimation', 3, 'Cost estimates need more accuracy. Several revisions were required on recent projects.', 'negative', 'frustration,anger', NOW() - INTERVAL '13 days'),
  
  -- Feedback to Sneha Reddy (ID 13)
  (9, 13, 'Coordination Skills', 4, 'Good coordination on flood management projects. Keep maintaining this level of organization.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '27 days'),
  (9, 13, 'Report Submission', 2, 'Project reports are consistently submitted late. This impacts decision-making timelines.', 'negative', 'anger', NOW() - INTERVAL '11 days');

-- Feedback from Field Manager Rajesh Singh (ID 14) to his employees
INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Feedback to Neha Verma (ID 15)
  (14, 15, 'Engineering Work', 5, 'Excellent field engineering work on hydrology surveys. Technical skills are outstanding.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '29 days'),
  (14, 15, 'Training Participation', 4, 'Active participation in training programs. Continue learning and growing.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '20 days'),
  
  -- Feedback to Rohit Desai (ID 16)
  (14, 16, 'Survey Documentation', 4, 'Good hydrology survey documentation. Maintain the quality standards.', 'positive', 'support,cooperation', NOW() - INTERVAL '25 days'),
  (14, 16, 'Data Accuracy', 3, 'Some survey data entries have errors. Please double-check before submission.', 'negative', 'stress,frustration', NOW() - INTERVAL '17 days'),
  
  -- Feedback to Kavita Nair (ID 17)
  (14, 17, 'Site Management', 5, 'Outstanding site supervision and management for embankment projects. Excellent leadership.', 'positive', 'respect,trust', NOW() - INTERVAL '22 days'),
  (14, 17, 'Resource Planning', 3, 'Resource allocation for site visits needs better planning. Coordinate more in advance.', 'neutral', 'disappointment', NOW() - INTERVAL '15 days');

-- Feedback from Manager Anil Kapoor (ID 30) to his employees (if they exist)
-- Note: Adding feedback assuming employees 31, 32, 33 exist
INSERT INTO manager_feedbacks (manager_id, employee_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  (30, 31, 'Work Performance', 4, 'Good technical work. Continue improving communication with stakeholders.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '24 days'),
  (30, 31, 'Deadline Management', 2, 'Multiple deadlines missed this quarter. Need immediate improvement in time management.', 'negative', 'anger', NOW() - INTERVAL '14 days'),
  
  (30, 32, 'Survey Techniques', 5, 'Excellent survey techniques. Very professional and thorough approach.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '23 days'),
  (30, 32, 'Report Quality', 3, 'Survey reports need more detail. Add more context and analysis.', 'neutral', 'stress,frustration', NOW() - INTERVAL '16 days'),
  
  (30, 33, 'Technical Support', 4, 'Good technical support to the team. Very helpful and knowledgeable.', 'positive', 'support,cooperation', NOW() - INTERVAL '21 days'),
  (30, 33, 'Attendance', 3, 'Attendance patterns need improvement. More consistency is required.', 'negative', 'frustration,anger', NOW() - INTERVAL '13 days')
ON CONFLICT DO NOTHING;



-- Peer feedbacks from employees to managers
INSERT INTO peer_feedbacks (from_user_id, to_user_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Employees giving feedback to Manager Rajesh Kumar (ID 2)
  (3, 2, 'Leadership Style', 5, 'Great leadership and clear direction on projects. Appreciate the support.', 'positive', 'respect,trust', NOW() - INTERVAL '26 days'),
  (4, 2, 'Project Guidance', 4, 'Good project guidance and feedback. Sometimes need faster decision-making.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '19 days'),
  
  -- Employees giving feedback to Manager Suresh Das (ID 5)
  (6, 5, 'Manager Support', 5, 'Excellent manager support and mentorship. Very approachable and helpful.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '25 days'),
  (7, 5, 'Team Management', 3, 'Team coordination could be improved. More structured meetings would help.', 'neutral', 'disappointment', NOW() - INTERVAL '18 days'),
  
  -- Field Employees giving feedback to Field Manager Vikram Mehta (ID 9)
  (10, 9, 'Field Management', 5, 'Excellent field management and support. Always available for guidance on site.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '27 days'),
  (11, 9, 'Resource Allocation', 4, 'Good resource allocation for field work. Could improve equipment availability.', 'positive', 'support,cooperation', NOW() - INTERVAL '20 days'),
  (12, 9, 'Communication', 4, 'Clear communication on project requirements. Sometimes need quicker responses.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '24 days'),
  (13, 9, 'Team Leadership', 3, 'Leadership is good but project timelines are often unrealistic. Need better planning.', 'negative', 'stress,frustration', NOW() - INTERVAL '17 days'),
  
  -- Field Employees giving feedback to Field Manager Rajesh Singh (ID 14)
  (15, 14, 'Field Supervision', 5, 'Outstanding field supervision and technical guidance. Great mentor.', 'positive', 'respect,trust', NOW() - INTERVAL '28 days'),
  (16, 14, 'Project Planning', 4, 'Good project planning and organization. Some deadlines could be more realistic.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '21 days'),
  (17, 14, 'Manager Feedback', 4, 'Appreciate the constructive feedback. Helps improve our work quality.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '23 days');

-- Peer feedbacks between employees
INSERT INTO peer_feedbacks (from_user_id, to_user_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Feedback between HQ Employees
  (3, 4, 'Team Collaboration', 5, 'Great collaboration on embankment projects. Very reliable team member.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '22 days'),
  (4, 3, 'Technical Expertise', 4, 'Excellent technical knowledge. Always willing to help team members.', 'positive', 'support,cooperation', NOW() - INTERVAL '19 days'),
  (6, 7, 'Work Quality', 4, 'Good quality work on hydrology tasks. Very thorough and detailed.', 'positive', 'respect,trust', NOW() - INTERVAL '24 days'),
  (7, 6, 'Design Skills', 3, 'Design work is good but sometimes lacks innovation. Could be more creative.', 'neutral', 'disappointment', NOW() - INTERVAL '16 days'),
  
  -- Feedback between Field Employees (Assam Team)
  (10, 11, 'Field Support', 5, 'Excellent support during field visits. Great team player.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '26 days'),
  (11, 10, 'Site Measurements', 4, 'Very accurate site measurements. Appreciate the attention to detail.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '20 days'),
  (12, 13, 'Project Coordination', 5, 'Outstanding project coordination skills. Makes team work easier.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '25 days'),
  (13, 12, 'Technical Knowledge', 4, 'Deep technical knowledge. Always helpful in solving complex problems.', 'positive', 'support,cooperation', NOW() - INTERVAL '18 days'),
  
  -- Feedback between Field Employees (Arunachal Pradesh Team)
  (15, 16, 'Survey Collaboration', 5, 'Great collaboration on hydrology surveys. Very professional approach.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '27 days'),
  (16, 15, 'Engineering Skills', 4, 'Excellent engineering skills. Very reliable on field assignments.', 'positive', 'respect,trust', NOW() - INTERVAL '21 days'),
  (17, 15, 'Site Management', 4, 'Good site management skills. Well organized and efficient.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '23 days'),
  (15, 17, 'Leadership', 5, 'Natural leadership abilities. Great at coordinating team efforts.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '22 days'),
  
  -- Some negative/neutral feedbacks for variety
  (8, 3, 'Communication', 2, 'Communication on project updates is poor. Often left in the dark about changes.', 'negative', 'frustration,anger', NOW() - INTERVAL '15 days'),
  (7, 8, 'Task Completion', 3, 'Tasks are completed but often with delays. Need better time management.', 'negative', 'stress,frustration', NOW() - INTERVAL '14 days'),
  (11, 12, 'Documentation', 3, 'Documentation quality varies. Sometimes lacks sufficient detail.', 'neutral', 'disappointment', NOW() - INTERVAL '17 days'),
  (16, 17, 'Timeliness', 2, 'Consistently late with survey submissions. Affects team productivity.', 'negative', 'anger,stress', NOW() - INTERVAL '13 days')
ON CONFLICT DO NOTHING;

-- Add more peer feedbacks to ensure all employees and managers have at least 2 feedbacks
INSERT INTO peer_feedbacks (from_user_id, to_user_id, regarding, rating, comment, sentiment, emotion, created_at)
VALUES
  -- Additional feedbacks for managers
  (8, 2, 'Work Environment', 4, 'Positive work environment. Appreciate the supportive culture.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '22 days'),
  
  -- Additional feedbacks for employees to reach 2 each
  (3, 6, 'Cross-team Work', 4, 'Good collaboration on cross-department projects. Professional approach.', 'positive', 'support,cooperation', NOW() - INTERVAL '20 days'),
  (4, 8, 'Documentation', 3, 'Documentation could be more detailed. Some reports lack context.', 'neutral', 'stress,frustration', NOW() - INTERVAL '16 days'),
  (6, 8, 'Report Quality', 4, 'Monthly reports are well-structured. Keep up the good work.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '21 days'),
  (8, 4, 'Technical Support', 5, 'Very helpful with technical questions. Great team member.', 'positive', 'respect,trust', NOW() - INTERVAL '23 days'),
  
  -- Additional field employee feedbacks
  (10, 13, 'Coordination', 4, 'Good coordination on field projects. Makes work easier.', 'positive', 'cooperation,trust,encouragement', NOW() - INTERVAL '24 days'),
  (11, 10, 'Field Safety', 5, 'Excellent attention to field safety protocols. Very responsible.', 'positive', 'motivation,encouragement', NOW() - INTERVAL '19 days'),
  (12, 11, 'Survey Quality', 4, 'Survey work is thorough and accurate. Maintain quality.', 'positive', 'support,cooperation', NOW() - INTERVAL '22 days'),
  (13, 12, 'Problem Solving', 5, 'Excellent problem-solving skills on field challenges.', 'positive', 'encouragement,confidence', NOW() - INTERVAL '20 days'),
  (16, 15, 'Technical Guidance', 4, 'Always available for technical guidance. Very helpful.', 'positive', 'respect,trust', NOW() - INTERVAL '24 days'),
  (17, 16, 'Data Accuracy', 3, 'Survey data accuracy needs improvement. Double-check entries.', 'negative', 'frustration,anger', NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

