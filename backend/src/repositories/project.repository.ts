import { prisma } from '../lib/database.js';
import {
  Project,
  ProjectWithRelations,
  ProjectWithSections,
  ProjectWithLatestPlan,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
} from '../types/database.js';

export class ProjectRepository {
  async create(data: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data,
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(id: string): Promise<ProjectWithRelations | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        generationPlans: {
          orderBy: { createdAt: 'desc' },
        },
        codeSections: {
          orderBy: { orderIndex: 'asc' },
        },
        generationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit logs for performance
        },
      },
    });
  }

  async findByIdWithSections(id: string): Promise<ProjectWithSections | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        codeSections: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findByIdWithLatestPlan(id: string): Promise<ProjectWithLatestPlan | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        generationPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findByUserId(userId: string, limit = 20, offset = 0): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.project.count({
      where: { userId },
    });
  }
}