export interface Recipe {
  name: string;
  description: string;
  calories: number;
  ingredients: string[];
  instructions: string[];
}

export interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionAnalysis {
  calories: number;
  macros: MacroData;
  ingredients: string[];
  healthySwaps: string[];
  healthierRecipes: Recipe[];
  confidenceScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppView {
  HOME = 'HOME',
  ANALYSIS = 'ANALYSIS',
  CAMERA = 'CAMERA',
}