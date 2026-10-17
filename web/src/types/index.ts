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
  live_url?: string;
  primary_language?: string;
  github_repo_id?: number;
  project_type: ProjectType;
  status: ProjectStatus;
  goal?: string;
  needs_review: boolean;
  is_starred?: boolean;
  is_hidden?: boolean;
  order_index?: number;
  progress_percentage: number;
  total_features: number;
  completed_features: number;
  stars_count: number;
  created_at: string;
  updated_at: string;
}

export interface BatchReorderItem {
  id: string;
  order_index: number;
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
  raw_message?: string;
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

export interface ParsedConcept {
  title: string;
  elevator_pitch: string;
  target_tech_stack: string;
  project_type: ProjectType;
  priority: FutureProjectPriority;
  notes?: string;
  raw_message?: string;
  starter_features: string[];
  provider_used?: string;
}


export interface SubAgentResearcher {
  content: string;
}

export interface SubAgentJudge {
  score: number;
  verdict_signal: 'BUILD_NOW' | 'PROCEED_WITH_CAUTION' | 'DO_NOT_BUILD';
  verdict_title: string;
  brutal_critique: string;
  failure_modes: string[];
  what_to_build_instead: string;
  summary_verdict: string;
}

export interface SubAgentPlanner {
  content: string;
  suggested_features: {
    title: string;
    priority: string;
    description: string;
  }[];
}

export interface SubAgentPivotPlan {
  alternative_title: string;
  content: string;
  suggested_features: {
    title: string;
    priority: string;
    description: string;
  }[];
}

export interface SubAgentData {
  is_pipeline?: boolean;
  executive_summary?: string;
  researcher?: SubAgentResearcher;
  judge?: SubAgentJudge;
  planner?: SubAgentPlanner;
  pivot_plan?: SubAgentPivotPlan;
}

export interface RagCitation {
  id?: string;
  title: string;
  entity_type?: string;
  project_name?: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  is_feature_pitch?: boolean;
  subagent_data?: SubAgentData;
  citations?: RagCitation[];
  tier_used?: string;
  created_at: string;
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
  mode: string;
  response: string;
  raw_content: string;
  citations: RagCitation[];
  judge_data?: SubAgentJudge;
  suggested_features?: {
    title: string;
    priority: string;
    description: string;
  }[];
  subagent_data?: SubAgentData;
  tier_used: string;
}

export interface ChatRequest {
  message: string;
  mode?: string;
  project_id?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}
