export interface GenerationPlan {
  id: string;
  components: ComponentPlan[];
  architecture: ArchitecturePlan;
  timeline: {
    estimatedMinutes: number;
    phases: string[];
  };
  dependencies: string[];
  approved: boolean;
  createdAt: Date;
}

export interface ComponentPlan {
  id: string;
  name: string;
  type: 'layout' | 'component' | 'feature' | 'utility';
  description: string;
  dependencies: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface ArchitecturePlan {
  framework: string;
  styling: string;
  structure: string;
  responsive: boolean;
}

export interface OrganizedHTML {
  sections: {
    header: HTMLSection;
    navigation: HTMLSection;
    main: HTMLSection;
    footer: HTMLSection;
    styles: CSSSection;
    scripts: JSSection;
  };
  elementMap: Map<string, ElementLocation>;
}

export interface HTMLSection {
  content: string;
  startLine: number;
  endLine: number;
  elements: Array<{
    id: string;
    type: string;
    content: string;
  }>;
}

export interface CSSSection {
  content: string;
  startLine: number;
  endLine: number;
  rules: Array<{
    selector: string;
    properties: string;
  }>;
}

export interface JSSection {
  content: string;
  startLine: number;
  endLine: number;
  functions: Array<{
    name: string;
    content: string;
  }>;
}

export interface ElementLocation {
  sectionName: string;
  startLine: number;
  endLine: number;
  elementId: string;
  elementType: string;
}

export interface PatchResult {
  success: boolean;
  updatedContent?: string;
  patches?: string;
  affectedLines?: number[];
  elementId?: string;
  sectionName?: string;
  error?: string;
}

export interface ElementPatch {
  elementSelector: string;
  patchData: string;
  oldContent: string;
  newContent: string;
  timestamp: Date;
}

export interface ComponentDocumentation {
  id: string;
  sectionId: string;
  sectionName: string;
  title: string;
  description: string;
  features: string[];
  customization: Array<{
    step: string;
    instruction: string;
  }>;
  dependencies: string[];
  examples: Array<{
    title: string;
    code: string;
  }>;
  createdAt: Date;
}