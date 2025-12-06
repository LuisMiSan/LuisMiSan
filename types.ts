
export interface AutomationIdea {
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  tools: string[];
  implementationSteps: string[];
}

export interface CompanyProfile {
  name: string;
  industry: string;
  summary: string;
  employeeCountEstimate: string;
  aiMaturityLevel: 'None' | 'Beginner' | 'Intermediate' | 'Advanced';
  keyChallenges: string[];
}

export interface AnalysisResult {
  profile: CompanyProfile;
  automations: AutomationIdea[];
  sources: { uri: string; title: string }[];
}

export interface SavedAnalysis {
  id: string;
  timestamp: number;
  url: string;
  result: AnalysisResult;
}

export interface AdminSettings {
  roleDefinition: string;
  techFocus: string;
  customInstructions: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type Language = 'es' | 'en';

export type DownloadFormat = 'pdf' | 'word' | 'markdown' | 'txt' | 'html' | 'json';
