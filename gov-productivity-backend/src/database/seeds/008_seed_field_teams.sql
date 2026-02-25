

-- Team for Vikram Mehta (Field Manager - Assam, ID 9)
INSERT INTO teams (id, name, manager_id)
VALUES
  (4, 'Field Operations - Assam Team', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;

-- Team for Rajesh Singh (Field Manager - Arunachal Pradesh, ID 14)
INSERT INTO teams (id, name, manager_id)
VALUES
  (5, 'Field Operations - Arunachal Pradesh Team', 14)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;

-- Team for Amitabh Das (Field Manager - Meghalaya, ID 22)
INSERT INTO teams (id, name, manager_id)
VALUES
  (6, 'Field Operations - Meghalaya Team', 22)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;

-- Team for Sanjay Verma (Field Manager - Manipur, ID 26)
INSERT INTO teams (id, name, manager_id)
VALUES
  (7, 'Field Operations - Manipur Team', 26)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  manager_id = EXCLUDED.manager_id;


-- Employees for Vikram Mehta (Assam, Team 4)
-- Employees: 10, 11, 12, 13, 18, 19, 20, 21
INSERT INTO team_members (team_id, user_id) VALUES
  (4, 10), (4, 11), (4, 12), (4, 13),
  (4, 18), (4, 19), (4, 20), (4, 21)
ON CONFLICT DO NOTHING;

-- Employees for Rajesh Singh (Arunachal Pradesh, Team 5)
-- Employees: 15, 16, 17
INSERT INTO team_members (team_id, user_id) VALUES
  (5, 15), (5, 16), (5, 17)
ON CONFLICT DO NOTHING;

-- Employees for Amitabh Das (Meghalaya, Team 6)
-- Employees: 23, 24, 25
INSERT INTO team_members (team_id, user_id) VALUES
  (6, 23), (6, 24), (6, 25)
ON CONFLICT DO NOTHING;

-- Employees for Sanjay Verma (Manipur, Team 7)
-- Employees: 27, 28, 29
INSERT INTO team_members (team_id, user_id) VALUES
  (7, 27), (7, 28), (7, 29)
ON CONFLICT DO NOTHING;



