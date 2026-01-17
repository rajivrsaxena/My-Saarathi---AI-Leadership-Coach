
export enum FeedbackTone {
  Direct = 'Direct',
  Supportive = 'Supportive',
  Empathetic = 'Empathetic',
  Analytical = 'Analytical'
}

export type LeadershipPersona = 'Direct Coach' | 'Empathetic Mentor' | 'Strategic Advisor';
export type CoachingMode = 'Manager' | 'Self';
export type SharePermission = 'view' | 'edit';
export type AppLanguage = 'English' | 'Hinglish' | 'Tamil' | 'Malayalam' | 'Gujarati' | 'Kannada' | 'Bengali';

// Defined SentimentType for psychological profiling
export type SentimentType = 'Eager' | 'Anxious' | 'Focused' | 'Stressed' | 'Burnout' | 'Curious';

export interface Metric {
  label: string;
  value: number;
  target: number;
  unit: string;
  history?: number[]; 
}

export interface SubjectiveObservation {
  type: 'Positive' | 'Improvement';
  description: string;
}

export interface PerformanceData {
  employeeName: string;
  role: string;
  metrics: Metric[];
  observations: SubjectiveObservation[];
  context?: string;
  sentiment: SentimentType;
  sentimentNotes: string;
}

export interface CoachingAction {
  task: string;
  deadline: string;
  supportNeeded: string;
}

export interface CoachingReport {
  id: string;
  timestamp: string;
  overallAssessment: string;
  empathyNote: string;
  performanceGapAnalysis: string;
  sentimentInsight: string;
  coachingConversationStarters: string[];
  actionPlan: CoachingAction[];
  n8nPayload: string;
  learningSources?: string[];
  references?: string[]; 
  metricSnapshot?: PerformanceData; 
}

export interface EmployeeRecord {
  id: string;
  data: PerformanceData;
  reports: CoachingReport[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SharedState {
  data: PerformanceData;
  report: CoachingReport | null;
  persona: LeadershipPersona;
  permission: SharePermission;
}

export interface PersistentStorage {
  version: number;
  records: EmployeeRecord[];
}
