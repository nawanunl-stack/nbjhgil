export type UserRole = 'admin' | 'safety_officer' | 'viewer'
export type LawStatus = 'active' | 'repealed' | 'amended'
export type Priority = 'high' | 'medium' | 'low'
export type ComplianceStatus =
  | 'not_started'
  | 'in_progress'
  | 'compliant'
  | 'non_compliant'
  | 'not_applicable'

export interface Department {
  id: string
  name: string
  code: string
  email?: string
  line_token?: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  department_id?: string
  phone?: string
  department?: Department
}

export interface LegalCategory {
  id: string
  name: string
  description?: string
  color: string
}

export interface LegalRegistry {
  id: string
  law_code: string
  title: string
  full_title?: string
  category_id?: string
  law_type?: string
  issuing_authority?: string
  effective_date?: string
  gazette_volume?: string
  gazette_issue?: string
  gazette_date?: string
  gazette_url?: string
  status: LawStatus
  summary?: string
  full_content?: string
  source: string
  created_by?: string
  created_at: string
  updated_at: string
  category?: LegalCategory
  requirements?: LawRequirement[]
}

export interface LawRequirement {
  id: string
  law_id: string
  item_number?: string
  section_name?: string
  who_must_do: string
  what_to_do: string
  where_to_do?: string
  how_to_do?: string
  related_documents?: string[]
  related_departments?: string[]
  frequency?: string
  deadline_days?: number
  priority: Priority
  created_at: string
  department_names?: string[]
}

export interface ComplianceAssessment {
  id: string
  law_id: string
  requirement_id?: string
  department_id: string
  status: ComplianceStatus
  compliance_level: number
  evidence?: string
  evidence_url?: string
  assessor_id?: string
  assessed_date?: string
  next_review_date?: string
  remarks?: string
  created_at: string
  updated_at: string
  law?: LegalRegistry
  requirement?: LawRequirement
  department?: Department
}

export interface DashboardStats {
  total_laws: number
  new_this_month: number
  total_requirements: number
  compliant_count: number
  non_compliant_count: number
  in_progress_count: number
  not_started_count: number
  overall_compliance_rate: number
}

export interface NotificationLog {
  id: string
  law_id?: string
  department_id?: string
  type: string
  recipient: string
  message: string
  status: string
  sent_at: string
  law?: LegalRegistry
  department?: Department
}
