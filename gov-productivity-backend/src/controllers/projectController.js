const projectService = require('../services/projectService');

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user.id, req.user.role);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

const listProjects = async (req, res, next) => {
  try {
    const includeDetails = req.query.includeDetails === 'true';
    const projects = await projectService.listProjects(req.user.id, req.user.role, includeDetails);
    
    // Debug: Log first project to verify budget and milestones
    if (projects && projects.length > 0) {
      const firstProject = projects[0];
      console.log('First project in response:', {
        id: firstProject.id,
        name: firstProject.name,
        budget: firstProject.budget,
        budgetType: typeof firstProject.budget,
        milestonesCount: firstProject.milestones ? firstProject.milestones.length : 'undefined',
        milestones: firstProject.milestones ? firstProject.milestones.map(m => ({ id: m.id, name: m.name })) : 'none'
      });
    }
    
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      Number(req.params.id), 
      req.body, 
      req.user.id, 
      req.user.role
    );
    res.json(project);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  listProjects,
  updateProject,
};

