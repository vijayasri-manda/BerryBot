export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface ProjectItem {
  title: string;
  technologies: string[];
  description: string;
  key_highlights: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  grade_or_gpa: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  responsibilities: string[];
}

export interface SkillsCategorized {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools_and_platforms: string[];
  other: string[];
}

export interface ParsedResumeData {
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  summary?: string;
  skills: SkillsCategorized;
  projects: ProjectItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  topics_to_explore: string[];
}

export interface ResumeOut {
  id: number;
  user_id: number;
  filename: string;
  file_size: number;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  summary?: string;
  parsed_data: ParsedResumeData;
  created_at: string;
}

export interface QuestionOut {
  id: number;
  session_id: number;
  order_index: number;
  category: string;
  question_text: string;
  question_text_en?: string;
  audio_caption?: string;
  is_follow_up: boolean;
  candidate_answer?: string;
  answer_input_type?: string;
  score_overall: number;
  score_technical?: number;
  score_relevance?: number;
  score_depth?: number;
  score_problem_solving?: number;
  score_clarity?: number;
  feedback_justification?: string;
  strengths?: string;
  missing_concepts?: string;
  ideal_answer_summary?: string;
  answered_at?: string;
}

export interface LearningRecommendation {
  topic: string;
  description: string;
  resources: string[];
  priority: 'High' | 'Medium' | 'Low';
}

export interface InterviewSession {
  id: number;
  user_id: number;
  resume_id?: number;
  job_role: string;
  experience_level: string;
  interview_type: string;
  language: string;
  duration_minutes: number;
  total_questions: number;
  current_question_index: number;
  status: 'configured' | 'in_progress' | 'paused' | 'completed';
  job_description?: string;
  overall_score: number;
  technical_score: number;
  relevance_score: number;
  depth_score: number;
  problem_solving_score: number;
  clarity_score: number;
  resume_match_score: number;
  recommendation?: string;
  recommendation_justification?: string;
  strengths_summary?: string;
  knowledge_gaps_summary?: string;
  learning_recommendations_json?: string;
  recruiter_override_score?: number;
  recruiter_override_recommendation?: string;
  recruiter_notes?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  questions: QuestionOut[];
}

export interface FullInterviewReport {
  session_id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  job_role: string;
  experience_level: string;
  interview_type: string;
  language: string;
  created_at: string;
  completed_at?: string;
  duration_minutes: number;
  overall_score: number;
  technical_score: number;
  relevance_score: number;
  depth_score: number;
  problem_solving_score: number;
  clarity_score: number;
  resume_match_score: number;
  rubric_weights: Record<string, number>;
  recommendation: string;
  recommendation_justification: string;
  strengths_summary: string;
  knowledge_gaps_summary: string;
  learning_recommendations: LearningRecommendation[];
  recruiter_override_score?: number;
  recruiter_override_recommendation?: string;
  recruiter_notes?: string;
  reviewed_at?: string;
  questions: QuestionOut[];
}

export interface RecruiterCandidateItem {
  session_id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  job_role: string;
  experience_level: string;
  language: string;
  overall_score: number;
  effective_score: number;
  recommendation: string;
  effective_recommendation: string;
  status: string;
  created_at: string;
  is_reviewed: boolean;
}

export type AvatarMood = 'neutral' | 'greeting' | 'speaking' | 'listening' | 'thinking';
