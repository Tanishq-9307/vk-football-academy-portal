export type Role = 'admin' | 'coach' | 'parent'
export type AgeGroup = 'U12' | 'U14' | 'U16' | 'U18'
export type SessionCategory =
  | 'Technical'
  | 'Tactical'
  | 'Physical'
  | 'Goalkeeping'
  | 'Other'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled'
export type AnnouncementAudience = 'all' | 'coaches' | 'parents'
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other'

/** Fee state is computed from amounts + due date, never stored stale. */
export type FeeStatus = 'paid' | 'partial' | 'overdue' | 'pending'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
}

export interface Coach {
  id: string
  user_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  licence: string | null
  bio: string | null
  is_active: boolean
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  age_group: AgeGroup
  coach_id: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  coach?: Coach | null
}

export interface Player {
  id: string
  full_name: string
  date_of_birth: string | null
  age_group: AgeGroup | null
  position: string | null
  parent_name: string | null
  parent_phone: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: string
  team_id: string
  title: string | null
  session_date: string
  start_time: string
  duration_minutes: number
  pitch: string | null
  category: SessionCategory
  objectives: string | null
  description: string | null
  status: SessionStatus
  created_by: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  team?: Team | null
}

export interface PlanContent {
  objectives?: string
  warm_up?: string
  technical_drills?: string
  tactical_activities?: string
  small_sided_games?: string
  physical_conditioning?: string
  cool_down?: string
  equipment?: string
  coaching_points?: string
  post_session_observations?: string
}

export const PLAN_FIELDS: {
  key: keyof PlanContent
  label: string
  hint: string
}[] = [
  { key: 'objectives', label: 'Training objectives', hint: 'What should players be able to do by the end of the session?' },
  { key: 'warm_up', label: 'Warm-up activities', hint: 'Activation, mobility, light ball work…' },
  { key: 'technical_drills', label: 'Technical drills', hint: 'Passing, receiving, dribbling, shooting…' },
  { key: 'tactical_activities', label: 'Tactical activities', hint: 'Shape, pressing, transitions, set pieces…' },
  { key: 'small_sided_games', label: 'Small-sided games', hint: 'Formats, pitch size, rules, constraints…' },
  { key: 'physical_conditioning', label: 'Physical conditioning', hint: 'Speed, agility, endurance work…' },
  { key: 'cool_down', label: 'Cool-down', hint: 'Stretching, breathing, debrief…' },
  { key: 'equipment', label: 'Equipment required', hint: 'Cones, bibs, balls, goals, ladders…' },
  { key: 'coaching_points', label: 'Coaching points', hint: 'Key cues to repeat during the session…' },
  { key: 'post_session_observations', label: 'Post-session observations', hint: 'Filled in after the session — what actually happened.' },
]

export interface SessionPlan {
  id: string
  training_session_id: string
  coach_id: string | null
  team_id: string | null
  title: string
  description: string | null
  content: PlanContent
  file_name: string | null
  file_path: string | null
  file_type: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  session?: TrainingSession | null
  team?: Team | null
  coach?: Coach | null
}

export interface AttendanceRecord {
  id: string
  training_session_id: string
  player_id: string
  status: AttendanceStatus
  marked_by: string | null
  marked_at: string
  updated_at: string
  is_demo: boolean
  player?: Player | null
}

export interface SessionObservation {
  id: string
  training_session_id: string
  coach_id: string | null
  observation: string
  is_demo: boolean
  created_at: string
  coach?: Coach | null
}

/** One row links a parent login to one of their children. */
export interface ParentLink {
  id: string
  parent_id: string
  player_id: string
  relationship: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  player?: Player | null
  parent?: Profile | null
}

export interface Match {
  id: string
  team_id: string
  opponent: string
  match_date: string
  start_time: string
  venue: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  goals: string | null
  observations: string | null
  created_by: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  team?: Team | null
}

export interface FeeStructure {
  id: string
  name: string
  age_group: AgeGroup | null
  amount: number
  due_date: string | null
  description: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface FeeRecord {
  id: string
  player_id: string
  fee_structure_id: string | null
  amount_due: number
  amount_paid: number
  payment_date: string | null
  payment_method: PaymentMethod | null
  receipt_no: string | null
  notes: string | null
  recorded_by: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  player?: Player | null
  structure?: FeeStructure | null
}

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  created_by: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

/** 1–10 ratings per development area. Missing keys mean "not assessed". */
export interface ReportRatings {
  technical?: number
  tactical?: number
  physical?: number
  psychological?: number
  attitude?: number
  overall?: number
}

export const REPORT_AREAS: {
  key: keyof ReportRatings
  label: string
}[] = [
  { key: 'technical', label: 'Technical ability' },
  { key: 'tactical', label: 'Tactical understanding' },
  { key: 'physical', label: 'Physical attributes' },
  { key: 'psychological', label: 'Psychological development' },
  { key: 'attitude', label: 'Attitude & discipline' },
  { key: 'overall', label: 'Overall performance' },
]

export interface PlayerReport {
  id: string
  player_id: string
  coach_id: string | null
  assessment_date: string
  training_session_id: string | null
  ratings: ReportRatings
  strengths: string | null
  weaknesses: string | null
  objectives: string | null
  recommendations: string | null
  areas_of_improvement: string | null
  areas_requiring_attention: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  player?: Player | null
  coach?: Coach | null
  session?: TrainingSession | null
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: 'Everyone',
  coaches: 'Coaches only',
  parents: 'Parents only',
}

export const AUDIENCES: AnnouncementAudience[] = ['all', 'coaches', 'parents']

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'upi',
  'bank_transfer',
  'other',
]

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  paid: 'Paid',
  partial: 'Part paid',
  overdue: 'Overdue',
  pending: 'Pending',
}

export const AGE_GROUPS: AgeGroup[] = ['U12', 'U14', 'U16', 'U18']

export const SESSION_CATEGORIES: SessionCategory[] = [
  'Technical',
  'Tactical',
  'Physical',
  'Goalkeeping',
  'Other',
]
