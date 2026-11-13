// Exact 4 Role Hierarchy as required:
// LCP -> LCVP / VP -> MB -> GB
export type UserRole = 'LCP' | 'LCVP' | 'MB' | 'GB';

export type RoleVerificationStatus = 'Pending Approval' | 'Approved' | 'Rejected';

export type DepartmentName = 'oGV' | 'iGV' | 'oGT' | 'iGT' | 'Marketing' | 'Business Development';

export interface Department {
  id: string;
  name: DepartmentName;
  description: string;
  lcvp_id?: string;
  color: string;
  icon: string;
}

export interface Team {
  id: string;
  department_name: DepartmentName;
  name: string;
}

export interface UserProfile {
  id: string;
  personal_email: string;
  aiesec_email: string;
  email: string; // fallback alias
  full_name: string;
  role: UserRole;
  requested_role: UserRole;
  role_status: RoleVerificationStatus;
  department_id?: string;
  department_name?: DepartmentName;
  team_name?: string;
  designation: string;
  avatar_url: string;
  joining_date: string; // Account registration / portal joining date
  membership_joining_date?: string; // Actual AIESEC membership joining date
  reporting_to?: string;
  bio?: string;
  phone?: string;
}

// ----------------------------------------------------
// LC Calendar Entry
// ----------------------------------------------------
export type LCEventCategory = 
  | 'LC Event' 
  | 'Department Meeting' 
  | 'Team Meeting' 
  | 'EB Meeting' 
  | 'Interdepartmental Synergy' 
  | 'Training' 
  | 'Conference' 
  | 'Deadline' 
  | 'Other';

export interface LCEvent {
  id: string;
  title: string;
  description: string;
  category: LCEventCategory;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. 18:00
  end_time?: string;
  department_name?: DepartmentName | 'All Departments';
  team_name?: string;
  location_or_link: string;
  visibility: 'LC Wide' | 'Department' | 'Team' | 'Private';
  organizer_id: string;
  organizer_name: string;
  organizer_role: UserRole;
  created_at: string;
}

// ----------------------------------------------------
// Membership Wellbeing
// ----------------------------------------------------
export interface MemberCheckIn {
  id: string;
  member_id: string;
  member_name: string;
  member_dept?: DepartmentName;
  check_in_date: string;
  check_in_type: 'Monthly 1:1' | 'Wellbeing Catch-up' | 'Role Transition' | 'Onboarding Review' | 'Ad-hoc Support';
  discussion_summary: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  responsible_person_id: string;
  responsible_person_name: string;
  status: 'Completed' | 'Pending Follow-up' | 'Scheduled';
  created_at: string;
}

export interface MemberConcern {
  id: string;
  member_id: string;
  member_name: string;
  department_name?: DepartmentName;
  target_person_id?: string;
  target_person_name?: string;
  subject: string;
  category: 'Workload & Academic Balance' | 'Team Dynamics' | 'Role Clarity' | 'Personal Wellbeing' | 'Other';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  resolution_notes?: string;
  resolved_by_name?: string;
  created_at: string;
}

// ----------------------------------------------------
// TL Accountability & O2Os
// ----------------------------------------------------
export interface O2OMeeting {
  id: string;
  team_leader_id: string;
  team_leader_name: string;
  team_member_id: string;
  team_member_name: string;
  department_name?: DepartmentName;
  team_name?: string;
  meeting_date: string;
  meeting_time?: string;
  meeting_link?: string;
  meeting_type: 'Bi-Weekly O2O' | 'Monthly Review' | 'Goal Setting' | 'Support & Mentorship' | 'Performance Review';
  discussion_topics?: string;
  discussion_summary: string;
  confidential_tl_notes?: string;
  agreed_action_points: string;
  next_follow_up_date?: string;
  completion_status: 'Scheduled' | 'Completed' | 'Requires Escalation' | 'Missed';
  created_at: string;
}

export interface O2OResourceLink {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'O2O Forms' | 'Documentation' | 'Meeting Templates' | 'Tracking Sheets' | 'Guidelines';
  added_by: string;
  created_at: string;
}

