
export type BusinessArea = string;

export interface SolutionStep {
    step: number;
    title: string;
    description: string;
}

export interface Solution {
    title: string;
    summary: string;
    steps: SolutionStep[];
    isPremium?: boolean;
}

export interface AnalysisResult {
    problemAnalysis: {
        identifiedProblem: string;
        impact: string;
    };
    shortTermSolution: Solution;
    longTermSolution: Solution;
}

export interface GroundedAnswer {
    answer: string;
    sources: { uri: string; title: string; }[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface Example {
    id: string;
    title: string;
    description: string;
    area: BusinessArea;
}

export interface SolutionRecord {
  id: string;
  companyType: string;
  niche: string;
  problemDescription: string;
  businessArea: BusinessArea;
  result: AnalysisResult | GroundedAnswer;
  timestamp: string;
}

export interface BusinessAreaConfig {
    id: string;
    label: string;
    group: 'Digital' | 'Tradicional';
}

export interface AppConfig {
    appName: string;
    appDescription: string;
    footerText: string;
    aiSystemInstruction: string;
    chatSystemInstruction: string;
    examples: Example[];
    businessAreas: BusinessAreaConfig[];
}
