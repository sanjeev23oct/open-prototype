import { prisma } from '../lib/database.js';
import {
  GenerationLog,
  CreateGenerationLogInput,
  LogStatus,
} from '../types/database.js';

export class GenerationLogRepository {
  async create(data: CreateGenerationLogInput): Promise<GenerationLog> {
    return prisma.generationLog.create({
      data,
    });
  }

  async findById(id: string): Promise<GenerationLog | null> {
    return prisma.generationLog.findUnique({
      where: { id },
    });
  }

  async findByProjectId(projectId: string, limit = 50): Promise<GenerationLog[]> {
    return prisma.generationLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByProjectIdAndPhase(projectId: string, phase: string): Promise<GenerationLog[]> {
    return prisma.generationLog.findMany({
      where: {
        projectId,
        phase,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, status: LogStatus, metadata?: any): Promise<GenerationLog> {
    return prisma.generationLog.update({
      where: { id },
      data: {
        status,
        ...(metadata && { metadata }),
      },
    });
  }

  async logStep(
    projectId: string,
    phase: string,
    stepName: string,
    explanation?: string,
    status: LogStatus = LogStatus.STARTED,
    metadata?: any
  ): Promise<GenerationLog> {
    return this.create({
      projectId,
      phase,
      stepName,
      explanation,
      status,
      metadata: metadata || {},
    });
  }

  async completeStep(id: string, explanation?: string, metadata?: any): Promise<GenerationLog> {
    return this.updateStatus(id, LogStatus.COMPLETED, {
      ...(explanation && { explanation }),
      ...metadata,
    });
  }

  async errorStep(id: string, error: string, metadata?: any): Promise<GenerationLog> {
    return this.updateStatus(id, LogStatus.ERROR, {
      error,
      ...metadata,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.generationLog.delete({
      where: { id },
    });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.generationLog.deleteMany({
      where: { projectId },
    });
  }
}