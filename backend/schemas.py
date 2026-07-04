from pydantic import BaseModel, EmailStr
from typing import List, Optional

class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    applied_role: str
    resume: str
    matched_skills: List[str]
    phone_number: str
    status: str
    notes: Optional[str] = None
    ats_score: Optional[int] = 80
    overall_score: Optional[float] = None
    interview_summary: Optional[str] = None
    interview_recommendation: Optional[str] = None
    interview_logs: Optional[List[dict]] = None
    
    # Profile Fields (Module 3)
    user_id: Optional[int] = None
    profile_photo: Optional[str] = None
    education: Optional[List[dict]] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[dict]] = None
    projects: Optional[List[dict]] = None
    certifications: Optional[List[str]] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    resume_filename: Optional[str] = None
    location: Optional[str] = None
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    expected_salary: Optional[str] = None
    work_preference: Optional[str] = None
    recruiter_notes: Optional[str] = None
    recruiter_verdict: Optional[str] = None
    recruiter_verdict_reason: Optional[str] = None
    missing_skills: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    ai_recommendation: Optional[str] = None


class CandidateProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_photo: Optional[str] = None
    education: Optional[List[dict]] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[dict]] = None
    projects: Optional[List[dict]] = None
    certifications: Optional[List[str]] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    resume_filename: Optional[str] = None
    location: Optional[str] = None
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    expected_salary: Optional[str] = None
    work_preference: Optional[str] = None
    recruiter_notes: Optional[str] = None
    recruiter_verdict: Optional[str] = None
    recruiter_verdict_reason: Optional[str] = None
    missing_skills: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    ai_recommendation: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None




class CandidateCreate(CandidateBase):
    candidate_id: str

class Candidate(CandidateBase):
    candidate_id: str

    class Config:
        from_attributes = True

class CandidateStatusUpdate(BaseModel):
    status: str

class QuestionGenerationRequest(BaseModel):
    job_description: Optional[str] = None


class JobBase(BaseModel):
    title: str
    company: str
    location: str
    experience: str
    salary: str
    description: str
    requirements: str
    skills: List[str]
    is_active: Optional[bool] = True
    employment_type: Optional[str] = "Full-time"
    work_mode: Optional[str] = "Hybrid"
    status: Optional[str] = "Published"

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills: Optional[List[str]] = None
    is_active: Optional[bool] = None
    employment_type: Optional[str] = None
    work_mode: Optional[str] = None
    status: Optional[str] = None

class JobResponse(JobBase):
    id: int

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: str
    job_id: int
    applied_at: str
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    job_title: Optional[str] = None
    job_company: Optional[str] = None

    class Config:
        from_attributes = True


class InterviewSlotBase(BaseModel):
    slot_time: str
    is_booked: Optional[bool] = False
    booked_by_candidate_id: Optional[str] = None


class InterviewSlotResponse(InterviewSlotBase):
    id: int

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Company Schemas
# ──────────────────────────────────────────────

class CompanyBase(BaseModel):
    name: Optional[str] = "My Company"
    industry: Optional[str] = None
    size: Optional[str] = None
    headquarters: Optional[str] = None
    founded_year: Optional[int] = None
    description: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    brand_color: Optional[str] = "#6366f1"
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    github: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    timezone: Optional[str] = "UTC"
    interview_duration: Optional[int] = 30
    working_days: Optional[List[str]] = None
    recruiter_signature: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int

    class Config:
        from_attributes = True


class CompanyStatsResponse(BaseModel):
    active_jobs: int
    closed_jobs: int
    total_applications: int
    interviews_conducted: int
    candidates_selected: int
    candidates_rejected: int
    candidates_pending: int


class DocumentResponse(BaseModel):
    id: int
    filename: str
    doc_type: str
    uploaded_at: str
    file_size: int

    class Config:
        from_attributes = True


class ResumeQualityDistribution(BaseModel):
    excellent: int
    good: int
    average: int
    poor: int


class MonthlyReportItem(BaseModel):
    month: str
    applications: int
    interviews: int
    hires: int
    avg_ats: float


class CompanyAiMetricsResponse(BaseModel):
    avg_ats_score: float
    avg_interview_score: float
    selection_rate: float
    rejection_rate: float
    hiring_efficiency: float
    interview_pass_rate: float
    resume_quality: ResumeQualityDistribution
    monthly_report: List[MonthlyReportItem]


class SavedJobResponse(BaseModel):
    id: int
    candidate_id: str
    job_id: int
    saved_at: str

    class Config:
        from_attributes = True


class ResumeHistoryResponse(BaseModel):
    id: int
    candidate_id: str
    filename: str
    file_path: str
    file_size: int
    uploaded_at: str
    status: str

    class Config:
        from_attributes = True


class JobRecommendationResponse(BaseModel):
    job: JobResponse
    score: float
    reason: str
    match_pct: int

    class Config:
        from_attributes = True


class ResumeIntelligenceResponse(BaseModel):
    email: str
    phone: str
    location: str
    extracted_skills: List[str]
    recommended_skills: List[str]
    target_roles: List[str]
    feedback: List[str]

    class Config:
        from_attributes = True


class WebhookCandidateSchema(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    skills: List[str]

class WebhookApplicationSchema(BaseModel):
    job_id: int
    status: str
    ats_score: int

class WebhookInterviewQuestion(BaseModel):
    question: str

class WebhookInterviewSchema(BaseModel):
    questions: List[WebhookInterviewQuestion]

class PipelineWebhookPayload(BaseModel):
    candidate: WebhookCandidateSchema
    application: WebhookApplicationSchema
    interview: WebhookInterviewSchema














