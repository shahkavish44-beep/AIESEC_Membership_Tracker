import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Department, 
  Team,
  ActivityConfig, 
  WorkSubmission, 
  Task, 
  PDPTarget, 
  NotificationItem,
  UserRole,
  DepartmentName,
  RoleVerificationStatus,
  LCEvent,
  MemberCheckIn,
  MemberConcern,
  O2OMeeting,
  O2OResourceLink,
  TimelineMilestone
} from '../types';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_TEAMS,
  INITIAL_ACTIVITIES 
} from '../data/initialData';

interface AuthSession {
  userId: string;
  email: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  session: AuthSession | null;
  members: UserProfile[];
  departments: Department[];
  teams: Team[];
  activities: ActivityConfig[];
  submissions: WorkSubmission[];
  tasks: Task[];
  pdpTargets: PDPTarget[];
  lcEvents: LCEvent[];
  memberCheckIns: MemberCheckIn[];
  memberConcerns: MemberConcern[];
  o2oMeetings: O2OMeeting[];
  o2oResources: O2OResourceLink[];
  timelineMilestones: TimelineMilestone[];
  notifications: NotificationItem[];
  
  // Auth & Roles
  register: (
    fullName: string,
    personalEmail: string,
    aiesecEmail: string,
    password: string,
    position: UserRole,
    department?: DepartmentName,
    teamName?: string
  ) => { success: boolean; error?: string };
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUserById: (userId: string) => void;
  approveUserRole: (
    userId: string, 
    approvedRole: UserRole, 
    approvedDept?: DepartmentName, 
    approvedTeam?: string, 
    designation?: string
  ) => void;
  rejectUserRole: (userId: string, reason?: string) => void;

  // Members Management
  addMember: (member: Omit<UserProfile, 'id'>) => void;
  updateMember: (id: string, updates: Partial<UserProfile>) => void;

  // LC Calendar Events
  createLCEvent: (event: Omit<LCEvent, 'id' | 'created_at' | 'organizer_id' | 'organizer_name' | 'organizer_role'>) => void;
  deleteLCEvent: (eventId: string) => void;

