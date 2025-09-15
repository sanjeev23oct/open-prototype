import { Prisma } from '@prisma/client';

// Generated types from Prisma
export type User = Prisma.UserGetPayload<{}>;
export type Project = Prisma.ProjectGetPayload<{}>;
export type GenerationPlan = Prisma.GenerationPlanGetPayload<{}>;
export type CodeSection = Prisma.CodeSectionGetPayload<{}>;
export type GenerationLog = Prisma.GenerationLogGetPayload<{}>;

// Extended types with relations
export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    user: true;
    generationPlans: true;
    codeSections: true;
    generationLogs: true;
  };
}>;

export type ProjectWithSections = Prisma.ProjectGetPayload<{
  include: {
    codeSections: {
      orderBy: {
        orderIndex: 'asc';
      };
    };
  };
}>;

export type ProjectWithLatestPlan = Prisma.ProjectGetPayload<{
  include: {
    generationPlans: {
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
    };
  };
}>;

// Enums
export { ProjectStatus, SectionType, LogStatus } from '@prisma/client';

// Input types for creation
export type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateCodeSectionInput = Omit<CodeSection, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateGenerationPlanInput = Omit<GenerationPlan, 'id' | 'createdAt'>;
export type CreateGenerationLogInput = Omit<GenerationLog, 'id' | 'createdAt'>;

// Update types
export type UpdateProjectInput = Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateCodeSectionInput = Partial<Omit<CodeSection, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;