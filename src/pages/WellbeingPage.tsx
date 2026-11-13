import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, 
  MessageSquare, 
  AlertCircle, 
  ClipboardList, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Lock,
  ExternalLink,
  ChevronRight,
  Clock,
  Send,
  Edit3,
  Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MemberCheckIn, MemberConcern, DepartmentName } from '../types';

export const WellbeingPage: React.FC = () => {
  const { 
    currentUser, 
    members, 
    memberConcerns, 
    submitConcern, 
    updateConcernStatus 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'concerns' | 'surveys'>('concerns');

  // MES link management (LCP/LCVP only)
  const [mesUrl, setMesUrl] = useState('https://forms.gle/aiesec-mumbai-mes-survey');
  const [engagementUrl, setEngagementUrl] = useState('https://forms.gle/aiesec-mumbai-engagement-pulse');
  const [isEditingMesUrl, setIsEditingMesUrl] = useState(false);
  const [isEditingEngagementUrl, setIsEditingEngagementUrl] = useState(false);
  const [editMesUrl, setEditMesUrl] = useState('');
  const [editEngagementUrl, setEditEngagementUrl] = useState('');

  const canManageMESLinks = currentUser?.role === 'LCP' || currentUser?.role === 'LCVP';

  // Modals
  const [showConcernModal, setShowConcernModal] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<MemberConcern | null>(null);

  // Concern form states
  const [targetPersonId, setTargetPersonId] = useState('');
  const [concernSubject, setConcernSubject] = useState('');
  const [concernCategory, setConcernCategory] = useState<MemberConcern['category']>('Personal Wellbeing');
  const [concernDesc, setConcernDesc] = useState('');
  const [concernSubmittedSuccess, setConcernSubmittedSuccess] = useState(false);

  // Resolution state
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Potential persons a member can raise a concern to:
  // All LCPs, LCVPs, and team leaders
  const eligiblePersons = useMemo(() => {
    if (!currentUser) return [];
    return members.filter(m => m.id !== currentUser.id);
  }, [members, currentUser]);

  // Private concerns visibility rules:
  // Visible ONLY to:
  // 1. The member who raised it (m.member_id === currentUser.id)
  // 2. The specific person to whom the concern was addressed (m.target_person_id === currentUser.id)
  // 3. The department head (LCVP) of that member's department (currentUser.role === 'LCVP' && currentUser.department_name === m.department_name)
  // 4. LCP (Local Committee President oversight)
  const visibleConcerns = useMemo(() => {
    if (!currentUser) return [];
    return memberConcerns.filter(c => {
      // 1. Own concern
      if (c.member_id === currentUser.id) return true;
      // 2. Addressed directly to this specific person
      if (c.target_person_id === currentUser.id) return true;
      // 3. Department head (LCVP) of that member's department
      if (currentUser.role === 'LCVP' && c.department_name && currentUser.department_name === c.department_name) return true;
      // 4. LCP
      if (currentUser.role === 'LCP') return true;
      return false;
    });
  }, [memberConcerns, currentUser]);

  const handleCreateConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernSubject.trim() || !concernDesc.trim() || !currentUser) return;

    const targetPerson = members.find(m => m.id === targetPersonId);

    submitConcern({
      subject: concernSubject.trim(),
      category: concernCategory,
      description: concernDesc.trim(),
      target_person_id: targetPersonId || undefined,
      target_person_name: targetPerson ? `${targetPerson.full_name} (${targetPerson.role})` : undefined
    });

    setShowConcernModal(false);
    setConcernSubject('');
    setConcernDesc('');
    setTargetPersonId('');
    setConcernSubmittedSuccess(true);
    setTimeout(() => setConcernSubmittedSuccess(false), 5000);
  };

  const handleResolveConcern = (concernId: string) => {
    updateConcernStatus(concernId, 'Resolved', resolutionNotes || 'Addressed during support check-in.');
    setSelectedConcern(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Member Experience & Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            Membership Wellbeing
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            A dedicated sanctuary to support member wellness, safely voice confidential concerns to specific leaders, and access official membership surveys.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConcernModal(true)}
            className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Raise Private Concern</span>
          </button>
        </div>
      </div>

      {concernSubmittedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your private concern has been safely submitted. It is strictly confidential and visible only to the addressed person, your department head (LCVP), and LCP.</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E8EAF2] overflow-x-auto space-x-2 sm:space-x-3">
        {[
          { id: 'concerns', label: `Private Concerns (${visibleConcerns.length})`, icon: AlertCircle },
          { id: 'surveys', label: 'Surveys & MES Feedback', icon: ClipboardList },
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
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#4658E8]' : 'text-[#73798D]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 2: PRIVATE CONCERNS */}
      {activeTab === 'concerns' && (
        <div className="bg-white rounded-3xl border border-[#E8EAF2] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#20243A]">Private Member Concerns & Support</h3>
              <p className="text-xs text-[#73798D]">Confidential channel for academic balance, workload, and team dynamics</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-[#73798D]">
              <Lock className="w-3.5 h-3.5 text-[#4658E8]" />
              <span>Encrypted & Confidential</span>
            </div>
          </div>

          {visibleConcerns.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8EAF2] rounded-2xl max-w-lg mx-auto p-6 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#20243A]">No open concerns</h4>
              <p className="text-xs text-[#73798D]">
                You can raise confidential support requests or workload concerns using the "Raise Private Concern" button.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleConcerns.map(c => (
                <div key={c.id} className="p-4 rounded-2xl border border-[#E8EAF2] bg-white hover:border-[#4658E8]/30 hover:shadow-sm transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E9EAFE] text-[#4658E8] border border-[#8175E8]/20">
                      {c.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#20243A]">{c.subject}</h4>
                  <p className="text-xs text-[#73798D] leading-relaxed p-3 rounded-xl bg-[#F8F9FD] border border-[#E8EAF2]">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8EAF2] text-[11px] text-[#73798D]">
                    <div className="space-y-0.5">
                      <div>Raised by: <strong>{currentUser?.id === c.member_id ? 'You' : c.member_name}</strong> • {c.created_at.split('T')[0]}</div>
                      {c.target_person_name && (
                        <div className="text-[#4658E8] font-medium">Addressed to: <strong>{c.target_person_name}</strong></div>
                      )}
                    </div>

                    {(currentUser?.id === c.target_person_id || currentUser?.role === 'LCP' || (currentUser?.role === 'LCVP' && c.department_name && currentUser?.department_name === c.department_name)) && c.status !== 'Resolved' && (
                      <button
                        onClick={() => setSelectedConcern(c)}
                        className="text-[#4658E8] font-bold hover:underline"
                      >
                        Resolve / Add Resolution Note
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SURVEYS & MES FEEDBACK */}
      {activeTab === 'surveys' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: MES Form */}
          <div className="bg-white rounded-3xl border border-[#E8EAF2] p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold border border-[#8175E8]/20">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Quarterly Survey</span>
              </div>
              <h3 className="text-xl font-bold text-[#20243A]">Membership Experience Survey (MES)</h3>
              <p className="text-xs text-[#73798D] leading-relaxed">
                Official feedback questionnaire assessing your personal growth, role satisfaction, leadership development, and team culture at AIESEC in Mumbai.
              </p>
            </div>

            {/* MES Link Management (LCP/LCVP only) */}
            {canManageMESLinks && (
              <div className="p-3 rounded-xl bg-[#F0F2FF] border border-[#8175E8]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#20243A] uppercase tracking-wider">MES Form Link (Admin)</span>
                  {!isEditingMesUrl ? (
                    <button
                      onClick={() => { setEditMesUrl(mesUrl); setIsEditingMesUrl(true); }}
                      className="flex items-center space-x-1 text-[10px] font-bold text-[#4658E8] hover:text-[#20243A]"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Link</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setMesUrl(editMesUrl); setIsEditingMesUrl(false); }}
                      className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  )}
                </div>
                {isEditingMesUrl ? (
                  <input
                    type="url"
                    value={editMesUrl}
                    onChange={e => setEditMesUrl(e.target.value)}
                    placeholder="Paste Google Form or survey URL..."
                    className="w-full px-3 py-2 rounded-lg border border-[#8175E8]/30 text-[11px] text-[#20243A] bg-white focus:outline-[#4658E8]"
                  />
                ) : (
                  <p className="text-[10px] text-[#73798D] truncate">{mesUrl}</p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-[#E8EAF2]">
              <a
                href={mesUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl saas-btn-primary text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
              >
                <span>Fill Membership Experience Survey</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[10px] text-[#73798D] mt-1.5 block text-center">
                {canManageMESLinks ? 'Configurable by LCP & LCVP' : 'Configurable survey link (Google Form / Internal)'}
              </span>
            </div>
          </div>

          {/* Section 2: Engagement Survey */}
          <div className="bg-white rounded-3xl border border-[#E8EAF2] p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EAF2FF] text-[#2563EB] text-xs font-bold border border-blue-200">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Monthly Engagement Pulse</span>
              </div>
              <h3 className="text-xl font-bold text-[#20243A]">LC Engagement Pulse Survey</h3>
              <p className="text-xs text-[#73798D] leading-relaxed">
                A quick 2-minute pulse check evaluating weekly committee motivation, team communication frequency, and peer synergy.
              </p>
            </div>

            {/* Engagement Link Management (LCP/LCVP only) */}
            {canManageMESLinks && (
              <div className="p-3 rounded-xl bg-[#F0F2FF] border border-[#8175E8]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#20243A] uppercase tracking-wider">Pulse Survey Link (Admin)</span>
                  {!isEditingEngagementUrl ? (
                    <button
                      onClick={() => { setEditEngagementUrl(engagementUrl); setIsEditingEngagementUrl(true); }}
                      className="flex items-center space-x-1 text-[10px] font-bold text-[#4658E8] hover:text-[#20243A]"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Link</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setEngagementUrl(editEngagementUrl); setIsEditingEngagementUrl(false); }}
                      className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  )}
                </div>
                {isEditingEngagementUrl ? (
                  <input
                    type="url"
                    value={editEngagementUrl}
                    onChange={e => setEditEngagementUrl(e.target.value)}
                    placeholder="Paste Google Form or survey URL..."
                    className="w-full px-3 py-2 rounded-lg border border-[#8175E8]/30 text-[11px] text-[#20243A] bg-white focus:outline-[#4658E8]"
                  />
                ) : (
                  <p className="text-[10px] text-[#73798D] truncate">{engagementUrl}</p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-[#E8EAF2]">
              <a
                href={engagementUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-white hover:bg-[#F0F2FF] text-[#20243A] font-bold text-xs flex items-center justify-center space-x-2 border border-[#E8EAF2] transition-all"
              >
                <span>Open Engagement Survey Link</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#4658E8]" />
              </a>
              <span className="text-[10px] text-[#73798D] mt-1.5 block text-center">
                {canManageMESLinks ? 'Configurable by LCP & LCVP' : 'Configurable pulse questionnaire'}
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Raise Concern Modal */}
      {showConcernModal && (
        <div className="fixed inset-0 z-50 bg-[#20243A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-[#4658E8]" />
              <h3 className="text-lg font-bold text-[#20243A]">Submit Confidential Concern</h3>
            </div>

            <p className="text-xs text-[#73798D]">
              This submission is private. It is confidential and visible ONLY to the specific person you select, your department head (LCVP), and LCP.
            </p>

            <form onSubmit={handleCreateConcern} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Direct Concern To Specific Leader / Member *
                </label>
                <select
                  value={targetPersonId}
                  onChange={e => setTargetPersonId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] font-medium focus:outline-[#4658E8]"
                >
                  <option value="">Select Specific Person (e.g. TL, VP, LCP, Mentor)</option>
                  {eligiblePersons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role} • {p.designation} - {p.department_name || 'Core'})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#73798D] mt-1 block">
                  Only this person and your department VP will have access to this note.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={concernSubject}
                  onChange={e => setConcernSubject(e.target.value)}
                  placeholder="e.g. Exam schedule conflict / team communication"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Concern Category
                </label>
                <select
                  value={concernCategory}
                  onChange={e => setConcernCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                >
                  <option value="Personal Wellbeing">Personal Wellbeing</option>
                  <option value="Workload & Academic Balance">Workload & Academic Balance</option>
                  <option value="Team Dynamics">Team Dynamics</option>
                  <option value="Role Clarity">Role Clarity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Describe what support you require *
                </label>
                <textarea
                  rows={3}
                  value={concernDesc}
                  onChange={e => setConcernDesc(e.target.value)}
                  required
                  placeholder="Share details openly so we can assist you..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EAF2]">
                <button
                  type="button"
                  onClick={() => setShowConcernModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F8F9FD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl saas-btn-primary text-white text-xs font-bold"
                >
                  Submit Confidentially
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Concern Modal */}
      {selectedConcern && (
        <div className="fixed inset-0 z-50 bg-[#20243A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#20243A]">Resolve Member Concern</h3>
            <p className="text-xs text-[#73798D]">Subject: {selectedConcern.subject}</p>

            <div>
              <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                Resolution Actions Taken
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="Document support provided, schedule adjustments, or follow-up agreed upon..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EAF2]">
              <button
                onClick={() => setSelectedConcern(null)}
                className="px-4 py-2 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F8F9FD]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveConcern(selectedConcern.id)}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

