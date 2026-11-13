import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Plus, 
  ChevronRight, 
  Filter, 
  MessageSquare, 
  AlertCircle,
  Search,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DepartmentName, PDPTarget, UserProfile } from '../types';

export const SKILL_CATEGORIES: Record<string, string[]> = {
  'Communication and Interpersonal Skills': [
    'Communication',
    'Public Speaking',
    'Presentation Skills',
    'Active Listening',
    'Negotiation',
    'Conflict Management',
    'Teamwork',
    'Leadership'
  ],
  'Business and Sales Skills': [
    'Sales',
    'Pitching',
    'Lead Generation',
    'Client Management',
    'Business Development',
    'Marketing',
    'Market Research',
    'Customer Relationship Management'
  ],
  'Digital and Professional Skills': [
    'LinkedIn',
    'Networking',
    'Personal Branding',
    'Content Creation',
    'Social Media Management',
    'Excel',
    'Data Analysis',
    'Project Management',
    'Time Management'
  ],
  'Personal Growth': [
    'Confidence',
    'Decision Making',
    'Problem Solving',
    'Critical Thinking',
    'Adaptability',
    'Discipline',
    'Consistency'
  ]
};

export const PDPPage: React.FC = () => {
  const { 
    pdpTargets, 
    members, 
    departments, 
    currentUser, 
    addPDPTarget, 
    updatePDPAchievement,
    updatePDPTarget,
    deletePDPTarget 
  } = useApp();

  const [activeView, setActiveView] = useState<'my_pdp' | 'dept_overview'>('my_pdp');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<DepartmentName>(
    currentUser?.department_name || 'iGV'
  );
  const [selectedMemberPDP, setSelectedMemberPDP] = useState<UserProfile | null>(null);

  // Target creation modal (Every member can create targets!)
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PDPTarget['category']>('Communication and Interpersonal Skills');
  const [selectedSkill, setSelectedSkill] = useState('Communication');
  const [customSkill, setCustomSkill] = useState('');
  const [isCustomSkill, setIsCustomSkill] = useState(false);

  const [targetMetric, setTargetMetric] = useState('');
  const [reason, setReason] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');

  // Target Update / Reflection modal
  const [editingTarget, setEditingTarget] = useState<PDPTarget | null>(null);
  const [updateProgressPct, setUpdateProgressPct] = useState<number>(0);
  const [updateStatus, setUpdateStatus] = useState<PDPTarget['status']>('In Progress');
  const [updateAchievements, setUpdateAchievements] = useState('');
  const [updateReflection, setUpdateReflection] = useState('');
  const [leaderFeedback, setLeaderFeedback] = useState('');
  const [leaderImprovement, setLeaderImprovement] = useState('');

  const isLeader = currentUser?.role && ['LCP', 'LCVP', 'MB'].includes(currentUser.role);

  // My Personal PDP Targets
  const myTargets = useMemo(() => {
    if (!currentUser) return [];
    return pdpTargets.filter(p => p.member_id === currentUser.id);
  }, [pdpTargets, currentUser]);

  // Overall calculations for Top Overview
  const myTotalTargets = myTargets.length;
  const myCompletedTargets = myTargets.filter(t => t.status === 'Completed' || (t.minimum_target > 0 && t.actual_achieved >= t.minimum_target)).length;
  const myInProgressTargets = myTotalTargets - myCompletedTargets;
  const myOverallProgress = myTotalTargets > 0
    ? Math.round(
        myTargets.reduce((acc, curr) => {
          const pct = curr.minimum_target > 0 
            ? (curr.actual_achieved / curr.minimum_target) * 100 
            : curr.progress_percentage || 0;
          return acc + Math.min(100, pct);
        }, 0) / myTotalTargets
      )
    : 0;

  // Department members in current selected department
  const deptMembers = useMemo(() => {
    return members.filter(m => m.department_name === selectedDeptFilter);
  }, [members, selectedDeptFilter]);

  // Aggregate departmental PDP calculations
  const departmentAggregates = useMemo(() => {
    const deptTargets = pdpTargets.filter(p => {
      const mem = members.find(m => m.id === p.member_id);
      return mem?.department_name === selectedDeptFilter;
    });

    const totalTargets = deptTargets.length;
    const avgPercentage = totalTargets > 0
      ? Math.round(
          deptTargets.reduce((acc, curr) => {
            const pct = curr.minimum_target > 0 ? (curr.actual_achieved / curr.minimum_target) * 100 : 0;
            return acc + Math.min(100, pct);
          }, 0) / totalTargets
        )
      : 0;

    return { totalTargets, avgPercentage, deptTargets };
  }, [pdpTargets, members, selectedDeptFilter]);

  // Filter skills based on search
  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return SKILL_CATEGORIES[selectedCategory as keyof typeof SKILL_CATEGORIES] || [];
    const query = skillSearch.toLowerCase();
    const matches: string[] = [];
    Object.values(SKILL_CATEGORIES).forEach(list => {
      list.forEach(item => {
        if (item.toLowerCase().includes(query) && !matches.includes(item)) {
          matches.push(item);
        }
      });
    });
    return matches;
  }, [skillSearch, selectedCategory]);

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const finalSkillName = isCustomSkill ? customSkill.trim() : selectedSkill;
    if (!finalSkillName) return;

    addPDPTarget({
      member_id: currentUser.id,
      category: selectedCategory,
      skill_name: finalSkillName,
      target_metric: targetMetric.trim() || `Develop ${finalSkillName}`,
      reason: reason.trim(),
      expected_outcome: expectedOutcome.trim(),
      progress_percentage: 0,
      minimum_target: 100,
      actual_achieved: 0,
      unit: '%',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      status: 'In Progress'
    });

    setShowAddTargetModal(false);
    setCustomSkill('');
    setIsCustomSkill(false);
    setTargetMetric('');
    setReason('');
    setExpectedOutcome('');
  };

  const handleOpenEdit = (t: PDPTarget) => {
    setEditingTarget(t);
    setUpdateProgressPct(t.progress_percentage ?? (t.minimum_target > 0 ? Math.round((t.actual_achieved / t.minimum_target) * 100) : 0));
    setUpdateStatus(t.status || 'In Progress');
    setUpdateAchievements(t.current_achievements || '');
    setUpdateReflection(t.reflection_notes || '');
    setLeaderFeedback(t.feedback || '');
    setLeaderImprovement(t.areas_for_improvement || '');
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    const isTargetOwner = currentUser?.id === editingTarget.member_id;
    const canProvideFeedback = isLeader && !isTargetOwner;
    const pct = Math.min(100, Math.max(0, Number(updateProgressPct)));

    updatePDPTarget(editingTarget.id, {
      progress_percentage: pct,
      actual_achieved: pct,
      status: pct >= 100 ? 'Completed' : updateStatus,
      current_achievements: updateAchievements.trim() || editingTarget.current_achievements,
      reflection_notes: updateReflection.trim() || editingTarget.reflection_notes,
      feedback: canProvideFeedback ? leaderFeedback.trim() : editingTarget.feedback,
      areas_for_improvement: canProvideFeedback ? leaderImprovement.trim() : editingTarget.areas_for_improvement
    });

    setEditingTarget(null);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <Target className="w-3.5 h-3.5" />
            <span>Personal Development Plan (PDP) & Growth</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            Personal Development Plan
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            Take ownership of your development in AIESEC. Select skills, set milestones, track achievements, and receive mentorship feedback.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowAddTargetModal(true)}
            className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New PDP Target</span>
          </button>
        </div>
      </div>

      {/* TOP OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 sm:p-5">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Total Targets</span>
          <p className="text-2xl sm:text-3xl font-black text-[#20243A] mt-1">{myTotalTargets}</p>
          <span className="text-[10px] text-[#73798D]">Skills being developed</span>
        </div>

        <div className="saas-card p-4 sm:p-5">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Completed</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{myCompletedTargets}</p>
          <span className="text-[10px] text-[#73798D]">Targets achieved</span>
        </div>

        <div className="saas-card p-4 sm:p-5">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">In Progress</span>
          <p className="text-2xl sm:text-3xl font-black text-[#4658E8] mt-1">{myInProgressTargets}</p>
          <span className="text-[10px] text-[#73798D]">Currently active</span>
        </div>

        <div className="saas-card p-4 sm:p-5">
          <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider">Overall Progress</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#8175E8]">{myOverallProgress}%</span>
          </div>
          <div className="w-full bg-[#F0F2FF] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#4658E8] to-[#8175E8] h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${myOverallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* VIEW TOGGLE: My PDP Targets vs Department Overview */}
      <div className="flex items-center space-x-2 border-b border-[#E8EAF2] pb-2">
        <button
          onClick={() => setActiveView('my_pdp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeView === 'my_pdp'
              ? 'bg-[#20243A] text-white shadow-xs'
              : 'text-[#73798D] hover:bg-[#F0F2FF]'
          }`}
        >
          My Personal Targets ({myTargets.length})
        </button>
        {isLeader && (
          <button
            onClick={() => setActiveView('dept_overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'dept_overview'
                ? 'bg-[#20243A] text-white shadow-xs'
                : 'text-[#73798D] hover:bg-[#F0F2FF]'
            }`}
          >
            Department Overview & Member Reviews
          </button>
        )}
      </div>

      {/* VIEW 1: MY PERSONAL PDP TARGETS CARDS */}
      {activeView === 'my_pdp' && (
        <div className="space-y-5">
          {myTargets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-3">
              <Target className="w-12 h-12 text-[#037ef3] mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-800">You haven't set any PDP targets yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select from our curated list of 30+ skills across Communication, Sales, Digital tools, and Personal growth to create your first personal target.
              </p>
              <button
                onClick={() => setShowAddTargetModal(true)}
                className="mt-3 px-5 py-2.5 rounded-xl bg-[#037ef3] hover:bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create My First Target
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTargets.map(target => {
                const pct = target.minimum_target > 0
                  ? Math.min(100, Math.round((target.actual_achieved / target.minimum_target) * 100))
                  : target.progress_percentage || 0;

                return (
                  <div 
                    key={target.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#037ef3] border border-blue-100 uppercase tracking-wider truncate max-w-[180px]">
                          {target.skill_name || target.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          pct >= 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {pct >= 100 ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {target.target_metric}
                      </h3>

                      {target.reason && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                          "{target.reason}"
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#73798D]">Progress</span>
                          <span className="text-[#4658E8]">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#F0F2FF] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#4658E8] to-[#8175E8]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Latest Achievements or Notes */}
                      {target.current_achievements && (
                        <div className="mt-3 p-3 rounded-xl bg-[#F8F9FD] border border-[#E8EAF2] text-[11px] text-[#20243A]">
                          <strong className="text-[#20243A] block font-semibold mb-0.5">Achievements / Evidence:</strong>
                          <p className="line-clamp-2 text-[#73798D]">{target.current_achievements}</p>
                        </div>
                      )}

                      {/* Feedback from TL */}
                      {target.feedback && (
                        <div className="mt-2 p-3 rounded-xl bg-[#E9EAFE]/60 text-[11px] text-[#20243A] border border-[#8175E8]/20">
                          <strong className="text-[#4658E8] block font-semibold mb-0.5">TL Feedback:</strong>
                          <p className="line-clamp-2 text-[#73798D]">{target.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-[#E8EAF2] flex items-center justify-between">
                      <button
                        onClick={() => handleOpenEdit(target)}
                        className="text-xs font-bold text-[#4658E8] hover:underline flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Update Progress & Notes</span>
                      </button>
                      <button
                        onClick={() => deletePDPTarget(target.id)}
                        className="text-[#73798D] hover:text-rose-600 transition-colors p-1"
                        title="Delete target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DEPARTMENT OVERVIEW & REVIEWS (FOR LEADERS) */}
      {activeView === 'dept_overview' && isLeader && (
        <div className="space-y-6">
          {/* Department Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-2">
              <Filter className="w-3.5 h-3.5" /> Department:
            </span>
            {departments.map(d => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDeptFilter(d.name);
                  setSelectedMemberPDP(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDeptFilter === d.name
                    ? 'bg-[#037ef3] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d.name} Department
              </button>
            ))}
          </div>

          {/* Department-wise Member PDP Directory */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {deptMembers.map(member => {
                const memberTargets = pdpTargets.filter(p => p.member_id === member.id);
                const memberAvgPct = memberTargets.length > 0
                  ? Math.round(
                      memberTargets.reduce((acc, curr) => {
                        const pct = curr.minimum_target > 0 ? (curr.actual_achieved / curr.minimum_target) * 100 : 0;
                        return acc + Math.min(100, pct);
                      }, 0) / memberTargets.length
                    )
                  : 0;

                const isSelected = selectedMemberPDP?.id === member.id;

                return (
                  <div key={member.id}>
                    <div
                      onClick={() => setSelectedMemberPDP(isSelected ? null : member)}
                      className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900">{member.full_name}</h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">{member.role}</span>
                          </div>
                          <p className="text-xs text-slate-500">{member.designation}</p>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">{memberTargets.length} targets set</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="w-32 sm:w-48 text-right hidden sm:block">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-400">Achieved:</span>
                            <span className="text-[#037ef3]">{memberAvgPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full bg-[#037ef3]" style={{ width: `${memberAvgPct}%` }} />
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${isSelected ? 'rotate-90 text-[#037ef3]' : ''}`} />
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-6 bg-slate-50/70 border-t border-slate-100 space-y-4">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Targets for {member.full_name} (Click target to add feedback & mentorship notes)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {memberTargets.map(t => (
                            <div
                              key={t.id}
                              onClick={() => handleOpenEdit(t)}
                              className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#037ef3] cursor-pointer transition-all shadow-xs"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-900">{t.skill_name || t.target_metric}</span>
                                <span className="text-xs font-black text-[#037ef3]">{t.actual_achieved}/{t.minimum_target} {t.unit}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{t.target_metric}</p>
                              {t.feedback && (
                                <p className="text-[11px] text-purple-700 mt-2 bg-purple-50 p-2 rounded-lg">
                                  <strong>Feedback:</strong> {t.feedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW PDP TARGET (WITH SEARCHABLE 30+ SKILLS) */}
      {showAddTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Personal Development Plan (PDP) Target</h3>
              <button
                onClick={() => setShowAddTargetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-4 text-xs">
              {/* Category Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Competency Area *
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => {
                    const cat = e.target.value as any;
                    setSelectedCategory(cat);
                    const list = SKILL_CATEGORIES[cat] || [];
                    if (list.length > 0) setSelectedSkill(list[0]);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-[#037ef3]"
                >
                  {Object.keys(SKILL_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other / Custom Category</option>
                </select>
              </div>

              {/* Skill Selection or Search */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Skill to Develop *
                </label>
                
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    placeholder="Search from 30+ skills (e.g. Sales, Public Speaking, Excel)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                  />
                </div>

                {!isCustomSkill ? (
                  <div>
                    <select
                      value={selectedSkill}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setIsCustomSkill(true);
                        } else {
                          setSelectedSkill(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-[#037ef3]"
                    >
                      {filteredSkills.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__custom__">+ Enter Custom Skill...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={e => setCustomSkill(e.target.value)}
                      placeholder="Type custom skill name..."
                      required
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomSkill(false)}
                      className="px-3 py-1 rounded-xl border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      Back to list
                    </button>
                  </div>
                )}
              </div>

              {/* Objective Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Objective / Target Metric *
                </label>
                <input
                  type="text"
                  value={targetMetric}
                  onChange={e => setTargetMetric(e.target.value)}
                  placeholder="e.g. Deliver 10 college presentations; pitch to 15 corporate leads"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              {/* Why you want to develop it */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Why do you want to develop this skill?
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Crucial for my upcoming role transition to Team Leader and future career in client servicing..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              {/* Target & Expected Outcome */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Outcome / Success Criteria
                </label>
                <textarea
                  rows={2}
                  value={expectedOutcome}
                  onChange={e => setExpectedOutcome(e.target.value)}
                  placeholder="e.g. Confidently conduct partner pitches independently without supervision"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTargetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#037ef3] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Create PDP Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE TARGET PROGRESS & MENTORSHIP NOTES */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update PDP Target Progress</h3>
                <p className="text-xs text-slate-500">{editingTarget.skill_name || editingTarget.target_metric}</p>
              </div>
              <button
                onClick={() => setEditingTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Progress Percentage (0 - 100%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={updateProgressPct}
                    onChange={e => setUpdateProgressPct(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={updateStatus}
                    onChange={e => setUpdateStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-[#037ef3]"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Achievements & Evidence
                </label>
                <textarea
                  rows={2}
                  value={updateAchievements}
                  onChange={e => setUpdateAchievements(e.target.value)}
                  placeholder="Record what you achieved, certificates, drive links or deliverables..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reflection / Learning Notes
                </label>
                <textarea
                  rows={2}
                  value={updateReflection}
                  onChange={e => setUpdateReflection(e.target.value)}
                  placeholder="What key lessons have you learned during this cycle? What went well?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-[#037ef3]"
                />
              </div>

              {/* Feedback section - Leaders only */}
              {isLeader && currentUser?.id !== editingTarget.member_id && (
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                    Leadership Feedback (TL / LCVP):
                  </span>
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">Team Leader Feedback</label>
                    <textarea
                      rows={2}
                      value={leaderFeedback}
                      onChange={e => setLeaderFeedback(e.target.value)}
                      placeholder="Positive reinforcement and mentorship remarks..."
                      className="w-full px-3 py-1.5 rounded-xl border border-purple-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">Areas Requiring Improvement</label>
                    <textarea
                      rows={2}
                      value={leaderImprovement}
                      onChange={e => setLeaderImprovement(e.target.value)}
                      placeholder="Next steps, suggestions to overcome roadblocks..."
                      className="w-full px-3 py-1.5 rounded-xl border border-purple-200 text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#037ef3] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
