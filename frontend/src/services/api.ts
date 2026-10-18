import { User, ResumeOut, InterviewSession, FullInterviewReport, RecruiterCandidateItem, QuestionOut } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('berry_bot_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Authentication
  async register(data: { email: string; password: string; full_name: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed. Please check credentials.');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Resumes
  async uploadResume(file: File): Promise<ResumeOut> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload and parse resume');
    }
    return res.json();
  },

  async loadSampleResume(sampleKey: string): Promise<ResumeOut> {
    const res = await fetch(`${API_BASE}/resumes/sample/${sampleKey}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load sample resume');
    }
    return res.json();
  },

  async getResume(resumeId: number): Promise<ResumeOut> {
    const res = await fetch(`${API_BASE}/resumes/${resumeId}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to retrieve resume');
    return res.json();
  },

  async updateResume(resumeId: number, data: any): Promise<ResumeOut> {
    const res = await fetch(`${API_BASE}/resumes/${resumeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update resume details');
    return res.json();
  },

  async deleteResume(resumeId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete resume');
    return res.json();
  },

  // Interviews
  async createInterview(config: {
    job_role: string;
    experience_level: string;
    interview_type: string;
    language: string;
    duration_minutes: number;
    resume_id?: number;
    job_description?: string;
  }): Promise<InterviewSession> {
    const res = await fetch(`${API_BASE}/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create interview session');
    }
    return res.json();
  },

  async getInterview(interviewId: number): Promise<InterviewSession> {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch interview session');
    return res.json();
  },

  async startInterview(interviewId: number) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/start`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to start interview');
    return res.json();
  },

  async submitAnswer(interviewId: number, data: { answer_text: string; input_type: string; audio_duration_seconds: number }) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to evaluate answer');
    }
    return res.json();
  },

  async nextQuestion(interviewId: number): Promise<{ is_completed: boolean; status: string; current_question_index: number; next_question?: QuestionOut; overall_score?: number; recommendation?: string }> {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/next-question`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to advance question');
    return res.json();
  },

  async pauseInterview(interviewId: number) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/pause`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async resumeInterview(interviewId: number) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/resume`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async endInterview(interviewId: number) {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/end`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getInterviewReport(interviewId: number): Promise<FullInterviewReport> {
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/report`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to load interview report');
    return res.json();
  },

  async getInterviewHistory(): Promise<InterviewSession[]> {
    const res = await fetch(`${API_BASE}/interviews/history`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch interview history');
    return res.json();
  },

  // Recruiter Endpoints
  async getInterviewPolicy(): Promise<{ question_count: number }> {
    const res = await fetch(`${API_BASE}/interviews/policy`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Unable to load the HR interview settings. Please try again.');
    return res.json();
  },

  async updateInterviewPolicy(question_count: number): Promise<{ question_count: number }> {
    const res = await fetch(`${API_BASE}/recruiter/interview-policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ question_count }),
    });
    if (!res.ok) throw new Error('Unable to save interview settings. Choose 3 to 10 questions and try again.');
    return res.json();
  },

  async getRecruiterCandidates(params?: { search?: string; role?: string; recommendation?: string }): Promise<RecruiterCandidateItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.recommendation) query.append('recommendation', params.recommendation);

    const res = await fetch(`${API_BASE}/recruiter/candidates?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch recruiter candidate list');
    return res.json();
  },

  async overrideCandidateEvaluation(sessionId: number, data: { override_score?: number; override_recommendation?: string; recruiter_notes: string }) {
    const res = await fetch(`${API_BASE}/recruiter/sessions/${sessionId}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit recruiter override');
    }
    return res.json();
  },

  async getRubricConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/recruiter/rubrics`, {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async updateRubricConfig(config: any): Promise<any> {
    const res = await fetch(`${API_BASE}/recruiter/rubrics`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update rubric config');
    }
    return res.json();
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/recruiter/audit-logs`, {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }
};
