import { prisma } from '../lib/database.js';
import {
  CodeSection,
  CreateCodeSectionInput,
  UpdateCodeSectionInput,
  SectionType,
} from '../types/database.js';

export class CodeSectionRepository {
  async create(data: CreateCodeSectionInput): Promise<CodeSection> {
    return prisma.codeSection.create({
      data,
    });
  }

  async createMany(data: CreateCodeSectionInput[]): Promise<{ count: number }> {
    return prisma.codeSection.createMany({
      data,
    });
  }

  async findById(id: string): Promise<CodeSection | null> {
    return prisma.codeSection.findUnique({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<CodeSection[]> {
    return prisma.codeSection.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findByProjectIdAndType(projectId: string, sectionType: SectionType): Promise<CodeSection[]> {
    return prisma.codeSection.findMany({
      where: {
        projectId,
        sectionType,
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findByElementId(elementId: string): Promise<CodeSection | null> {
    return prisma.codeSection.findFirst({
      where: { elementId },
    });
  }

  async update(id: string, data: UpdateCodeSectionInput): Promise<CodeSection> {
    return prisma.codeSection.update({
      where: { id },
      data,
    });
  }

  async updateContent(id: string, codeContent: string): Promise<CodeSection> {
    return prisma.codeSection.update({
      where: { id },
      data: {
        codeContent,
        updatedAt: new Date(),
      },
    });
  }

  async updateByElementId(elementId: string, data: UpdateCodeSectionInput): Promise<CodeSection> {
    return prisma.codeSection.updateMany({
      where: { elementId },
      data,
    }).then(() => this.findByElementId(elementId)!);
  }

  async delete(id: string): Promise<void> {
    await prisma.codeSection.delete({
      where: { id },
    });
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.codeSection.deleteMany({
      where: { projectId },
    });
  }

  async reorderSections(projectId: string, sectionIds: string[]): Promise<void> {
    const updates = sectionIds.map((id, index) =>
      prisma.codeSection.update({
        where: { id },
        data: { orderIndex: index },
      })
    );

    await prisma.$transaction(updates);
  }
}