// ----------------------------------------------------
// Membership Timeline
// ----------------------------------------------------
export interface TimelineMilestone {
  id: string;
  member_id: string;
  member_name: string;
  department_name?: DepartmentName;
  milestone_title: string;
  milestone_type: 
    | 'Joined AIESEC' 
    | 'Induction Completed' 
    | 'First Team Meeting' 
    | 'First Task Completed' 
    | 'First Major Contribution' 
    | 'PDP Milestone' 
    | 'Position Change' 
    | 'Leadership Transition' 
    | 'Major Achievement' 
    | 'Membership Transition';
  date: string;
  description?: string;
  source: 'automatic' | 'manual';
  created_at: string;
}

// ----------------------------------------------------
// Activity & Hackathon Types
// ----------------------------------------------------
export interface ActivityConfig {
  id: string;
  name: string;
  category: 'Outreach' | 'Meetings' | 'Operations' | 'Events' | 'Department Milestone' | 'Other';
  points: number;
  requires_quantity: boolean;
  requires_verification: boolean;
  unit_name?: string;
  description: string;
}

export interface WorkSubmission {
  id: string;
  member_id: string;
  member_name: string;
  member_photo: string;
  department_id: string;
  department_name: DepartmentName;
  activity_id: string;
  activity_name: string;
  category: string;
  quantity: number;
  calculated_points: number;
  description: string;
  proof_link: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  submitted_at: string;
  verified_at?: string;
  verifier_id?: string;
  verifier_name?: string;
  rejection_reason?: string;
}

export interface PointTransaction {
  id: string;
  submission_id?: string;
  member_id: string;
  department_id: string;
  points: number;
  activity_name: string;
  category: string;
  created_at: string;
}

// ----------------------------------------------------
// Tasks
// ----------------------------------------------------
export interface Task {
  id: string;
  title: string;
  description: string;
  department_id?: string;
  department_name?: DepartmentName;
  team_name?: string;
  assigned_by_id: string;
  assigned_by_name: string;
  assigned_by_role: UserRole;
  assigned_to_ids: string[];
  assigned_to_names: string[];
  is_collaborative?: boolean;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Pending Verification';
  start_date?: string;
  due_date: string;
  created_at: string;
  attachment_url?: string;
  additional_instructions?: string;
  proof_url?: string;
  progress_update?: string;
  reviewer_feedback?: string;
  verified_by_id?: string;
  submission_notes?: string;
}

// ----------------------------------------------------
// PDP
// ----------------------------------------------------
export interface PDPTarget {
  id: string;
  member_id: string;
  category: 'Communication and Interpersonal Skills' | 'Business and Sales Skills' | 'Digital and Professional Skills' | 'Personal Growth' | 'Calling & Outreach' | 'Physical Meetings' | 'Conversions' | 'Event Attendance' | 'Skill Learning' | 'Other';
  skill_name?: string;
  target_metric: string; // The specific goal or metric
  reason?: string; // Why they want to develop this skill
  expected_outcome?: string;
  starting_level?: 'Beginner' | 'Elementary' | 'Intermediate' | 'Proficient' | 'Advanced';
  current_level?: 'Beginner' | 'Elementary' | 'Intermediate' | 'Proficient' | 'Advanced';
  target_level?: 'Beginner' | 'Elementary' | 'Intermediate' | 'Proficient' | 'Advanced';
  start_date?: string;
  target_completion_date?: string;
  progress_percentage?: number; // 0 - 100
  minimum_target: number;
  actual_achieved: number;
  unit: string;
  month: string;
  year: number;
  reflection_notes?: string;
  current_achievements?: string;
  feedback?: string;
  areas_for_improvement?: string;
  status?: 'Not Started' | 'In Progress' | 'Completed';
  created_at?: string;
}

// ----------------------------------------------------
// Notifications
// ----------------------------------------------------
export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task' | 'points' | 'pdp' | 'role' | 'event' | 'wellbeing' | 'o2o';
  read: boolean;
  created_at: string;
}
