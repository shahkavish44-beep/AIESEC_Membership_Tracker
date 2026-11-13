import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  CheckSquare, 
  Target, 
  Calendar, 
  Mail, 
  UserCheck, 
  ChevronRight, 
  Shield, 
  Clock,
  Edit3,
  Phone,
  Save,
  X,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfilePage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, submissions, tasks, pdpTargets, updateMember, clearAllData } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(currentUser?.full_name || '');
  const [editPersonalEmail, setEditPersonalEmail] = useState(currentUser?.personal_email || '');
  const [editAiesecEmail, setEditAiesecEmail] = useState(currentUser?.aiesec_email || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [editMembershipJoiningDate, setEditMembershipJoiningDate] = useState(
    currentUser?.membership_joining_date || currentUser?.joining_date || ''
  );
  const [editBio, setEditBio] = useState(currentUser?.bio || '');

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-12 space-y-3">
        <h3 className="text-base font-bold text-slate-800">No profile found</h3>
        <p className="text-xs text-slate-500">
          Please sign in or register to view your personal member dashboard.
        </p>
      </div>
    );
  }

  // A. MY WORK & DELIVERABLES (Own tasks or collaborative tasks)
  const myTasks = useMemo(() => {
    return tasks.filter(t => t.assigned_to_ids.includes(currentUser.id));
  }, [tasks, currentUser]);

  const completedTasks = myTasks.filter(t => t.status === 'Completed');

  // B. MY HACKATHON PERFORMANCE
  const myApprovedSubmissions = useMemo(() => {
    return submissions.filter(s => s.member_id === currentUser.id && s.status === 'Approved');
  }, [submissions, currentUser]);

  const myPendingSubmissions = useMemo(() => {
    return submissions.filter(s => s.member_id === currentUser.id && s.status === 'Pending Verification');
  }, [submissions, currentUser]);

  const totalPoints = useMemo(() => {
    return myApprovedSubmissions.reduce((acc, curr) => acc + curr.calculated_points, 0);
  }, [myApprovedSubmissions]);

  // Points breakdown by activity category
  const pointsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    myApprovedSubmissions.forEach(s => {
      map[s.category] = (map[s.category] || 0) + s.calculated_points;
    });
    return Object.entries(map);
  }, [myApprovedSubmissions]);

  // C. MY PDP TARGETS
  const myPdpTargets = useMemo(() => {
    return pdpTargets.filter(p => p.member_id === currentUser.id);
  }, [pdpTargets, currentUser]);

  const overallPdpPercentage = useMemo(() => {
    if (myPdpTargets.length === 0) return 0;
    const total = myPdpTargets.reduce((acc, curr) => {
      const pct = curr.minimum_target > 0 ? (curr.actual_achieved / curr.minimum_target) * 100 : 0;
      return acc + Math.min(100, pct);
    }, 0);
    return Math.round(total / myPdpTargets.length);
  }, [myPdpTargets]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* SECTION A: PERSONAL IDENTITY CARD */}
      <div className="saas-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-[#E9EAFE] shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A]">{currentUser.full_name}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E9EAFE] text-[#4658E8] border border-[#8175E8]/20">
                  {currentUser.role}
                </span>
                {currentUser.role_status === 'Pending Approval' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending LCP Approval
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[#73798D] mt-1">{currentUser.designation}</p>
              <p className="text-xs font-bold text-[#4658E8] mt-0.5">
                {currentUser.department_name ? `${currentUser.department_name} Department` : 'Organisation Core'}
                {currentUser.team_name ? ` • ${currentUser.team_name}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center space-x-4 bg-[#F8F9FD] p-4 rounded-2xl border border-[#E8EAF2]">
            <div className="text-center px-3 border-r border-[#E8EAF2]">
              <span className="text-[10px] font-bold text-[#73798D] uppercase tracking-wider block">My Points</span>
              <span className="text-2xl font-black text-[#4658E8]">{totalPoints}</span>
            </div>
            <div className="text-center px-3 border-r border-[#E8EAF2]">
              <span className="text-[10px] font-bold text-[#73798D] uppercase tracking-wider block">Completed</span>
              <span className="text-2xl font-black text-emerald-600">{completedTasks.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-bold text-[#73798D] uppercase tracking-wider block">PDP Achieved</span>
              <span className="text-2xl font-black text-[#8175E8]">{overallPdpPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E8EAF2] text-xs">
          <div className="flex items-center space-x-2 text-[#73798D]">
            <Mail className="w-4 h-4 text-[#73798D]" />
            <div className="leading-tight">
              <span className="text-[10px] text-[#73798D] block font-medium">AIESEC Email:</span>
              <span className="font-semibold text-[#20243A]">{currentUser.aiesec_email || currentUser.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[#73798D]">
            <Mail className="w-4 h-4 text-[#73798D]" />
            <div className="leading-tight">
              <span className="text-[10px] text-[#73798D] block font-medium">Personal Email:</span>
              <span className="font-semibold text-[#20243A]">{currentUser.personal_email || 'Not added'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[#73798D]">
            <Calendar className="w-4 h-4 text-[#73798D]" />
            <div className="leading-tight">
              <span className="text-[10px] text-[#73798D] block font-medium">AIESEC Joining Date:</span>
              <strong className="text-[#20243A]">{currentUser.membership_joining_date || currentUser.joining_date}</strong>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[#73798D]">
            <UserCheck className="w-4 h-4 text-[#73798D]" />
            <div className="leading-tight">
              <span className="text-[10px] text-[#73798D] block font-medium">Reports To:</span>
              <strong className="text-[#20243A]">{currentUser.reporting_to || 'Department LCVP'}</strong>
            </div>
          </div>
        </div>

        {currentUser.phone && (
          <div className="mt-3 text-xs text-[#73798D] flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#73798D]" />
            <span>Phone: <strong className="text-[#20243A]">{currentUser.phone}</strong></span>
          </div>
        )}

        {currentUser.bio && (
          <p className="text-xs text-[#73798D] mt-4 p-3.5 bg-[#F8F9FD] rounded-2xl border border-[#E8EAF2] leading-relaxed italic">
            "{currentUser.bio}"
          </p>
        )}

        {/* Edit Profile Button */}
        <div className="mt-4 pt-4 border-t border-[#E8EAF2] flex justify-end">
          <button
            onClick={() => {
              setEditFullName(currentUser.full_name);
              setEditPersonalEmail(currentUser.personal_email || '');
              setEditAiesecEmail(currentUser.aiesec_email || currentUser.email);
              setEditPhone(currentUser.phone || '');
              setEditAvatarUrl(currentUser.avatar_url || '');
              setEditMembershipJoiningDate(currentUser.membership_joining_date || currentUser.joining_date || '');
              setEditBio(currentUser.bio || '');
              setIsEditingProfile(true);
            }}
            className="saas-btn-secondary px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#4658E8]" />
            <span>Edit My Profile</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Member Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateMember(currentUser.id, {
                  full_name: editFullName.trim(),
                  personal_email: editPersonalEmail.trim(),
                  aiesec_email: editAiesecEmail.trim(),
                  phone: editPhone.trim(),
                  avatar_url: editAvatarUrl.trim() || currentUser.avatar_url,
                  membership_joining_date: editMembershipJoiningDate,
                  bio: editBio.trim()
                });
                setIsEditingProfile(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    AIESEC Email *
                  </label>
                  <input
                    type="email"
                    value={editAiesecEmail}
                    onChange={e => setEditAiesecEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    value={editPersonalEmail}
                    onChange={e => setEditPersonalEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#037ef3] uppercase tracking-wider mb-1">
                    AIESEC Joining Date (Official) *
                  </label>
                  <input
                    type="date"
                    value={editMembershipJoiningDate}
                    onChange={e => setEditMembershipJoiningDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs focus:outline-[#037ef3]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Your actual start date in AIESEC.</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={e => setEditAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bio / Introduction
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell your LC about yourself and what you aspire to achieve in your term..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              {/* Notice about restricted fields */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Restricted Fields:</strong> Role ({currentUser.role}), Department ({currentUser.department_name || 'Core'}), and Team assignments can only be modified by an authorised Local Committee President (LCP).
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#037ef3] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section: My Hackathon Performance */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Hackathon Performance</h2>
              <p className="text-xs text-slate-500">Verified point ledger and activity breakdown</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('hackathon')}
            className="text-xs font-bold text-[#037ef3] hover:underline flex items-center space-x-1"
          >
            <span>Log More Work</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Points summary card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700">Total Approved Contributions:</span>
            <p className="text-[11px] text-slate-500">{myApprovedSubmissions.length} verified submissions credited</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#037ef3]">{totalPoints}</span>
            <span className="text-xs font-bold text-slate-500 ml-1">pts</span>
          </div>
        </div>

        {/* Points by Category */}
        {pointsByCategory.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Points by Category
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {pointsByCategory.map(([cat, pts]) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-medium">
                  <span className="text-slate-700">{cat}</span>
                  <span className="font-black text-[#037ef3]">+{pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Verifications */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pending Submissions ({myPendingSubmissions.length})
            </h4>
            <span className="text-[10px] text-amber-600 font-bold">Awaiting Sign-off</span>
          </div>
          {myPendingSubmissions.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">No submissions currently pending verification.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {myPendingSubmissions.map(sub => (
                <div key={sub.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{sub.activity_name}</span>
                    <span className="text-amber-700">+{sub.calculated_points} pts</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{sub.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid: My PDP Targets & Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION D: MY PDP DEVELOPMENT TARGETS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">My PDP Targets & Growth</h2>
                <p className="text-xs text-slate-500">Monthly targets, actuals, and completion</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pdp')}
              className="text-xs font-bold text-purple-600 hover:underline flex items-center space-x-1"
            >
              <span>View PDP Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Average progress bar */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
              <span className="text-slate-700">Overall Term Achievement</span>
              <span className="text-purple-700">{overallPdpPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${overallPdpPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {myPdpTargets.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No PDP targets registered for your profile yet.</p>
            ) : (
              myPdpTargets.map(target => {
                const pct = target.minimum_target > 0
                  ? Math.round((target.actual_achieved / target.minimum_target) * 100)
                  : 0;
                return (
                  <div key={target.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{target.target_metric}</span>
                      <span className="font-black text-[#037ef3]">{pct}%</span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Target: {target.minimum_target} {target.unit}</span>
                      <span className="font-bold text-slate-700">Achieved: {target.actual_achieved} {target.unit}</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#037ef3] h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION E: MY TASKS & DELIVERABLES */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-[#037ef3]">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Assigned Tasks & Execution</h2>
                <p className="text-xs text-slate-500">Deliverables personally assigned to you or your team</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-[#037ef3] hover:underline flex items-center space-x-1"
            >
              <span>Task Manager</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-2xl">
                No tasks currently assigned to you.
              </p>
            ) : (
              myTasks.slice(0, 4).map(t => (
                <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{t.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Due: {t.due_date} • By {t.assigned_by_name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{t.priority} Priority</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION E: DANGER ZONE / DATA RESET (LCP ONLY) */}
        {currentUser.role === 'LCP' && (
          <div className="bg-red-50/50 rounded-3xl border border-red-200/80 p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-red-950">System Administration & Data Reset</h3>
                <p className="text-xs text-red-700/80">Local Committee President (LCP) controls</p>
              </div>
            </div>

            <p className="text-xs text-red-800/90 leading-relaxed">
              Resetting website data will clear all registered member accounts, assigned tasks, PDP growth goals, Hackathon points, calendar events, and O2O meeting logs. The portal will return to a clean initialization state.
            </p>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Website Data</span>
            </button>
          </div>
        )}

      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-[#17243A]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-red-200">
            <div className="flex items-center space-x-2.5 text-red-600">
              <div className="p-2 rounded-xl bg-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#17243A]">Reset All Website Data?</h3>
            </div>

            <p className="text-xs text-[#687386] leading-relaxed">
              Are you sure you want to reset all data? This will permanently delete:
            </p>

            <ul className="text-xs text-[#17243A] space-y-1 bg-red-50/70 p-3.5 rounded-xl border border-red-100 list-disc list-inside font-medium">
              <li>All registered accounts & member profiles</li>
              <li>All assigned tasks & submissions</li>
              <li>All PDP goals & skill benchmarks</li>
              <li>All Hackathon points & leaderboard records</li>
              <li>All LC Calendar events & O2O notes</li>
            </ul>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#687386] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setShowResetConfirm(false);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
