import { Router } from 'express';
import { LLMConfigService } from '../services/llm-config.service.js';
import { LLMService } from '../services/llm.service.js';

const router = Router();

// Initialize services
const configService = new LLMConfigService();
const llmService = new LLMService();

// Get available models
router.get('/models', async (req, res) => {
  try {
    const models = await configService.getAvailableModels();
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

    await configService.updateConfig(config);
    
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
    const config = req.body;
    
    // Test connection with provided config
    const testResult = await llmService.testConnection(config);
    
    res.json({ 
      success: true,
      message: 'Connection test successful',
      model: config.model,
      responseTime: testResult.responseTime
    });
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(400).json({ 
      success: false,
      error: 'Connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stream chat completion (for testing)
router.post('/stream', async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Missing or invalid messages array' 
      });
    }

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await llmService.generateStreamingCompletion({
      messages,
      model,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1000,
      stream: true
    });

    // Handle streaming response
    stream.on('data', (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ 
      error: 'Failed to start stream',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as llmRoutes };