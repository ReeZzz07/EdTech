export type DiagnosisStepAI = {
  stepNumber: number;
  description: string;
  isCorrect: boolean;
  studentWork?: string;
  feedback?: string;
  errorType?: "computational" | "conceptual" | "methodical";
};

export type ErrorAnalysisAI = { message: string; type?: string };
export type RecommendationAI = { title: string; action?: string };
export type SkillAssessmentAI = { skillId: string; score: number; note?: string };

export type DiagnosisResultAI = {
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  originalText?: string;
  correctSolution: string;
  explanation: string;
  overallScore: number;
  steps: DiagnosisStepAI[];
  errors: ErrorAnalysisAI[];
  recommendations: RecommendationAI[];
  skillAssessment: SkillAssessmentAI[];
  coinsBase: number;
};
