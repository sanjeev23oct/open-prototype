import { WebSocketHandlers } from '../websocket/websocket-handlers.js';
import { LLMFactory } from './llm-factory.service.js';
import { PlanGenerationService } from './plan-generation.service.js';
import { CodeGenerationService } from './code-generation.service.js';
import { DocumentationService } from './documentation.service.js';
import { DiffPatchService } from './diff-patch.service.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { GenerationLogRepository } from '../repositories/generation-log.repository.js';
import { GenerationPlanRepository } from '../repositories/generation-plan.repository.js';
import { CodeSectionRepository } from '../repositories/code-section.repository.js';
import { GenerationPreferences } from '../types/llm.js';
import { ProjectStatus, LogStatus } from '../types/database.js';

export class WebSocketIntegrationService {
  private wsHandlers: WebSocketHandlers;
  private llmFactory: LLMFactory;
  private planService: PlanGenerationService;
  private codeService: CodeGenerationService;
  private docService: DocumentationService;
  private diffService: DiffPatchService;
  private projectRepo: ProjectRepository;
  private logRepo: GenerationLogRepository;
  private planRepo: GenerationPlanRepository;
  private codeRepo: CodeSectionRepository;

  constructor(wsHandlers: WebSocketHandlers) {
    this.wsHandlers = wsHandlers;
    this.llmFactory = LLMFactory.getInstance();
    this.planService = new PlanGenerationService();
    this.codeService = new CodeGenerationService();
    this.docService = new DocumentationService();
    this.diffService = new DiffPatchService();
    this.projectRepo = new ProjectRepository();
    this.logRepo = new GenerationLogRepository();
    this.planRepo = new GenerationPlanRepository();
    this.codeRepo = new CodeSectionRepository();
  }

  async handleStartGeneration(
    projectId: string,
    prompt: string,
    preferences: GenerationPreferences
  ): Promise<void> {
    try {
      // Update project status
      await this.projectRepo.updateStatus(projectId, ProjectStatus.PLANNING);

      // Log generation start
      const startLog = await this.logRepo.logStep(
        projectId,
        'planning',
        'Generation Started',
        `Starting generation for project ${projectId}`,
        LogStatus.STARTED
      );

      // Send initial progress
      this.wsHandlers.sendGenerationProgress(projectId, {
        projectId,
        phase: 'planning',
        currentStep: 'Analyzing requirements',
        completedSteps: [],
        totalSteps: 5,
        explanation: 'Analyzing your requirements and creating a generation plan...',
        estimatedTimeRemaining: 300, // 5 minutes
        percentage: 0,
      });

      // Generate plan
      const plan = await this.planService.generatePlan(projectId, prompt, preferences);

      // Save plan to database
      await this.planRepo.create({
        projectId,
        planData: plan,
        approved: true, // Auto-approve for MVP
        version: 1,
      });

      // Update progress
      this.wsHandlers.sendGenerationProgress(projectId, {
        projectId,
        phase: 'planning',
        currentStep: 'Plan created',
        completedSteps: ['Analyzing requirements', 'Creating plan'],
        totalSteps: 5,
        explanation: 'Generation plan created successfully. Starting code generation...',
        estimatedTimeRemaining: 240,
        percentage: 40,
      });

      // Start code generation
      await this.generateCode(projectId, plan, preferences);

      // Complete generation
      await this.projectRepo.updateStatus(projectId, ProjectStatus.COMPLETED);
      await this.logRepo.completeStep(startLog.id, 'Generation completed successfully');

      this.wsHandlers.sendGenerationComplete(projectId, {
        projectId,
        status: 'completed',
        message: 'Your prototype has been generated successfully!',
      });

    } catch (error: any) {
      console.error('Generation failed:', error);
      
      await this.projectRepo.updateStatus(projectId, ProjectStatus.ERROR);
      
      this.wsHandlers.sendGenerationError(projectId, {
        projectId,
        error: error.message || 'Generation failed',
        recoverable: true,
        suggestions: [
          'Try simplifying your prompt',
          'Check your internet connection',
          'Contact support if the issue persists',
        ],
      });
    }
  }

