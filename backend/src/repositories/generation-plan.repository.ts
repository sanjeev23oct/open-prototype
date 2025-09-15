import { prisma } from '../lib/database.js';
import {
  GenerationPlan,
  CreateGenerationPlanInput,
} from '../types/database.js';

export class GenerationPlanRepository {
  async create(data: CreateGenerationPlanInput): Promise<GenerationPlan> {
    return prisma.generationPlan.create({
      data,
    });
  }

  async findById(id: string): Promise<GenerationPlan | null> {
    return prisma.generationPlan.findUnique({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<GenerationPlan[]> {
    return prisma.generationPlan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestByProjectId(projectId: string): Promise<GenerationPlan | null> {
    return prisma.generationPlan.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApprovedByProjectId(projectId: string): Promise<GenerationPlan | null> {
    return prisma.generationPlan.findFirst({
      where: {
        projectId,
        approved: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string): Promise<GenerationPlan> {
    return prisma.generationPlan.update({
      where: { id },
      data: { approved: true },
    });
  }

  async updatePlanData(id: string, planData: any): Promise<GenerationPlan> {
    return prisma.generationPlan.update({
      where: { id },
      data: { planData },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.generationPlan.delete({
      where: { id },
    });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.generationPlan.deleteMany({
      where: { projectId },
    });
  }
}