  // Tasks (Strict Assignment Hierarchy Validation)
  canAssignToMember: (assignee: UserProfile) => boolean;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'assigned_by_id' | 'assigned_by_name' | 'assigned_by_role'>) => { success: boolean; error?: string };
  updateTaskStatus: (taskId: string, status: Task['status'], notes?: string, extra?: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;

  // Hackathon
  addActivity: (activity: Omit<ActivityConfig, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<ActivityConfig>) => void;
  deleteActivity: (id: string) => void;
  submitWork: (data: Omit<WorkSubmission, 'id' | 'submitted_at' | 'status' | 'calculated_points' | 'member_id' | 'member_name' | 'member_photo' | 'department_id' | 'department_name'>) => void;
  verifySubmission: (submissionId: string, status: 'Approved' | 'Rejected', reason?: string) => void;

  // PDP
  addPDPTarget: (target: Omit<PDPTarget, 'id'>) => void;
  updatePDPAchievement: (pdpId: string, achieved: number, feedback?: string, improvement?: string) => void;
  updatePDPTarget: (pdpId: string, updates: Partial<PDPTarget>) => void;
  deletePDPTarget: (pdpId: string) => void;

  // Membership Wellbeing
  createCheckIn: (checkIn: Omit<MemberCheckIn, 'id' | 'created_at' | 'responsible_person_id' | 'responsible_person_name'>) => void;
  updateCheckIn: (id: string, updates: Partial<MemberCheckIn>) => void;
  submitConcern: (concern: Omit<MemberConcern, 'id' | 'created_at' | 'member_id' | 'member_name' | 'department_name' | 'status'>) => void;
  updateConcernStatus: (id: string, status: MemberConcern['status'], notes?: string) => void;

  // TL Accountability & O2Os
  createO2OMeeting: (meeting: Omit<O2OMeeting, 'id' | 'created_at' | 'team_leader_id' | 'team_leader_name'>) => void;
  updateO2OMeeting: (id: string, updates: Partial<O2OMeeting>) => void;
  addO2OResource: (res: Omit<O2OResourceLink, 'id' | 'created_at' | 'added_by'>) => void;

  // Timeline Milestones
  addTimelineMilestone: (milestone: Omit<TimelineMilestone, 'id' | 'created_at' | 'source'>) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'aiesec_mumbai_v4_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    
    // Safety migration: normalize legacy 'GV' role to 'GB'
    if (key === 'members' && Array.isArray(parsed)) {
      return parsed.map((m: any) => ({
        ...m,
        role: m.role === 'GV' ? 'GB' : m.role,
        requested_role: m.requested_role === 'GV' ? 'GB' : m.requested_role,
      })) as unknown as T;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<UserProfile[]>(() => loadFromStorage('members', []));
  const [userCredentials, setUserCredentials] = useState<Record<string, { email: string; password: string; userId: string }>>(() => loadFromStorage('credentials', {}));
  const [departments] = useState<Department[]>(() => INITIAL_DEPARTMENTS);
  const [teams] = useState<Team[]>(() => INITIAL_TEAMS);
  const [activities, setActivities] = useState<ActivityConfig[]>(() => loadFromStorage('activities', INITIAL_ACTIVITIES));
  
  const [submissions, setSubmissions] = useState<WorkSubmission[]>(() => loadFromStorage('submissions', []));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', []));
  const [pdpTargets, setPdpTargets] = useState<PDPTarget[]>(() => loadFromStorage('pdpTargets', []));
  const [lcEvents, setLcEvents] = useState<LCEvent[]>(() => loadFromStorage('lcEvents', []));
  const [memberCheckIns, setMemberCheckIns] = useState<MemberCheckIn[]>(() => loadFromStorage('checkIns', []));
  const [memberConcerns, setMemberConcerns] = useState<MemberConcern[]>(() => loadFromStorage('concerns', []));
  const [o2oMeetings, setO2oMeetings] = useState<O2OMeeting[]>(() => loadFromStorage('o2oMeetings', []));
  const [o2oResources, setO2oResources] = useState<O2OResourceLink[]>(() => loadFromStorage('o2oResources', []));
  const [timelineMilestones, setTimelineMilestones] = useState<TimelineMilestone[]>(() => loadFromStorage('timeline', []));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('notifications', []));

  const [session, setSession] = useState<AuthSession | null>(() => loadFromStorage('session', null));

  const currentUser = React.useMemo(() => {
    if (!session) return null;
    return members.find(m => m.id === session.userId) || null;
  }, [session, members]);

  // Sync to local storage
  useEffect(() => { saveToStorage('members', members); }, [members]);
  useEffect(() => { saveToStorage('credentials', userCredentials); }, [userCredentials]);
  useEffect(() => { saveToStorage('activities', activities); }, [activities]);
  useEffect(() => { saveToStorage('submissions', submissions); }, [submissions]);
  useEffect(() => { saveToStorage('tasks', tasks); }, [tasks]);
  useEffect(() => { saveToStorage('pdpTargets', pdpTargets); }, [pdpTargets]);
  useEffect(() => { saveToStorage('lcEvents', lcEvents); }, [lcEvents]);
  useEffect(() => { saveToStorage('checkIns', memberCheckIns); }, [memberCheckIns]);
  useEffect(() => { saveToStorage('concerns', memberConcerns); }, [memberConcerns]);
  useEffect(() => { saveToStorage('o2oMeetings', o2oMeetings); }, [o2oMeetings]);
  useEffect(() => { saveToStorage('o2oResources', o2oResources); }, [o2oResources]);
  useEffect(() => { saveToStorage('timeline', timelineMilestones); }, [timelineMilestones]);
  useEffect(() => { saveToStorage('notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('session', session); }, [session]);

  // Helper for automatic milestone recording in Timeline
  const addAutoMilestone = (memberId: string, memberName: string, dept: DepartmentName | undefined, title: string, type: TimelineMilestone['milestone_type'], desc?: string) => {
    const entry: TimelineMilestone = {
      id: `tml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      member_id: memberId,
      member_name: memberName,
      department_name: dept,
      milestone_title: title,
      milestone_type: type,
      date: new Date().toISOString().split('T')[0],
      description: desc,
      source: 'automatic',
      created_at: new Date().toISOString()
    };
    setTimelineMilestones(prev => [entry, ...prev]);
  };

  // ----------------------------------------------------
  // REGISTRATION & AUTH
  // ----------------------------------------------------
  const register = (
    fullName: string,
    personalEmail: string,
    aiesecEmail: string,
    password: string,
    position: UserRole,
    department?: DepartmentName,
    teamName?: string
  ) => {
    const normAiesecEmail = aiesecEmail.trim().toLowerCase();
    const normPersonalEmail = personalEmail.trim().toLowerCase();

    if (userCredentials[normAiesecEmail] || userCredentials[normPersonalEmail]) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUserId = `user-${Date.now()}`;
    const isFirstUser = members.length === 0;

    // The first user registering is designated as LCP (Approved) to initialize the portal.
    // All subsequent registrations receive role: 'GB' (or position requested) with role_status: 'Pending Approval'.
    const finalRole: UserRole = isFirstUser ? 'LCP' : 'GB';
    const finalStatus: RoleVerificationStatus = isFirstUser ? 'Approved' : 'Pending Approval';

    const deptObj = department ? departments.find(d => d.name === department) : undefined;
    const today = new Date().toISOString().split('T')[0];

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=B89B55,17243A&textColor=ffffff`;

    const newProfile: UserProfile = {
      id: newUserId,
      personal_email: normPersonalEmail,
      aiesec_email: normAiesecEmail,
      email: normAiesecEmail,
      full_name: fullName.trim(),
      role: finalRole,
      requested_role: position,
      role_status: finalStatus,
      department_id: deptObj?.id,
      department_name: department,
      team_name: teamName,
      designation: isFirstUser ? 'Local Committee President' : position === 'MB' ? 'Team Leader' : position === 'LCVP' ? 'Vice President' : 'Member',
      avatar_url: defaultAvatar,
      joining_date: today,
      reporting_to: isFirstUser ? 'National Board' : position === 'MB' ? 'LCVP' : 'Team Leader',
      bio: ''
    };

    setMembers(prev => [...prev, newProfile]);
    setUserCredentials(prev => ({
      ...prev,
      [normAiesecEmail]: { email: normAiesecEmail, password, userId: newUserId },
      [normPersonalEmail]: { email: normPersonalEmail, password, userId: newUserId }
    }));

    // Record automatic milestone in Membership Timeline: Joined AIESEC
    addAutoMilestone(newUserId, fullName, department, 'Joined AIESEC in Mumbai', 'Joined AIESEC', `Registered account with requested position: ${position}.`);

    // Notify administrators if pending
    if (!isFirstUser) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          user_id: 'all_admin',
          title: 'New Position Verification Request',
          message: `${fullName} requested position ${position} in ${department || 'LC Core'}.`,
          type: 'role',
          read: false,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
    }

    setSession({ userId: newUserId, email: normAiesecEmail });
    return { success: true };
  };

  const login = (email: string, password: string) => {
    const norm = email.trim().toLowerCase();
    const cred = userCredentials[norm];
    if (!cred || cred.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    setSession({ userId: cred.userId, email: norm });
    return { success: true };
  };

  const logout = () => {
    setSession(null);
  };

  const switchUserById = (userId: string) => {
    const user = members.find(m => m.id === userId);
    if (user) {
      setSession({ userId: user.id, email: user.aiesec_email });
    }
  };

  const approveUserRole = (
    userId: string, 
    approvedRole: UserRole, 
    approvedDept?: DepartmentName, 
    approvedTeam?: string, 
    designation?: string
  ) => {
    const deptObj = approvedDept ? departments.find(d => d.name === approvedDept) : undefined;
    setMembers(prev => prev.map(m => {
      if (m.id === userId) {
        return {
          ...m,
          role: approvedRole,
          requested_role: approvedRole,
          role_status: 'Approved' as RoleVerificationStatus,
          department_id: deptObj?.id,
          department_name: approvedDept,
          team_name: approvedTeam,
          designation: designation || m.designation
        };
      }
      return m;
    }));

    const target = members.find(m => m.id === userId);
    if (target) {
      addAutoMilestone(
        userId, 
        target.full_name, 
        approvedDept, 
        `Appointed as ${approvedRole}`, 
        'Position Change', 
        `Position approved and verified by LCP${approvedDept ? ` for ${approvedDept}` : ''}.`
      );

      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          user_id: userId,
          title: 'Position Verified & Approved',
          message: `Your appointment as ${approvedRole}${approvedDept ? ` in ${approvedDept}` : ''} has been approved.`,
          type: 'role',
          read: false,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
    }
  };

  const rejectUserRole = (userId: string, reason?: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === userId) {
        return {
          ...m,
          role: 'GB',
          role_status: 'Rejected' as RoleVerificationStatus
        };
      }
      return m;
    }));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        user_id: userId,
        title: 'Role Request Updated',
        message: `Your position request was not verified. Defaulted to GB (General Body). ${reason ? `Reason: ${reason}` : ''}`,
        type: 'role',
        read: false,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  // ----------------------------------------------------
  // MEMBERS MANAGEMENT
  // ----------------------------------------------------
  const addMember = (newMemberData: Omit<UserProfile, 'id'>) => {
    const newMember: UserProfile = {
      ...newMemberData,
      id: `user-${Date.now()}`
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<UserProfile>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  // ----------------------------------------------------
  // LC CALENDAR
  // ----------------------------------------------------
  const createLCEvent = (eventData: Omit<LCEvent, 'id' | 'created_at' | 'organizer_id' | 'organizer_name' | 'organizer_role'>) => {
    if (!currentUser) return;
    const newEvent: LCEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      organizer_id: currentUser.id,
      organizer_name: currentUser.full_name,
      organizer_role: currentUser.role,
      created_at: new Date().toISOString()
    };
    setLcEvents(prev => [newEvent, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        user_id: 'all_admin',
        title: 'New LC Calendar Event',
        message: `${newEvent.title} scheduled on ${newEvent.date} by ${currentUser.full_name}.`,
        type: 'event',
        read: false,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const deleteLCEvent = (eventId: string) => {
    setLcEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // ----------------------------------------------------
  // TASK ASSIGNMENT HIERARCHY VALIDATION
  // ----------------------------------------------------
  // Rules:
  // LCP can assign to LCVP, MB, GB across any department.
  // LCVP can assign to MB, GB within their own department. CANNOT assign to LCP or other LCVPs.
  // MB can assign to GBs in their assigned team. CANNOT assign to LCP, LCVP, other MBs.
  // GB cannot assign tasks to anyone.
  const canAssignToMember = (assignee: UserProfile): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'LCP') {
      return assignee.role === 'LCVP' || assignee.role === 'MB' || assignee.role === 'GB';
    }
    if (currentUser.role === 'LCVP') {
      const isSameDept = assignee.department_name === currentUser.department_name;
      const isSubordinate = assignee.role === 'MB' || assignee.role === 'GB';
      return isSameDept && isSubordinate;
    }
    if (currentUser.role === 'MB') {
      const isSameDept = assignee.department_name === currentUser.department_name;
      const isSameTeam = assignee.team_name === currentUser.team_name;
      const isGb = assignee.role === 'GB';
      return isSameDept && isSameTeam && isGb;
    }
    return false;
  };

  const createTask = (taskData: Omit<Task, 'id' | 'created_at' | 'assigned_by_id' | 'assigned_by_name' | 'assigned_by_role'>) => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    if (currentUser.role === 'GB') {
      return { success: false, error: 'General Body (GB) members are not permitted to assign tasks.' };
    }

    // Verify all assignees against strict hierarchy
    const assignees = members.filter(m => taskData.assigned_to_ids.includes(m.id));
    for (const assignee of assignees) {
      if (!canAssignToMember(assignee)) {
        return { 
          success: false, 
          error: `Permission Denied: As a ${currentUser.role}, you cannot assign tasks to ${assignee.full_name} (${assignee.role} in ${assignee.department_name || 'other'}).` 
        };
      }
    }

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      assigned_by_id: currentUser.id,
      assigned_by_name: currentUser.full_name,
      assigned_by_role: currentUser.role,
      created_at: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);

    // Send notifications to assignees
    taskData.assigned_to_ids.forEach(mId => {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}-${mId}`,
          user_id: mId,
          title: 'New Deliverable Assigned',
          message: `"${taskData.title}" was assigned to you by ${currentUser.full_name} (${currentUser.role}). Due: ${taskData.due_date}`,
          type: 'task',
          read: false,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
    });

    return { success: true };
  };

  const updateTaskStatus = (taskId: string, status: Task['status'], notes?: string, extra?: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (status === 'Completed' && currentUser) {
          addAutoMilestone(currentUser.id, currentUser.full_name, currentUser.department_name, `Completed Task: ${t.title}`, 'First Task Completed', 'Task deliverable successfully marked completed.');
        }
        return {
          ...t,
          ...extra,
          status,
          submission_notes: notes !== undefined ? notes : t.submission_notes
        };
      }
      return t;
    }));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  // ----------------------------------------------------
  // HACKATHON
  // ----------------------------------------------------
  const addActivity = (activityData: Omit<ActivityConfig, 'id'>) => {
    const newAct: ActivityConfig = { ...activityData, id: `act-${Date.now()}` };
    setActivities(prev => [...prev, newAct]);
  };

  const updateActivity = (id: string, updates: Partial<ActivityConfig>) => {
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const submitWork = (data: Omit<WorkSubmission, 'id' | 'submitted_at' | 'status' | 'calculated_points' | 'member_id' | 'member_name' | 'member_photo' | 'department_id' | 'department_name'>) => {
    if (!currentUser) return;

    const activity = activities.find(a => a.id === data.activity_id);
    const unitPoints = activity ? activity.points : 10;
    const qty = data.quantity && data.quantity > 0 ? data.quantity : 1;
    const calcPoints = activity?.requires_quantity ? unitPoints * qty : unitPoints;

    const newSubmission: WorkSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      member_id: currentUser.id,
      member_name: currentUser.full_name,
      member_photo: currentUser.avatar_url,
      department_id: currentUser.department_id || 'dept-igv',
      department_name: currentUser.department_name || 'iGV',
      quantity: qty,
      calculated_points: calcPoints,
      status: 'Pending Verification',
      submitted_at: new Date().toISOString()
    };

    setSubmissions(prev => [newSubmission, ...prev]);
  };

  const verifySubmission = (submissionId: string, status: 'Approved' | 'Rejected', reason?: string) => {
    if (!currentUser) return;

    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          status,
          verified_at: new Date().toISOString(),
          verifier_id: currentUser.id,
          verifier_name: currentUser.full_name,
          rejection_reason: reason
        };
      }
      return s;
    }));

    const targetSub = submissions.find(s => s.id === submissionId);
    if (targetSub && status === 'Approved') {
      addAutoMilestone(targetSub.member_id, targetSub.member_name, targetSub.department_name, `Hackathon Points Verified (+${targetSub.calculated_points} pts)`, 'First Major Contribution', `Earned for: ${targetSub.activity_name}`);
    }
  };

  // ----------------------------------------------------
  // PDP
  // ----------------------------------------------------
  const addPDPTarget = (targetData: Omit<PDPTarget, 'id'>) => {
    const newTarget: PDPTarget = { 
      ...targetData, 
      id: `pdp-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setPdpTargets(prev => [newTarget, ...prev]);

    // Send milestone or notification
    if (currentUser) {
      addAutoMilestone(
        targetData.member_id, 
        currentUser.full_name, 
        currentUser.department_name, 
        `Set New PDP Target: ${targetData.skill_name || targetData.target_metric}`, 
        'PDP Milestone', 
        `Target set: ${targetData.target_metric}`
      );
    }
  };

  const updatePDPAchievement = (pdpId: string, achieved: number, feedback?: string, improvement?: string) => {
    setPdpTargets(prev => prev.map(p => {
      if (p.id === pdpId) {
        if (currentUser && achieved >= p.minimum_target) {
          addAutoMilestone(p.member_id, currentUser.full_name, currentUser.department_name, `PDP Target Met: ${p.target_metric}`, 'PDP Milestone', `Hit ${achieved}/${p.minimum_target} ${p.unit}.`);
        }
        const pct = p.minimum_target > 0 ? Math.min(100, Math.round((achieved / p.minimum_target) * 100)) : 0;
        return {
          ...p,
          actual_achieved: achieved,
          progress_percentage: pct,
          status: pct >= 100 ? 'Completed' : 'In Progress',
          feedback: feedback !== undefined ? feedback : p.feedback,
          areas_for_improvement: improvement !== undefined ? improvement : p.areas_for_improvement
        };
      }
      return p;
    }));
  };

  const updatePDPTarget = (pdpId: string, updates: Partial<PDPTarget>) => {
    setPdpTargets(prev => prev.map(p => {
      if (p.id === pdpId) {
        const updated = { ...p, ...updates };
        if (updated.minimum_target > 0 && updated.actual_achieved !== undefined) {
          updated.progress_percentage = Math.min(100, Math.round((updated.actual_achieved / updated.minimum_target) * 100));
          if (updated.progress_percentage >= 100) {
            updated.status = 'Completed';
          }
        }
        return updated;
      }
      return p;
    }));
  };

  const deletePDPTarget = (pdpId: string) => {
    setPdpTargets(prev => prev.filter(p => p.id !== pdpId));
  };

  // ----------------------------------------------------
  // MEMBERSHIP WELLBEING
  // ----------------------------------------------------
  const createCheckIn = (checkInData: Omit<MemberCheckIn, 'id' | 'created_at' | 'responsible_person_id' | 'responsible_person_name'>) => {
    if (!currentUser) return;
    const newCheckIn: MemberCheckIn = {
      ...checkInData,
      id: `chk-${Date.now()}`,
      responsible_person_id: currentUser.id,
      responsible_person_name: currentUser.full_name,
      created_at: new Date().toISOString()
    };
    setMemberCheckIns(prev => [newCheckIn, ...prev]);
  };

  const updateCheckIn = (id: string, updates: Partial<MemberCheckIn>) => {
    setMemberCheckIns(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const submitConcern = (concernData: Omit<MemberConcern, 'id' | 'created_at' | 'member_id' | 'member_name' | 'department_name' | 'status'>) => {
    if (!currentUser) return;
    const newConcern: MemberConcern = {
      ...concernData,
      id: `crn-${Date.now()}`,
      member_id: currentUser.id,
      member_name: currentUser.full_name,
      department_name: currentUser.department_name,
      status: 'Open',
      created_at: new Date().toISOString()
    };
    setMemberConcerns(prev => [newConcern, ...prev]);
  };

  const updateConcernStatus = (id: string, status: MemberConcern['status'], notes?: string) => {
    if (!currentUser) return;
    setMemberConcerns(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          resolution_notes: notes !== undefined ? notes : c.resolution_notes,
          resolved_by_name: currentUser.full_name
        };
      }
      return c;
    }));
  };

  // ----------------------------------------------------
  // TL ACCOUNTABILITY & O2OS
  // ----------------------------------------------------
  const createO2OMeeting = (data: Omit<O2OMeeting, 'id' | 'created_at' | 'team_leader_id' | 'team_leader_name'>) => {
    if (!currentUser) return;
    const newMeeting: O2OMeeting = {
      ...data,
      id: `o2o-${Date.now()}`,
      team_leader_id: currentUser.id,
      team_leader_name: currentUser.full_name,
      created_at: new Date().toISOString()
    };
    setO2oMeetings(prev => [newMeeting, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        user_id: data.team_member_id,
        title: 'New O2O Meeting Scheduled',
        message: `Your TL ${currentUser.full_name} scheduled a ${data.meeting_type} for ${data.meeting_date}.`,
        type: 'o2o',
        read: false,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const updateO2OMeeting = (id: string, updates: Partial<O2OMeeting>) => {
    setO2oMeetings(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const addO2OResource = (res: Omit<O2OResourceLink, 'id' | 'created_at' | 'added_by'>) => {
    if (!currentUser) return;
    const newRes: O2OResourceLink = {
      ...res,
      id: `res-${Date.now()}`,
      added_by: currentUser.full_name,
      created_at: new Date().toISOString()
    };
    setO2oResources(prev => [newRes, ...prev]);
  };

  // ----------------------------------------------------
  // TIMELINE MILESTONES
  // ----------------------------------------------------
  const addTimelineMilestone = (milestoneData: Omit<TimelineMilestone, 'id' | 'created_at' | 'source'>) => {
    const newMilestone: TimelineMilestone = {
      ...milestoneData,
      id: `tml-${Date.now()}`,
      source: 'manual',
      created_at: new Date().toISOString()
    };
    setTimelineMilestones(prev => [newMilestone, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllData = () => {
    localStorage.clear();
    setMembers([]);
    setUserCredentials({});
    setSubmissions([]);
    setTasks([]);
    setPdpTargets([]);
    setLcEvents([]);
    setMemberCheckIns([]);
    setMemberConcerns([]);
    setO2oMeetings([]);
    setO2oResources([]);
    setTimelineMilestones([]);
    setNotifications([]);
    setSession(null);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      session,
      members,
      departments,
      teams,
      activities,
      submissions,
      tasks,
      pdpTargets,
      lcEvents,
      memberCheckIns,
      memberConcerns,
      o2oMeetings,
      o2oResources,
      timelineMilestones,
      notifications,
      register,
      login,
      logout,
      switchUserById,
      approveUserRole,
      rejectUserRole,
      addMember,
      updateMember,
      createLCEvent,
      deleteLCEvent,
      canAssignToMember,
      createTask,
      updateTaskStatus,
      updateTask,
      addActivity,
      updateActivity,
      deleteActivity,
      submitWork,
      verifySubmission,
      addPDPTarget,
      updatePDPAchievement,
      updatePDPTarget,
      deletePDPTarget,
      createCheckIn,
      updateCheckIn,
      submitConcern,
      updateConcernStatus,
      createO2OMeeting,
      updateO2OMeeting,
      addO2OResource,
      addTimelineMilestone,
      markNotificationRead,
      clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
