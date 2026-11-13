import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Filter,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, DepartmentName } from '../types';

export const TasksPage: React.FC = () => {
  const { tasks, members, departments, teams, currentUser, createTask, updateTaskStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New task form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskDept, setTaskDept] = useState<DepartmentName>(currentUser?.department_name || 'iGV');
  const [taskTeam, setTaskTeam] = useState<string>(currentUser?.team_name || '');
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Member progress & submission state for selected task
  const [progressUpdate, setProgressUpdate] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [reviewerFeedback, setReviewerFeedback] = useState('');

  // Role-Based Task Assignment Permission:
  // - LCP: Can assign tasks across the entire organisation.
  // - LCVP: Can assign tasks within their department.
  // - MB: Can assign tasks within their assigned team.
  // - GB: Cannot assign tasks.
  const canAssignTasks = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'LCP') return true;
    if (currentUser.role === 'LCVP') return true;
    if (currentUser.role === 'MB') return true;
    return false;
  }, [currentUser]);

  // Role-Based Task Visibility:
  // - LCP: Organisation-wide
  // - LCVP: Entire department
  // - MB: Assigned team
  // - GB: Own tasks & team collaborative tasks
  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'LCP') {
      return tasks;
    }

    if (currentUser.role === 'LCVP') {
      return tasks.filter(t => t.department_name === currentUser.department_name);
    }

    if (currentUser.role === 'MB') {
      return tasks.filter(t => 
        (currentUser.department_name && t.department_name === currentUser.department_name && currentUser.team_name && t.team_name === currentUser.team_name) ||
        t.assigned_to_ids.includes(currentUser.id) ||
        t.assigned_by_id === currentUser.id
      );
    }

    // GB: Own tasks & collaborative team tasks
    return tasks.filter(t => {
      const isAssigned = t.assigned_to_ids.includes(currentUser.id);
      const isMyTeam = currentUser.team_name && t.team_name === currentUser.team_name;
      return isAssigned || isMyTeam;
    });
  }, [tasks, currentUser]);

  // Apply status filter
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'ALL') return visibleTasks;
    return visibleTasks.filter(t => t.status === statusFilter);
  }, [visibleTasks, statusFilter]);

  // Team Progress Metrics
  const metrics = useMemo(() => {
    const total = visibleTasks.length;
    const completed = visibleTasks.filter(t => t.status === 'Completed').length;
    const inProgress = visibleTasks.filter(t => t.status === 'In Progress').length;
    const notStarted = visibleTasks.filter(t => t.status === 'Not Started').length;
    const pendingVerification = visibleTasks.filter(t => t.status === 'Pending Verification').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, notStarted, pendingVerification, percentage };
  }, [visibleTasks]);

  // DYNAMIC CANDIDATES FOR TASK ASSIGNMENT:
  // - LCP: All members across all departments.
  // - LCVP: Only members within their department.
  // - MB: Only members within their assigned team.
  const assignableMembers = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'LCP') {
      if (taskDept) {
        return members.filter(m => m.department_name === taskDept);
      }
      return members;
    }

    if (currentUser.role === 'LCVP') {
      return members.filter(m => m.department_name === currentUser.department_name && (m.role === 'MB' || m.role === 'GB'));
    }

    if (currentUser.role === 'MB') {
      return members.filter(m => 
        m.department_name === currentUser.department_name && 
        m.team_name === currentUser.team_name &&
        m.role === 'GB'
      );
    }

    return [];
  }, [members, currentUser, taskDept]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignedToIds.length === 0 || !dueDate || !currentUser) return;

    const assignedMembers = members.filter(m => assignedToIds.includes(m.id));
    const targetDept = currentUser.role === 'LCP' 
      ? taskDept 
      : currentUser.department_name;
    const targetTeam = currentUser.role === 'MB' 
      ? currentUser.team_name 
      : taskTeam || assignedMembers[0]?.team_name;

    createTask({
      title,
      description,
      department_name: targetDept,
      team_name: targetTeam,
      assigned_to_ids: assignedToIds,
      assigned_to_names: assignedMembers.map(m => m.full_name),
      is_collaborative: isCollaborative || assignedToIds.length > 1,
      priority,
      status: 'Not Started',
      start_date: startDate,
      due_date: dueDate,
      attachment_url: attachmentUrl,
      additional_instructions: additionalInstructions
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setAssignedToIds([]);
    setIsCollaborative(false);
    setDueDate('');
    setAttachmentUrl('');
    setAdditionalInstructions('');
  };

  const handleUpdateStatus = (taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(taskId, newStatus, completionNotes, {
      progress_update: progressUpdate || undefined,
      proof_url: proofUrl || undefined
    });
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { 
        ...prev, 
        status: newStatus, 
        submission_notes: completionNotes || prev.submission_notes,
        progress_update: progressUpdate || prev.progress_update,
        proof_url: proofUrl || prev.proof_url
      } : null);
    }
    setCompletionNotes('');
  };

  const handleReviewerAction = (taskId: string, approved: boolean) => {
    const newStatus: Task['status'] = approved ? 'Completed' : 'In Progress';
    updateTaskStatus(taskId, newStatus, undefined, {
      reviewer_feedback: reviewerFeedback,
      verified_by_id: currentUser?.id
    });
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status: newStatus,
        reviewer_feedback: reviewerFeedback,
        verified_by_id: currentUser?.id
      } : null);
    }
    setReviewerFeedback('');
  };

  const getPriorityBadge = (p: Task['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s: Task['status']) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending Verification':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Deliverables & Execution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            Task Management System
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            {currentUser?.role === 'LCP' 
              ? 'Complete organisation overview. Create, assign, and track deliverables across all departments.'
              : currentUser?.role === 'LCVP'
              ? `Department scope (${currentUser.department_name}). Assign deliverables to MBs and GBs.`
              : currentUser?.role === 'MB'
              ? `Team scope (${currentUser.team_name || 'My Team'}). Assign and monitor team member tasks.`
              : 'View deliverables assigned to you and collaborative tasks for your team.'}
          </p>
        </div>

        {canAssignTasks && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </button>
        )}
      </div>

      {/* Team Progress Overview Metric Card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="saas-card p-4">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Total Visible</span>
          <p className="text-2xl font-black text-[#20243A] mt-1">{metrics.total}</p>
          <span className="text-[10px] text-[#73798D]">Tasks in your scope</span>
        </div>

        <div className="saas-card p-4">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">In Progress</span>
          <p className="text-2xl font-black text-[#4658E8] mt-1">{metrics.inProgress}</p>
          <span className="text-[10px] text-[#73798D]">Being executed</span>
        </div>

        <div className="saas-card p-4">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Completed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.completed}</p>
          <span className="text-[10px] text-[#73798D]">Successfully closed</span>
        </div>

        <div className="saas-card p-4">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Pending Review</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{metrics.pendingVerification}</p>
          <span className="text-[10px] text-[#73798D]">Awaiting sign-off</span>
        </div>

        <div className="saas-card p-4 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Team Completion</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-[#20243A]">{metrics.percentage}%</span>
          </div>
          <div className="w-full bg-[#F0F2FF] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#4658E8] to-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-[#73798D] flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-[#4658E8]" /> Filter:
        </span>
        {(['ALL', 'Not Started', 'In Progress', 'Pending Verification', 'Completed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === status
                ? 'bg-[#20243A] text-white shadow-xs'
                : 'bg-white text-[#73798D] border border-[#E8EAF2] hover:bg-[#F0F2FF]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task Cards Grid / Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-16 saas-card max-w-xl mx-auto w-full p-8 space-y-3">
            <CheckSquare className="w-10 h-10 text-[#73798D]/40 mx-auto" />
            <h4 className="text-base font-bold text-[#20243A]">No tasks assigned yet.</h4>
            <p className="text-xs text-[#73798D] leading-relaxed">
              {canAssignTasks
                ? 'You can create and assign deliverables to members in your scope using the "Create & Assign Task" button.'
                : 'Tasks assigned to you or your team will appear here.'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isAssignedToMe = currentUser && task.assigned_to_ids.includes(currentUser.id);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="saas-card p-5 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#20243A] group-hover:text-[#4658E8] transition-colors leading-snug">
                    {task.title}
                  </h3>

                  <p className="text-xs text-[#73798D] mt-2 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#E8EAF2] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#73798D]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#4658E8]" />
                      Due: {task.due_date}
                    </span>
                    <span className="text-[11px] font-semibold text-[#20243A]">
                      By {task.assigned_by_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] text-[#73798D]">Assigned:</span>
                      <span className="text-[11px] font-bold text-[#20243A] truncate max-w-[150px]">
                        {task.assigned_to_names.join(', ')}
                      </span>
                    </div>

                    {isAssignedToMe && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E9EAFE] text-[#4658E8] border border-[#8175E8]/20">
                        My Task
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-[#17243A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#E8EAF2]">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-5 right-5 text-[#73798D] hover:text-[#20243A] text-lg font-bold p-1 rounded-lg hover:bg-[#F0F2FF]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadge(selectedTask.priority)}`}>
                {selectedTask.priority} Priority
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(selectedTask.status)}`}>
                {selectedTask.status}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-[#20243A] leading-snug">{selectedTask.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-[#73798D]">Assigned by: <strong className="text-[#20243A]">{selectedTask.assigned_by_name}</strong> ({selectedTask.assigned_by_role})</p>
              {selectedTask.is_collaborative && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E9EAFE] text-[#8175E8] border border-[#8175E8]/20">
                  Collaborative Task
                </span>
              )}
            </div>

            <div className="my-5 p-4 rounded-2xl bg-[#F8F9FD] border border-[#E8EAF2] text-xs text-[#20243A] leading-relaxed">
              <h4 className="font-bold text-[#20243A] mb-1.5 text-[11px] uppercase tracking-wider">Task Brief:</h4>
              <p className="whitespace-pre-line text-[#73798D]">{selectedTask.description}</p>
              {selectedTask.additional_instructions && (
                <div className="mt-3 pt-3 border-t border-[#E8EAF2] text-[#73798D]">
                  <span className="font-bold block text-[11px] text-[#20243A]">Additional Instructions:</span>
                  <p className="whitespace-pre-line mt-0.5">{selectedTask.additional_instructions}</p>
                </div>
              )}
            </div>

            {selectedTask.attachment_url && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#EAF2FF] border border-[#4658E8]/20 text-xs">
                <a 
                  href={selectedTask.attachment_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-bold text-[#4658E8] hover:underline flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Attached Guidelines / Reference Document</span>
                </a>
              </div>
            )}

            <div className="space-y-2 text-xs text-[#73798D] border-t border-[#E8EAF2] pt-3.5">
              <div className="flex justify-between">
                <span>Assigned To:</span>
                <span className="font-bold text-[#20243A]">{selectedTask.assigned_to_names.join(', ')}</span>
              </div>
              {selectedTask.start_date && (
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-bold text-[#20243A]">{selectedTask.start_date}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-bold text-[#20243A]">{selectedTask.due_date}</span>
              </div>
              {selectedTask.proof_url && (
                <div className="p-2.5 rounded-lg bg-blue-50/50 text-blue-900 text-xs flex items-center justify-between mt-2">
                  <span className="font-semibold">Submitted Proof:</span>
                  <a href={selectedTask.proof_url} target="_blank" rel="noreferrer" className="text-[#037ef3] font-bold hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> View Work Proof
                  </a>
                </div>
              )}
              {selectedTask.progress_update && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] mt-2">
                  <span className="font-bold block text-slate-900">Latest Member Progress Update:</span>
                  {selectedTask.progress_update}
                </div>
              )}
              {selectedTask.submission_notes && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] mt-2">
                  <span className="font-bold block">Completion / Submission Note:</span>
                  {selectedTask.submission_notes}
                </div>
              )}
              {selectedTask.reviewer_feedback && (
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-[11px] mt-2 border border-purple-200">
                  <span className="font-bold block">Assigner Feedback:</span>
                  {selectedTask.reviewer_feedback}
                </div>
              )}
            </div>

            {/* MEMBER ACTIONS: UPDATE STATUS, LOG PROGRESS, SUBMIT PROOF */}
            {currentUser && selectedTask.assigned_to_ids.includes(currentUser.id) && (
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-[#037ef3] uppercase tracking-wider block">
                  Member Actions & Submission:
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Progress Update</label>
                    <input
                      type="text"
                      value={progressUpdate}
                      onChange={e => setProgressUpdate(e.target.value)}
                      placeholder="e.g. Completed initial outreach, contacting 5 colleges..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Proof / Deliverable Link</label>
                    <input
                      type="url"
                      value={proofUrl}
                      onChange={e => setProofUrl(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Summary</label>
                    <input
                      type="text"
                      value={completionNotes}
                      onChange={e => setCompletionNotes(e.target.value)}
                      placeholder="Brief note on deliverables..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'In Progress')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      selectedTask.status === 'In Progress'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Save In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'Pending Verification')}
                    className="py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                  >
                    Submit for Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'Completed')}
                    className="py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Mark Done
                  </button>
                </div>
              </div>
            )}

            {/* ASSIGNER / LEADER ACTIONS: REVIEW, APPROVE, REJECT, ADD FEEDBACK */}
            {currentUser && (currentUser.id === selectedTask.assigned_by_id || currentUser.role === 'LCP' || (currentUser.role === 'LCVP' && selectedTask.department_name === currentUser.department_name)) && (
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                  Assigner / Leader Review & Sign-Off:
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Review Feedback</label>
                  <input
                    type="text"
                    value={reviewerFeedback}
                    onChange={e => setReviewerFeedback(e.target.value)}
                    placeholder="Enter feedback or change requests for the assignee..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                  />
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => handleReviewerAction(selectedTask.id, true)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Approve Completion
                  </button>
                  <button
                    onClick={() => handleReviewerAction(selectedTask.id, false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                  >
                    Request Revision / Reject
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && canAssignTasks && (
        <div className="fixed inset-0 z-50 bg-[#17243A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E8EAF2]">
            <h3 className="text-lg font-extrabold text-[#20243A] mb-4">Assign New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#20243A] mb-1">Task Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Conduct College Outreach"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A]"
                />
              </div>

              {/* LCP can select Department & Team */}
              {currentUser?.role === 'LCP' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#20243A] mb-1">Department</label>
                    <select
                      value={taskDept}
                      onChange={e => setTaskDept(e.target.value as DepartmentName)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8EAF2] text-xs bg-[#F8F9FD] focus:bg-white text-[#20243A] focus:outline-[#4658E8]"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#20243A] mb-1">Team (Optional)</label>
                    <input
                      type="text"
                      value={taskTeam}
                      onChange={e => setTaskTeam(e.target.value)}
                      placeholder="e.g. Campus Launchers"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8EAF2] text-xs bg-[#F8F9FD] focus:bg-white text-[#20243A] focus:outline-[#4658E8]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To Member(s) * ({currentUser?.role === 'MB' ? `GBs in ${currentUser.team_name}` : currentUser?.role === 'LCVP' ? `Members in ${currentUser.department_name}` : 'Eligible Members'})
                </label>
                {assignableMembers.length === 0 ? (
                  <p className="text-xs text-red-500 py-1">
                    No eligible members found in this scope to assign.
                  </p>
                ) : (
                  <select
                    multiple
                    value={assignedToIds}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      setAssignedToIds(options);
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3] bg-white min-h-[90px] max-h-[180px] overflow-y-auto"
                  >
                    {assignableMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role} • {m.designation})
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">Hold Ctrl (or Cmd) to select multiple members for a collaborative task.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline / Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="collabTask"
                  checked={isCollaborative}
                  onChange={e => setIsCollaborative(e.target.checked)}
                  className="rounded text-[#037ef3]"
                />
                <label htmlFor="collabTask" className="text-xs font-semibold text-slate-700">
                  Mark as Collaborative Task (Multi-member joint deliverable)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Deliverables & Scope *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Clear instructions on what needs to be delivered and verified..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Instructions</label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={e => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Include meeting notes in minutes doc; submit by 6 PM"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Guidelines Link</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={e => setAttachmentUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F0F2FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignableMembers.length === 0}
                  className="saas-btn-primary px-5 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