  private async generateCode(
    projectId: string,
    plan: any,
    preferences: GenerationPreferences
  ): Promise<void> {
    await this.projectRepo.updateStatus(projectId, ProjectStatus.GENERATING);

    const components = plan.components || [];
    let completedComponents = 0;

    for (const component of components) {
      try {
        // Update progress
        this.wsHandlers.sendGenerationProgress(projectId, {
          projectId,
          phase: 'generating',
          currentStep: `Generating ${component.name}`,
          completedSteps: components.slice(0, completedComponents).map(c => c.name),
          totalSteps: components.length,
          explanation: `Creating ${component.name} with ${component.features.join(', ')}...`,
          estimatedTimeRemaining: (components.length - completedComponents) * 30,
          percentage: Math.round((completedComponents / components.length) * 100),
        });

        // Generate code for component
        const codeContent = await this.codeService.generateComponentCode(
          component,
          preferences,
          plan
        );

        // Save code section
        const codeSection = await this.codeRepo.create({
          projectId,
          sectionName: component.name,
          sectionType: 'COMPONENT',
          codeContent,
          orderIndex: completedComponents,
          elementId: component.id,
        });

        // Generate documentation
        const documentation = await this.docService.generateDocumentation(
          codeContent,
          component.name,
          component.features
        );

        // Update code section with documentation
        await this.codeRepo.update(codeSection.id, { documentation });

        // Send element generated event
        this.wsHandlers.sendElementGenerated(projectId, {
          elementId: component.id,
          elementType: 'component',
          htmlContent: codeContent,
          documentation,
          position: {
            sectionName: component.name,
            orderIndex: completedComponents,
          },
        });

        // Stream the generated content
        await this.wsHandlers.streamText(projectId, codeContent, {
          type: 'generating',
          elementId: component.id,
          sectionName: component.name,
          chunkSize: 50,
          delay: 20,
        });

        completedComponents++;

      } catch (error: any) {
        console.error(`Failed to generate ${component.name}:`, error);
        
        this.wsHandlers.sendGenerationError(projectId, {
          projectId,
          error: `Failed to generate ${component.name}: ${error.message}`,
          step: component.name,
          recoverable: true,
        });
      }
    }
  }

  async handleEditElement(
    projectId: string,
    elementId: string,
    editRequest: string
  ): Promise<void> {
    try {
      // Find the code section
      const codeSection = await this.codeRepo.findByElementId(elementId);
      if (!codeSection) {
        throw new Error('Element not found');
      }

      // Generate the edit
      const editedContent = await this.diffService.applyEdit(
        codeSection.codeContent,
        editRequest
      );

      // Create patch
      const patches = this.diffService.createPatch(
        codeSection.codeContent,
        editedContent
      );

      // Update the code section
      await this.codeRepo.updateContent(codeSection.id, editedContent);

      // Send patch update
      this.wsHandlers.sendPatchUpdate(projectId, {
        elementId,
        patches,
        newContent: editedContent,
        affectedSections: [codeSection.sectionName],
      });

      // Send edit complete
      this.wsHandlers.sendEditComplete(projectId, elementId, editedContent);

    } catch (error: any) {
      console.error('Edit failed:', error);
      
      this.wsHandlers.sendGenerationError(projectId, {
        projectId,
        error: `Edit failed: ${error.message}`,
        recoverable: true,
      });
    }
  }

  async handlePauseGeneration(projectId: string): Promise<void> {
    // Implementation for pausing generation
    console.log(`Pausing generation for project ${projectId}`);
    
    this.wsHandlers.sendGenerationProgress(projectId, {
      projectId,
      phase: 'generating',
      currentStep: 'Paused',
      completedSteps: [],
      totalSteps: 1,
      explanation: 'Generation has been paused',
      estimatedTimeRemaining: 0,
      percentage: 0,
    });
  }

  async handleResumeGeneration(projectId: string): Promise<void> {
    // Implementation for resuming generation
    console.log(`Resuming generation for project ${projectId}`);
    
    this.wsHandlers.sendGenerationProgress(projectId, {
      projectId,
      phase: 'generating',
      currentStep: 'Resuming',
      completedSteps: [],
      totalSteps: 1,
      explanation: 'Resuming generation...',
      estimatedTimeRemaining: 120,
      percentage: 0,
    });
  }

  // Health check for WebSocket integration
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      // Check LLM service
      const llmHealth = await this.llmFactory.healthCheck();
      if (llmHealth.status === 'unhealthy') {
        return llmHealth;
      }

      // Check WebSocket connections
      const connectionCount = this.wsHandlers.getTotalConnectionCount();
      
      return {
        status: 'healthy',
        details: `WebSocket integration healthy. ${connectionCount} active connections.`,
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: error.message || 'WebSocket integration check failed',
      };
    }
  }
}