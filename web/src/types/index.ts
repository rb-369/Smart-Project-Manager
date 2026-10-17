export type ProjectType = 'COLLEGE' | 'RESUME' | 'PRODUCTION';
export type ProjectStatus = 'IDEATION' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type FeaturePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type FeatureStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
export type FutureProjectPriority = 'P0' | 'P1' | 'P2';
export type FutureProjectStatus = 'IDEA' | 'PLANNING' | 'PROMOTED' | 'DISCARDED';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  github_username?: string;
  avatar_url?: string;
  has_github_token: boolean;
  created_at: string;
}

export interface MongoDBStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  database: string;
  host?: string;
}

export interface Feature {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  priority: FeaturePriority;
  status: FeatureStatus;
  order_index: number;
  completed_at?: string;
  created_at: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  html_url?: string;
  primary_language?: string;
  github_repo_id?: number;
  project_type: ProjectType;
  status: ProjectStatus;
  goal?: string;
  needs_review: boolean;
  progress_percentage: number;
  total_features: number;
  completed_features: number;
  stars_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends ProjectSummary {
  features: Feature[];
  use_manual_progress: boolean;
  manual_progress_override?: number;
  readme_content?: string;
}

export interface FutureProject {
  id: string;
  title: string;
  elevator_pitch?: string;
  target_tech_stack?: string;
  project_type: ProjectType;
  priority: FutureProjectPriority;
  status: FutureProjectStatus;
  notes?: string;
  promoted_project_id?: string;
  created_at: string;
}

export interface GitHubStatus {
  is_connected: boolean;
  github_username?: string;
  total_projects_synced: number;
  needs_review_count: number;
}

export interface SuggestedFeature {
  title: string;
  description: string;
  priority: FeaturePriority;
  rationale: string;
}

export interface SuggestedProject {
  title: string;
  elevator_pitch: string;
  target_tech_stack: string;
  project_type: ProjectType;
  priority: FutureProjectPriority;
  why_this_project: string;
}

export type CopilotMode = 'planner' | 'researcher' | 'judge';

export interface JudgeVerdict {
  score: number;
  verdict: 'BUILD THIS NOW' | 'PROCEED WITH CAUTION' | 'DO NOT BUILD / REJECT';
  strengths: string[];
  fatal_flaws: string[];
  pivot_advice?: string;
  verdict_signal: 'GREEN' | 'YELLOW' | 'RED';
}

export interface RagCitation {
  id: string;
  type: string;
  title: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: CopilotMode;
  created_at: string;
  citations?: RagCitation[];
  judge_verdict?: JudgeVerdict;
  suggested_features?: SuggestedFeature[];
  suggested_projects?: SuggestedProject[];
}

export interface QdrantStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  host: string;
  collection: string;
  points_count: number;
  latency_ms?: number;
}

export interface ChatResponse {
  reply: string;
  mode: CopilotMode;
  citations: RagCitation[];
  judge_verdict?: JudgeVerdict;
  suggested_features?: SuggestedFeature[];
  suggested_projects?: SuggestedProject[];
}

export interface ChatRequest {
  message: string;
  mode: CopilotMode;
  project_id?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}
