import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronRight, 
  Settings, 
  Plus, 
  ExternalLink,
  ShieldCheck,
  Flame,
  BarChart3,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { DepartmentName, ActivityConfig } from '../types';

export const HackathonPage: React.FC = () => {
  const { 
    currentUser, 
    departments, 
    members, 
    activities, 
    submissions, 
    submitWork, 
    verifySubmission,
    addActivity,
    updateActivity,
    deleteActivity
  } = useApp();

  const [activeTab, setActiveTab] = useState<'standings' | 'submit' | 'verification' | 'config' | 'my-history'>('standings');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<DepartmentName | 'ALL'>('ALL');
  const [selectedDepartmentDetail, setSelectedDepartmentDetail] = useState<DepartmentName | null>(null);

  // LOG WORK FORM STATE
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [workDescription, setWorkDescription] = useState<string>('');
  const [proofLink, setProofLink] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // POINTS CONFIG MODAL
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityConfig | null>(null);
  const [newActName, setNewActName] = useState('');
  const [newActCategory, setNewActCategory] = useState<ActivityConfig['category']>('Outreach');
  const [newActPoints, setNewActPoints] = useState<number>(20);
  const [newActRequiresQty, setNewActRequiresQty] = useState<boolean>(true);
  const [newActUnit, setNewActUnit] = useState<string>('leads');
  const [newActDesc, setNewActDesc] = useState<string>('');

  // Rejection reason state
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');

  const isLeader = currentUser?.role && ['LCP', 'EB', 'LCVP', 'MB'].includes(currentUser.role);
  const isAdmin = currentUser?.role && ['LCP', 'EB'].includes(currentUser.role);

  // 1. CALCULATE AUTOMATIC POINTS (from approved submissions only)
  const departmentStats = useMemo(() => {
    return departments.map(dept => {
      const approvedSubmissions = submissions.filter(
        s => s.department_name === dept.name && s.status === 'Approved'
      );
      const totalPoints = approvedSubmissions.reduce((acc, curr) => acc + curr.calculated_points, 0);
      const verifiedActivitiesCount = approvedSubmissions.length;
      return {
        ...dept,
        totalPoints,
        verifiedActivitiesCount,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [departments, submissions]);

  // Member points calculation
  const memberLeaderboard = useMemo(() => {
    const list = members.map(m => {
      const approved = submissions.filter(s => s.member_id === m.id && s.status === 'Approved');
      const totalPoints = approved.reduce((acc, curr) => acc + curr.calculated_points, 0);
      const approvedCount = approved.length;
      return {
        ...m,
        totalPoints,
        approvedCount
      };
    });

    if (selectedDeptFilter !== 'ALL') {
      return list.filter(m => m.department_name === selectedDeptFilter).sort((a, b) => b.totalPoints - a.totalPoints);
    }
    return list.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [members, submissions, selectedDeptFilter]);

  // Selected Activity Info
  const currentActivityConfig = activities.find(a => a.id === selectedActivityId) || activities[0];

  const estimatedPoints = useMemo(() => {
    if (!currentActivityConfig) return 0;
    return currentActivityConfig.requires_quantity 
      ? currentActivityConfig.points * (quantity || 1) 
      : currentActivityConfig.points;
  }, [currentActivityConfig, quantity]);

  // Handle Work Submit
  const handleWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId || !workDescription || !proofLink || !currentUser) return;

    submitWork({
      activity_id: currentActivityConfig.id,
      activity_name: currentActivityConfig.name,
      category: currentActivityConfig.category,
      quantity: currentActivityConfig.requires_quantity ? quantity : 1,
      description: workDescription,
      proof_link: proofLink
    });

    setSubmitSuccessMsg('Work submitted successfully! Pending verification by your Team Leader / LCVP.');
    setWorkDescription('');
    setProofLink('');
    setQuantity(1);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    setTimeout(() => {
      setSubmitSuccessMsg(null);
    }, 5000);
  };

  // Handle Approvals
  const handleApprove = (subId: string) => {
    verifySubmission(subId, 'Approved');
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleRejectConfirm = (subId: string) => {
    verifySubmission(subId, 'Rejected', rejectionReasonText || 'Did not meet verification criteria');
    setRejectingSubId(null);
    setRejectionReasonText('');
  };

  // Activity Configuration handlers
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      updateActivity(editingActivity.id, {
        name: newActName,
        category: newActCategory,
        points: Number(newActPoints),
        requires_quantity: newActRequiresQty,
        unit_name: newActUnit,
        description: newActDesc
      });
    } else {
      addActivity({
        name: newActName,
        category: newActCategory,
        points: Number(newActPoints),
        requires_quantity: newActRequiresQty,
        requires_verification: true,
        unit_name: newActUnit,
        description: newActDesc
      });
    }
    setShowConfigModal(false);
    setEditingActivity(null);
  };

  const openEditActivityModal = (act: ActivityConfig) => {
    setEditingActivity(act);
    setNewActName(act.name);
    setNewActCategory(act.category);
    setNewActPoints(act.points);
    setNewActRequiresQty(act.requires_quantity);
    setNewActUnit(act.unit_name || 'units');
    setNewActDesc(act.description);
    setShowConfigModal(true);
  };

  const openNewActivityModal = () => {
    setEditingActivity(null);
    setNewActName('');
    setNewActCategory('Outreach');
    setNewActPoints(25);
    setNewActRequiresQty(true);
    setNewActUnit('deliveries');
    setNewActDesc('');
    setShowConfigModal(true);
  };

  // Filtered submissions for verification tab (Scoped to role)
  const pendingSubmissions = useMemo(() => {
    return submissions.filter(s => {
      if (s.status !== 'Pending Verification') return false;
      if (!currentUser) return false;
      if (['LCP', 'EB'].includes(currentUser.role)) return true;
      if (currentUser.role === 'LCVP') return s.department_id === currentUser.department_id;
      if (currentUser.role === 'MB') return s.department_id === currentUser.department_id;
      return false;
    });
  }, [submissions, currentUser]);

  // My personal submissions
  const mySubmissions = useMemo(() => {
    if (!currentUser) return [];
    return submissions.filter(s => s.member_id === currentUser.id);
  }, [submissions, currentUser]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <Flame className="w-3.5 h-3.5 text-[#4658E8] fill-[#4658E8]" />
            <span>Hackathon Performance League</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            Department Performance & Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            Real-time automatic point calculations based on verified member work submissions. Submit your daily achievements to lift your department's rank.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('submit')}
            className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Log Your Work</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('config')}
              className="p-2.5 rounded-2xl bg-white hover:bg-[#F0F2FF] border border-[#E8EAF2] text-[#73798D] hover:text-[#20243A] text-xs font-bold transition-colors"
              title="Configure Point System"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E8EAF2] overflow-x-auto space-x-1 sm:space-x-3">
        {[
          { id: 'standings', label: 'Standings & Leaderboard', icon: Trophy },
          { id: 'submit', label: 'Log Your Work', icon: Send },
          ...(isLeader ? [{ id: 'verification', label: `Verify Submissions (${pendingSubmissions.length})`, icon: ShieldCheck }] : []),
          { id: 'my-history', label: 'My Submissions', icon: Clock },
          ...(isAdmin ? [{ id: 'config', label: 'Points System Config', icon: Settings }] : []),
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#4658E8] text-[#4658E8]'
                  : 'border-transparent text-[#73798D] hover:text-[#20243A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STANDINGS & LEADERBOARD */}
      {activeTab === 'standings' && (
        <div className="space-y-8">
          
          {/* Department Standings Cards without unnecessary descriptions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Department Standings</h3>
                <p className="text-xs text-slate-500">Live rankings derived from verified point transactions</p>
              </div>
              <span className="text-xs font-medium text-slate-400">Total Departments: {departmentStats.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departmentStats.map((dept, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDepartmentDetail(selectedDepartmentDetail === dept.name ? null : dept.name)}
                    className={`saas-card p-5 cursor-pointer relative overflow-hidden group ${
                      selectedDepartmentDetail === dept.name 
                        ? 'border-[#4658E8] ring-2 ring-[#E9EAFE]' 
                        : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Rank Badge & Department Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                          rank === 1 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' :
                          rank === 2 ? 'bg-[#E9EAFE] text-[#4658E8] ring-2 ring-[#8175E8]/30' :
                          rank === 3 ? 'bg-[#EAF2FF] text-[#2563EB] ring-2 ring-[#3B82F6]/30' :
                          'bg-[#F0F2FF] text-[#73798D]'
                        }`}>
                          #{rank}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base text-[#20243A] group-hover:text-[#4658E8] transition-colors">
                            {dept.name}
                          </h4>
                          <span className="text-[11px] text-[#73798D]">
                            {dept.verifiedActivitiesCount} verified activities
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-[#4658E8]">
                          {dept.totalPoints}
                        </div>
                        <span className="text-[10px] font-bold text-[#73798D] uppercase tracking-wider">Points</span>
                      </div>
                    </div>

                    {/* Clean drilldown hint */}
                    <div className="mt-4 pt-3 border-t border-[#E8EAF2] flex items-center justify-between text-xs">
                      <span className="text-[#73798D] text-[11px] font-medium">Click to view contributions</span>
                      <ChevronRight className={`w-4 h-4 text-[#73798D] transition-transform ${selectedDepartmentDetail === dept.name ? 'rotate-90 text-[#4658E8]' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown View (when clicked) */}
          {selectedDepartmentDetail && (
            <div className="bg-[#F0F2FF]/70 rounded-3xl border border-[#E9EAFE] p-6 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-[#4658E8]" />
                  <h3 className="text-base font-bold text-[#20243A]">
                    {selectedDepartmentDetail} Department Contributions & Drilldown
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedDepartmentDetail(null)}
                  className="text-xs text-[#73798D] hover:text-[#20243A] font-bold"
                >
                  Close Drilldown
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Member points within this department */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Contributing Members
                  </h4>
                  <div className="space-y-2">
                    {members.filter(m => m.department_name === selectedDepartmentDetail).length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No members registered in this department yet.</p>
                    ) : (
                      members
                        .filter(m => m.department_name === selectedDepartmentDetail)
                        .map(m => {
                          const approvedSubmissions = submissions.filter(s => s.member_id === m.id && s.status === 'Approved');
                          const points = approvedSubmissions.reduce((acc, curr) => acc + curr.calculated_points, 0);
                          return (
                            <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                              <div className="flex items-center space-x-2.5">
                                <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{m.full_name}</p>
                                  <p className="text-[10px] text-slate-500">{m.designation}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-[#037ef3]">{points} pts</span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Recent department verified activity logs */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Recent Verified Submissions
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {submissions.filter(s => s.department_name === selectedDepartmentDetail && s.status === 'Approved').length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No verified activities for this department yet.</p>
                    ) : (
                      submissions
                        .filter(s => s.department_name === selectedDepartmentDetail && s.status === 'Approved')
                        .slice(0, 5)
                        .map(s => (
                          <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 text-xs">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{s.activity_name}</span>
                              <span className="text-emerald-600">+{s.calculated_points} pts</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">By {s.member_name} • Verified by {s.verifier_name}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Member Leaderboard */}
          <div className="saas-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#20243A]">Individual Member Leaderboard</h3>
                <p className="text-xs text-[#73798D]">Individual rankings across departments based on approved work</p>
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedDeptFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedDeptFilter === 'ALL'
                      ? 'bg-[#20243A] text-white shadow-xs'
                      : 'bg-[#F0F2FF] text-[#73798D] hover:bg-[#E9EAFE]'
                  }`}
                >
                  All
                </button>
                {departments.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeptFilter(d.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedDeptFilter === d.name
                        ? 'bg-[#4658E8] text-white shadow-xs'
                        : 'bg-[#F0F2FF] text-[#73798D] hover:bg-[#E9EAFE]'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Table / Empty state */}
            {memberLeaderboard.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No members found to display on leaderboard. Real members will appear as accounts are registered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E8EAF2] text-[11px] font-bold text-[#73798D] uppercase tracking-wider">
                      <th className="pb-3.5 pl-3">Rank</th>
                      <th className="pb-3.5">Member</th>
                      <th className="pb-3.5">Department</th>
                      <th className="pb-3.5">Verified Activities</th>
                      <th className="pb-3.5 text-right pr-3">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EAF2]">
                    {memberLeaderboard.map((member, index) => {
                      const rank = index + 1;
                      const isSelf = currentUser && member.id === currentUser.id;
                      return (
                        <tr 
                          key={member.id} 
                          className={`hover:bg-[#F0F2FF]/50 transition-colors ${
                            isSelf ? 'bg-[#E9EAFE]/40 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3.5 pl-3">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                              rank === 1 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' :
                              rank === 2 ? 'bg-[#E9EAFE] text-[#4658E8]' :
                              rank === 3 ? 'bg-[#EAF2FF] text-[#2563EB]' :
                              'text-[#73798D]'
                            }`}>
                              {rank}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={member.avatar_url} 
                                alt="" 
                                className="w-9 h-9 rounded-xl object-cover border border-[#E8EAF2]" 
                              />
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-sm font-bold text-[#20243A]">{member.full_name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#E9EAFE] text-[#4658E8] font-bold">You</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400">{member.designation}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                              {member.department_name}
                            </span>
                          </td>
                          <td className="py-3.5 text-xs text-slate-600">
                            {member.approvedCount} approved submissions
                          </td>
                          <td className="py-3.5 text-right pr-3">
                            <span className="text-base font-black text-[#037ef3]">
                              {member.totalPoints}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">pts</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 2: LOG YOUR WORK */}
      {activeTab === 'submit' && (
        <div className="max-w-2xl mx-auto saas-card p-6 sm:p-10 space-y-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-2 border border-[#8175E8]/20">
              <Send className="w-3.5 h-3.5" />
              <span>Work Verification Submission</span>
            </div>
            <h2 className="text-2xl font-black text-[#20243A]">Log Your AIESEC Work</h2>
            <p className="text-xs sm:text-sm text-[#73798D] mt-1 leading-relaxed">
              Submit your completed outreach, meetings, or realization deliverables for team leader approval.
            </p>
          </div>

          {submitSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{submitSuccessMsg}</span>
            </div>
          )}

          {currentUser && (
            <form onSubmit={handleWorkSubmit} className="space-y-5">
              {/* User identification */}
              <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-[#E8EAF2] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover ring-2 ring-[#E9EAFE]" />
                  <div>
                    <p className="text-xs font-bold text-[#20243A]">{currentUser.full_name}</p>
                    <p className="text-[10px] text-[#73798D]">Submitting for: <span className="font-bold text-[#4658E8]">{currentUser.department_name}</span></p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF2FF] text-[#4658E8] border border-[#4658E8]/20">Active Persona</span>
              </div>

              {/* Select Activity */}
              <div>
                <label className="block text-xs font-bold text-[#20243A] uppercase tracking-wider mb-1.5">
                  Select Activity Completed *
                </label>
                <select
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-white font-medium text-[#20243A]"
                >
                  {activities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.name} ({act.points} pts {act.requires_quantity ? `per ${act.unit_name || 'unit'}` : 'flat'})
                    </option>
                  ))}
                </select>
                {currentActivityConfig && (
                  <p className="text-xs text-slate-500 mt-1.5 italic">
                    {currentActivityConfig.description}
                  </p>
                )}
              </div>

              {/* Quantity Input */}
              {currentActivityConfig?.requires_quantity && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Quantity / Volume * ({currentActivityConfig.unit_name || 'units'})
                    </label>
                    <span className="text-xs font-bold text-[#037ef3]">
                      {currentActivityConfig.points} pts / {currentActivityConfig.unit_name || 'unit'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                    required
                  />
                </div>
              )}

              {/* Description of work */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description of Work Performed *
                </label>
                <textarea
                  value={workDescription}
                  onChange={e => setWorkDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Specific details of what was accomplished..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
              </div>

              {/* Proof Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Proof / Verification Link *
                </label>
                <input
                  type="url"
                  value={proofLink}
                  onChange={e => setProofLink(e.target.value)}
                  required
                  placeholder="Google Drive folder, sheet link, photo album, or document"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Verifiers will review this link before approving points. Ensure link access is set to "Anyone with the link".
                </span>
              </div>

              {/* Point Estimation Badge */}
              <div className="p-4 rounded-2xl bg-[#EAF2FF] border border-[#4658E8]/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#20243A]">Estimated Points to be Awarded:</span>
                  <p className="text-[11px] text-[#73798D]">Credited automatically to your profile & department upon verification.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#4658E8]">+{estimatedPoints}</span>
                  <span className="text-xs font-bold text-[#4658E8] ml-1">pts</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl saas-btn-primary text-white font-bold text-sm shadow-md shadow-[#4658E8]/25 transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Work for Approval</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: VERIFICATION DASHBOARD */}
      {activeTab === 'verification' && isLeader && (
        <div className="saas-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#20243A]">Work Verification Dashboard</h3>
              <p className="text-xs text-[#73798D]">
                Authorized verifier: <span className="font-bold text-[#20243A]">{currentUser?.full_name} ({currentUser?.role})</span>
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {pendingSubmissions.length} Pending
            </span>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[#E8EAF2] rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#20243A]">All caught up!</h4>
              <p className="text-xs text-[#73798D] mt-1">There are no pending submissions awaiting review right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="p-5 rounded-2xl border border-[#E8EAF2] bg-[#F8F9FD] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <img src={sub.member_photo} alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#E9EAFE]" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-[#20243A]">{sub.member_name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF2FF] text-[#4658E8] border border-[#4658E8]/20">
                            {sub.department_name}
                          </span>
                        </div>
                        <span className="text-xs text-[#73798D]">Submitted on {new Date(sub.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        +{sub.calculated_points} Points to Credit
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] space-y-1">
                    <div className="flex justify-between font-bold text-[#20243A]">
                      <span>Activity: {sub.activity_name}</span>
                      <span>Qty: {sub.quantity}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{sub.description}</p>
                    <div className="pt-2">
                      <a 
                        href={sub.proof_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center space-x-1 text-xs font-bold text-[#037ef3] hover:underline"
                      >
                        <span>Inspect Proof Documentation</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {rejectingSubId === sub.id ? (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                      <label className="text-xs font-bold text-red-800">Reason for Rejection *</label>
                      <input 
                        type="text" 
                        value={rejectionReasonText}
                        onChange={e => setRejectionReasonText(e.target.value)}
                        placeholder="e.g. Proof link not accessible / invalid receipts"
                        className="w-full px-3 py-1.5 rounded-lg border border-red-300 text-xs focus:outline-red-500 bg-white"
                      />
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setRejectingSubId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleRejectConfirm(sub.id)}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setRejectingSubId(sub.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(sub.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Credit Points</span>
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY SUBMISSIONS HISTORY */}
      {activeTab === 'my-history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">My Submissions & Point History</h3>
              <p className="text-xs text-slate-500">Complete log of all activities you have submitted</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{mySubmissions.length} submissions</span>
          </div>

          <div className="space-y-3">
            {mySubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No work submissions logged yet.</p>
            ) : (
              mySubmissions.map(sub => (
                <div key={sub.id} className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-900">{sub.activity_name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          sub.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          sub.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{sub.description}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-base font-black ${
                        sub.status === 'Approved' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        +{sub.calculated_points} pts
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {sub.verifier_name && (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Reviewed by: {sub.verifier_name}</span>
                      {sub.rejection_reason && (
                        <span className="text-red-500 font-medium">Reason: {sub.rejection_reason}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: POINTS SYSTEM CONFIGURATION (Admin only) */}
      {activeTab === 'config' && isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Configurable Hackathon Point System</h3>
              <p className="text-xs text-slate-500">
                Administrator settings: define qualifying activities, categories, point weights, and units.
              </p>
            </div>
            <button
              onClick={openNewActivityModal}
              className="px-3.5 py-2 rounded-xl bg-[#037ef3] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Activity</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map(act => (
              <div key={act.id} className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#037ef3] uppercase tracking-wider">
                      {act.category}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {act.points} pts {act.requires_quantity ? `/${act.unit_name || 'unit'}` : 'flat'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{act.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{act.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {act.requires_verification ? 'Requires verification' : 'Auto-credited'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditActivityModal(act)}
                      className="text-xs font-bold text-[#037ef3] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteActivity(act.id)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Create Activity Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingActivity ? 'Edit Activity Configuration' : 'Create New Activity'}
            </h3>
            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Name *</label>
                <input 
                  type="text" 
                  value={newActName} 
                  onChange={e => setNewActName(e.target.value)}
                  placeholder="e.g. Campus Canopy Setup"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select 
                    value={newActCategory} 
                    onChange={e => setNewActCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                  >
                    <option value="Outreach">Outreach</option>
                    <option value="Meetings">Meetings</option>
                    <option value="Operations">Operations</option>
                    <option value="Events">Events</option>
                    <option value="Department Milestone">Department Milestone</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Points</label>
                  <input 
                    type="number" 
                    value={newActPoints} 
                    onChange={e => setNewActPoints(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="reqQty"
                  checked={newActRequiresQty} 
                  onChange={e => setNewActRequiresQty(e.target.checked)}
                  className="rounded text-[#037ef3]"
                />
                <label htmlFor="reqQty" className="text-xs font-medium text-slate-700">
                  Points depend on quantity submitted
                </label>
              </div>

              {newActRequiresQty && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Name</label>
                  <input 
                    type="text" 
                    value={newActUnit} 
                    onChange={e => setNewActUnit(e.target.value)}
                    placeholder="e.g. calls, meetings, arrivals"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Criteria & Instructions</label>
                <textarea 
                  value={newActDesc} 
                  onChange={e => setNewActDesc(e.target.value)}
                  rows={2}
                  placeholder="Specify verification rules for this activity..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-[#037ef3]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-[#037ef3] text-white text-xs font-semibold hover:bg-blue-600"
                >
                  Save Activity Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
