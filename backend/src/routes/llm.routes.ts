import { Router } from 'express';
import { LLMFactory } from '../services/llm-factory.service.js';

const router = Router();

// Initialize services using factory
const llmFactory = LLMFactory.getInstance();

// Get available models
router.get('/models', async (req, res) => {
  try {
    const models = llmFactory.getAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ 
      error: 'Failed to get available models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update LLM configuration
router.put('/config', async (req, res) => {
  try {
    const config = req.body;
    
    // Validate config
    if (!config.gatewayUrl || !config.model) {
      return res.status(400).json({ 
        error: 'Missing required fields: gatewayUrl and model' 
      });
    }

    llmFactory.updateConfig(config);
    
    res.json({ 
      message: 'Configuration updated successfully',
      config: {
        gatewayUrl: config.gatewayUrl,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      }
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ 
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test LLM connection
router.post('/test', async (req, res) => {
  try {
    const testResult = await llmFactory.testConnection();
    
    if (testResult.success) {
      res.json({ 
        success: true,
        message: 'Connection test successful'
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'Connection test failed',
        message: testResult.error
      });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(400).json({ 
      success: false,
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const healthResult = await llmFactory.healthCheck();
    
    res.json({
      status: healthResult.status,
      details: healthResult.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as llmRoutes };