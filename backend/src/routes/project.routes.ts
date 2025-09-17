import { Router } from 'express';
import { ProjectRepository } from '../repositories/project.repository.js';
import { CodeSectionRepository } from '../repositories/code-section.repository.js';

const router = Router();

// Initialize repositories
const projectRepo = new ProjectRepository();
const codeSectionRepo = new CodeSectionRepository();

// Get all projects (for hardcoded user)
router.get('/', async (req, res) => {
  try {
    const userId = 'hardcoded-user'; // TODO: Get from auth
    const projects = await projectRepo.findByUserId(userId);
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      error: 'Failed to get projects',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description, prompt, preferences } = req.body;
    const userId = 'hardcoded-user'; // TODO: Get from auth
    
    if (!name || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required fields: name and prompt' 
      });
    }

    const project = await projectRepo.create({
      userId,
      name,
      description,
      prompt,
      preferences: preferences || {},
      status: 'draft'
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectRepo.findById(id);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ 
      error: 'Failed to get project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const project = await projectRepo.update(id, updates);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      error: 'Failed to update project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await projectRepo.delete(id);
    
    res.json({ 
      message: 'Project deleted successfully' 
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      error: 'Failed to delete project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get project code sections
router.get('/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    const sections = await codeSectionRepo.findByProjectId(id);
    
    res.json(sections);
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ 
      error: 'Failed to get code sections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add code section to project
router.post('/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionName, sectionType, codeContent, documentation } = req.body;
    
    if (!sectionName || !sectionType || !codeContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: sectionName, sectionType, codeContent' 
      });
    }

    const section = await codeSectionRepo.create({
      projectId: id,
      sectionName,
      sectionType,
      codeContent,
      documentation,
      orderIndex: 0
    });
    
    res.status(201).json(section);
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ 
      error: 'Failed to create code section',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get complete HTML for project
router.get('/:id/html', async (req, res) => {
  try {
    const { id } = req.params;
    const sections = await codeSectionRepo.findByProjectId(id);
    
    // Find the complete HTML section
    const completeHTML = sections.find(s => s.sectionName === 'complete-html');
    
    if (!completeHTML) {
      return res.status(404).json({ 
        error: 'Complete HTML not found for this project' 
      });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(completeHTML.codeContent);
  } catch (error) {
    console.error('Get HTML error:', error);
    res.status(500).json({ 
      error: 'Failed to get HTML',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as projectRoutes };