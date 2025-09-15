import { Router } from 'express';
import { PlanGenerationService } from '../services/plan-generation.service.js';
import { CodeGenerationService } from '../services/code-generation.service.js';
import { LLMService } from '../services/llm.service.js';
import { WebSocketService } from '../websocket/websocket-server.js';

const router = Router();

// Initialize services
const llmService = new LLMService();
const planService = new PlanGenerationService(llmService);
const wsService = new WebSocketService();
const codeService = new CodeGenerationService(llmService, wsService);

// Generate plan from prompt
router.post('/plan', async (req, res) => {
  try {
    const { prompt, preferences } = req.body;
    
    if (!prompt || !preferences) {
      return res.status(400).json({ 
        error: 'Missing required fields: prompt and preferences' 
      });
    }

    const plan = await planService.generatePlan(prompt, preferences);
    
    res.json(plan);
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start code generation from plan
router.post('/code', async (req, res) => {
  try {
    const { planId, plan, preferences } = req.body;
    
    if (!plan || !preferences) {
      return res.status(400).json({ 
        error: 'Missing required fields: plan and preferences' 
      });
    }

    // Start generation (this will stream via WebSocket)
    const projectId = planId || 'temp-project';
    const userId = 'hardcoded-user'; // TODO: Get from auth
    
    // Start async generation
    codeService.generateCode(plan, preferences, projectId, userId)
      .catch(error => {
        console.error('Code generation error:', error);
      });
    
    res.json({ 
      message: 'Code generation started',
      projectId,
      status: 'generating'
    });
  } catch (error) {
    console.error('Code generation start error:', error);
    res.status(500).json({ 
      error: 'Failed to start code generation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get generation status
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement status tracking
    res.json({ 
      projectId: id,
      status: 'completed',
      progress: 100
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to get generation status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export generated files
router.post('/export', async (req, res) => {
  try {
    const { projectId, format = 'zip' } = req.body;
    
    // TODO: Implement file export
    res.json({ 
      message: 'Export functionality coming soon',
      projectId,
      format
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Failed to export files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as generationRoutes };