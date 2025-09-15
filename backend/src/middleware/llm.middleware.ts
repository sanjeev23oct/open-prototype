import { Request, Response, NextFunction } from 'express';
import { LLMFactory } from '../services/llm-factory.service.js';
import { GenerationPreferences } from '../types/llm.js';

export interface LLMRequest extends Request {
  llmService?: any;
  preferences?: GenerationPreferences;
}

/**
 * Middleware to validate and attach LLM service to request
 */
export const validateLLMConfig = async (
  req: LLMRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const factory = LLMFactory.getInstance();
    const validation = factory.validateConfig();

    if (!validation.valid) {
      res.status(400).json({
        error: 'Invalid LLM configuration',
        details: validation.errors,
      });
      return;
    }

    // Attach LLM service to request
    req.llmService = factory.getLLMService();
    next();
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to initialize LLM service',
      details: error.message,
    });
  }
};

/**
 * Middleware to validate generation preferences
 */
export const validatePreferences = (
  req: LLMRequest,
  res: Response,
  next: NextFunction
): void => {
  const { preferences } = req.body;

  if (!preferences) {
    res.status(400).json({
      error: 'Generation preferences are required',
    });
    return;
  }

  // Validate preferences structure
  const requiredFields = ['outputType', 'framework', 'styling', 'responsive', 'accessibility'];
  const missingFields = requiredFields.filter(field => !(field in preferences));

  if (missingFields.length > 0) {
    res.status(400).json({
      error: 'Missing required preference fields',
      details: missingFields,
    });
    return;
  }

  // Validate enum values
  const validOutputTypes = ['html-js', 'react'];
  const validFrameworks = ['vanilla', 'react', 'vue'];
  const validStyling = ['tailwind', 'css', 'styled-components'];

  if (!validOutputTypes.includes(preferences.outputType)) {
    res.status(400).json({
      error: 'Invalid outputType',
      validValues: validOutputTypes,
    });
    return;
  }

  if (!validFrameworks.includes(preferences.framework)) {
    res.status(400).json({
      error: 'Invalid framework',
      validValues: validFrameworks,
    });
    return;
  }

  if (!validStyling.includes(preferences.styling)) {
    res.status(400).json({
      error: 'Invalid styling',
      validValues: validStyling,
    });
    return;
  }

  if (typeof preferences.responsive !== 'boolean') {
    res.status(400).json({
      error: 'responsive must be a boolean',
    });
    return;
  }

  if (typeof preferences.accessibility !== 'boolean') {
    res.status(400).json({
      error: 'accessibility must be a boolean',
    });
    return;
  }

  req.preferences = preferences;
  next();
};

/**
 * Middleware to handle LLM service errors
 */
export const handleLLMErrors = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('LLM Service Error:', error);

  // Handle specific LLM errors
  if (error.response?.status === 401) {
    res.status(401).json({
      error: 'LLM API authentication failed',
      details: 'Check your API key configuration',
    });
    return;
  }

  if (error.response?.status === 429) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      details: 'Too many requests to LLM service',
      retryAfter: error.response.headers['retry-after'] || 60,
    });
    return;
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    res.status(503).json({
      error: 'LLM service unavailable',
      details: 'Cannot connect to LLM gateway',
    });
    return;
  }

  if (error.code === 'ETIMEDOUT') {
    res.status(504).json({
      error: 'LLM request timeout',
      details: 'Request to LLM service timed out',
    });
    return;
  }

  // Generic error
  res.status(500).json({
    error: 'LLM service error',
    details: error.message || 'Unknown error occurred',
  });
};

/**
 * Middleware to check LLM service health
 */
export const checkLLMHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const factory = LLMFactory.getInstance();
    const health = await factory.healthCheck();

    if (health.status === 'unhealthy') {
      res.status(503).json({
        error: 'LLM service unhealthy',
        details: health.details,
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(503).json({
      error: 'Health check failed',
      details: error.message,
    });
  }
};