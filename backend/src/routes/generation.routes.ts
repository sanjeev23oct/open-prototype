import { Router } from 'express';
import { PlanGenerationService } from '../services/plan-generation.service.js';
import { CodeGenerationService } from '../services/code-generation.service.js';
import { LLMService } from '../services/llm.service.js';
import { LLMConfig } from '../types/llm.js';
import { WSServer } from '../websocket/websocket-server.js';

const router = Router();

// Initialize services with default config
const defaultLLMConfig: LLMConfig = {
  gatewayUrl: process.env.LITELLM_GATEWAY_URL || 'http://localhost:4000',
  apiKey: process.env.LITELLM_API_KEY || '',
  model: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
  maxTokens: 4000,
  temperature: 0.7,
  stream: false
};

const llmService = new LLMService(defaultLLMConfig);
const planService = new PlanGenerationService(llmService);
// WebSocket service will be injected from main server
let wsService: WSServer | null = null;
// Code service will be initialized when WebSocket is available
let codeService: CodeGenerationService | null = null;

// Function to initialize services with WebSocket
export const initializeGenerationServices = (ws: WSServer) => {
  wsService = ws;
  codeService = new CodeGenerationService(llmService, wsService);
};

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

// Approve plan
router.put('/plan/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Approve plan route hit with ID:', id);
    
    // For now, just return success since we don't have persistent storage
    // In a real app, this would update the plan's approved status in the database
    res.json({ 
      message: 'Plan approved successfully',
      planId: id,
      approved: true
    });
  } catch (error) {
    console.error('Plan approval error:', error);
    res.status(500).json({ 
      error: 'Failed to approve plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start code generation from plan
router.post('/code', async (req, res) => {
  try {
    const { planId, plan, preferences } = req.body;
    
    if (!planId) {
      return res.status(400).json({ 
        error: 'Missing required field: planId' 
      });
    }

    // For now, we'll use mock plan and preferences if not provided
    // In a real app, we'd fetch the plan from database using planId
    const mockPlan = plan || {
      id: planId,
      title: 'Generated Plan',
      description: 'Auto-generated plan for code generation',
      components: [],
      architecture: 'Standard web application',
      timeline: '2-3 hours'
    };

    const mockPreferences = preferences || {
      framework: 'react',
      styling: 'tailwind',
      complexity: 'medium'
    };

    // Start generation (this will stream via WebSocket)
    const projectId = planId;
    const userId = 'hardcoded-user'; // TODO: Get from auth
    
    // Start async generation
    if (codeService) {
      codeService.generateCode(mockPlan, mockPreferences, projectId, userId)
        .catch(error => {
          console.error('Code generation error:', error);
        });
    } else {
      throw new Error('Code generation service not initialized');
    }
    
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

// Debug route to catch unmatched paths
router.all('*', (req, res) => {
  console.log('Unmatched generation route:', req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    message: `Generation route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'POST /plan',
      'PUT /plan/:id/approve', 
      'POST /code',
      'GET /status/:id',
      'POST /export'
    ]
  });
});

export { router as generationRoutes };