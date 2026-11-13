import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Users, 
  Calendar, 
  ExternalLink, 
  Plus, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle2, 
  Shield, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { O2OMeeting, O2OResourceLink, DepartmentName } from '../types';

export const TLAccountabilityPage: React.FC = () => {
  const { 
    currentUser, 
    members, 
    o2oMeetings, 
    o2oResources, 
    createO2OMeeting, 
    updateO2OMeeting, 
    addO2OResource 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'meetings' | 'resources'>('meetings');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // New Meeting form states
  const [targetMemberId, setTargetMemberId] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingType, setMeetingType] = useState<O2OMeeting['meeting_type']>('Bi-Weekly O2O');
  const [meetingStatus, setMeetingStatus] = useState<O2OMeeting['completion_status']>('Completed');
  const [discussionTopics, setDiscussionTopics] = useState('');
  const [discussionSummary, setDiscussionSummary] = useState('');
  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [agreedActionPoints, setAgreedActionPoints] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // New Resource form states
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resCategory, setResCategory] = useState<O2OResourceLink['category']>('O2O Forms');

  const canLeadO2O = currentUser && ['LCP', 'LCVP', 'MB'].includes(currentUser.role);

  // Eligible members for O2O:
  // LCP: all members
  // LCVP: own department MBs and GBs
  // MB: GBs within assigned team
  const eligibleTeamMembers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'LCP') return members.filter(m => m.id !== currentUser.id);
    if (currentUser.role === 'LCVP') return members.filter(m => m.department_name === currentUser.department_name && m.id !== currentUser.id);
    if (currentUser.role === 'MB') {
      return members.filter(m => 
        m.department_name === currentUser.department_name && 
        m.team_name === currentUser.team_name && 
        m.id !== currentUser.id
      );
    }
    return [];
  }, [members, currentUser]);

  // Role permissions for viewing O2O meeting notes:
  // Restricted visibility: conversations are confidential.
  // LCP: All O2O records.
  // LCVP: O2O records within their department.
  // MB: O2O records where they are the leader.
  // GB: Only O2O records where they are the team member.
  const visibleMeetings = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'LCP') return o2oMeetings;
    if (currentUser.role === 'LCVP') return o2oMeetings.filter(m => m.department_name === currentUser.department_name);
    if (currentUser.role === 'MB') return o2oMeetings.filter(m => m.team_leader_id === currentUser.id);
    return o2oMeetings.filter(m => m.team_member_id === currentUser.id);
  }, [o2oMeetings, currentUser]);

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberId || !discussionSummary.trim() || !currentUser) return;

    const targetMem = members.find(m => m.id === targetMemberId);

    createO2OMeeting({
      team_member_id: targetMemberId,
      team_member_name: targetMem ? targetMem.full_name : 'Member',
      department_name: targetMem?.department_name || currentUser.department_name,
      team_name: targetMem?.team_name || currentUser.team_name,
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      meeting_link: meetingLink.trim() || undefined,
      meeting_type: meetingType,
      discussion_topics: discussionTopics.trim() || undefined,
      discussion_summary: discussionSummary.trim(),
      confidential_tl_notes: confidentialNotes.trim() || undefined,
      agreed_action_points: agreedActionPoints.trim(),
      next_follow_up_date: nextFollowUpDate || undefined,
      completion_status: meetingStatus
    });

    setShowMeetingModal(false);
    setDiscussionSummary('');
    setDiscussionTopics('');
    setConfidentialNotes('');
    setAgreedActionPoints('');
    setMeetingLink('');
    setTargetMemberId('');
    setNextFollowUpDate('');
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    addO2OResource({
      title: resTitle.trim(),
      description: resDesc.trim(),
      url: resUrl.trim(),
      category: resCategory
    });

    setShowResourceModal(false);
    setResTitle('');
    setResDesc('');
    setResUrl('');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Team Leader Accountability & 1:1 Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            TL Accountability & O2Os
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            Centralised management for Team Leader 1:1s, O2O follow-ups, agreed action points, and official meeting resource links.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {canLeadO2O && (
            <>
              <button
                onClick={() => setShowResourceModal(true)}
                className="saas-btn-secondary px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-2"
              >
                <LinkIcon className="w-4 h-4 text-[#4658E8]" />
                <span>Add Resource Link</span>
              </button>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Record O2O Meeting</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E8EAF2] overflow-x-auto space-x-2 sm:space-x-4">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'meetings'
              ? 'border-[#4658E8] text-[#4658E8]'
              : 'border-transparent text-[#73798D] hover:text-[#20243A]'
          }`}
        >
          <UserCheck className={`w-4 h-4 ${activeTab === 'meetings' ? 'text-[#4658E8]' : 'text-[#73798D]'}`} />
          <span>O2O Meetings & Follow-ups ({visibleMeetings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'resources'
              ? 'border-[#4658E8] text-[#4658E8]'
              : 'border-transparent text-[#73798D] hover:text-[#20243A]'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'resources' ? 'text-[#4658E8]' : 'text-[#73798D]'}`} />
          <span>O2O Resources & Link Repository ({o2oResources.length})</span>
        </button>
      </div>

      {/* TAB 1: O2O MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-3xl border border-[#E8EAF2] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#20243A]">Recorded O2O Sessions</h3>
              <p className="text-xs text-[#73798D]">Confidential 1:1 records, goal alignment, and next steps</p>
            </div>
            <span className="text-xs text-[#73798D] font-medium">
              Access level: <strong>{currentUser?.role}</strong>
            </span>
          </div>

          {visibleMeetings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8EAF2] rounded-2xl max-w-lg mx-auto p-6 space-y-2">
              <UserCheck className="w-8 h-8 text-[#73798D] mx-auto" />
              <h4 className="text-sm font-bold text-[#20243A]">No O2O sessions logged yet</h4>
              <p className="text-xs text-[#73798D]">
                {canLeadO2O
                  ? 'Record your 1:1 check-ins with team members using the "Record O2O Meeting" button.'
                  : 'Your O2O check-in notes with your Team Leader will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleMeetings.map(m => (
                <div key={m.id} className="p-5 rounded-2xl border border-[#E8EAF2] bg-[#F8F9FD]/60 hover:border-[#4658E8]/30 hover:shadow-sm transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-[#20243A]">
                          {m.team_member_name} with TL {m.team_leader_name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#E9EAFE] text-[#4658E8] font-bold border border-[#8175E8]/20">
                          {m.meeting_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#73798D]">
                        {m.department_name ? `${m.department_name} Department` : ''} {m.team_name ? `• ${m.team_name}` : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.completion_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        m.completion_status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        m.completion_status === 'Missed' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {m.completion_status}
                      </span>
                      <span className="text-[11px] text-[#73798D] block mt-0.5">{m.meeting_date} {m.meeting_time ? `• ${m.meeting_time}` : ''}</span>
                    </div>
                  </div>

                  {m.meeting_link && (
                    <div className="p-2.5 rounded-xl bg-[#EAF2FF] border border-blue-100 text-xs flex items-center justify-between">
                      <span className="text-[#20243A] font-medium">Virtual Meeting Link:</span>
                      <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-[#4658E8] font-bold hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Join Call
                      </a>
                    </div>
                  )}

                  {m.discussion_topics && (
                    <div className="text-xs text-[#20243A]">
                      <strong>Agenda / Topics:</strong> {m.discussion_topics}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-[#E8EAF2] space-y-1">
                      <span className="font-bold text-[#20243A] text-[11px] block uppercase tracking-wider">
                        Discussion Highlights:
                      </span>
                      <p className="text-[#73798D] leading-relaxed whitespace-pre-line">{m.discussion_summary}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[#E8EAF2] space-y-1">
                      <span className="font-bold text-[#4658E8] text-[11px] block uppercase tracking-wider">
                        Agreed Action Points:
                      </span>
                      <p className="text-[#20243A] leading-relaxed whitespace-pre-line">{m.agreed_action_points}</p>
                    </div>
                  </div>

                  {/* RESTRICTED CONFIDENTIAL TL NOTES: Visible only to Leaders (TL, LCVP, LCP), hidden from GB members */}
                  {m.confidential_tl_notes && currentUser && (currentUser.id === m.team_leader_id || currentUser.role === 'LCP' || currentUser.role === 'LCVP') && (
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                      <span className="font-bold text-amber-700 text-[11px] flex items-center gap-1 uppercase tracking-wider">
                        <Shield className="w-3.5 h-3.5" /> Confidential TL Notes (Restricted)
                      </span>
                      <p className="text-amber-900 leading-relaxed whitespace-pre-line">{m.confidential_tl_notes}</p>
                    </div>
                  )}

                  {m.next_follow_up_date && (
                    <div className="pt-2 border-t border-[#E8EAF2] flex items-center justify-between text-[11px] text-[#73798D]">
                      <span className="flex items-center gap-1 font-semibold text-[#4658E8]">
                        <Clock className="w-3.5 h-3.5" /> Next scheduled follow-up: {m.next_follow_up_date}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: O2O RESOURCES & LINKS */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-3xl border border-[#E8EAF2] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#20243A]">O2O Resources, Forms & Templates</h3>
              <p className="text-xs text-[#73798D]">Centralized repository for 1:1 documentation and evaluation templates</p>
            </div>
            {canLeadO2O && (
              <button
                onClick={() => setShowResourceModal(true)}
                className="text-xs font-bold text-[#4658E8] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Resource Link
              </button>
            )}
          </div>

          {o2oResources.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8EAF2] rounded-2xl max-w-lg mx-auto p-6 space-y-2">
              <FileText className="w-8 h-8 text-[#73798D] mx-auto" />
              <h4 className="text-sm font-bold text-[#20243A]">No O2O resources added yet</h4>
              <p className="text-xs text-[#73798D]">
                Authorised Team Leaders and LCVPs can add external tracking sheets, templates, and Google Drive links here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {o2oResources.map(res => (
                <div key={res.id} className="p-4 rounded-2xl border border-[#E8EAF2] bg-[#F8F9FD]/60 hover:border-[#4658E8]/30 hover:shadow-sm transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E9EAFE] text-[#4658E8] border border-[#8175E8]/20 uppercase">
                      {res.category}
                    </span>
                    <h4 className="font-bold text-sm text-[#20243A] mt-2">{res.title}</h4>
                    {res.description && (
                      <p className="text-xs text-[#73798D] mt-1 line-clamp-2 leading-relaxed">{res.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E8EAF2] flex items-center justify-between">
                    <span className="text-[10px] text-[#73798D]">Added by {res.added_by}</span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#4658E8] hover:underline flex items-center gap-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log O2O Meeting Modal */}
      {showMeetingModal && canLeadO2O && (
        <div className="fixed inset-0 z-50 bg-[#20243A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#20243A]">Log One-to-One (O2O) Meeting</h3>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Team Member *
                </label>
                <select
                  value={targetMemberId}
                  onChange={e => setTargetMemberId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] font-medium focus:outline-[#4658E8]"
                >
                  <option value="">Select Team Member</option>
                  {eligibleTeamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.role} • {m.department_name || 'LC'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Meeting Type
                  </label>
                  <select
                    value={meetingType}
                    onChange={e => setMeetingType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                  >
                    <option value="Bi-Weekly O2O">Bi-Weekly O2O</option>
                    <option value="Monthly Review">Monthly Review</option>
                    <option value="Goal Setting">Goal Setting</option>
                    <option value="Support & Mentorship">Support & Mentorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Meeting Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={meetingStatus}
                    onChange={e => setMeetingStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Scheduled">Scheduled (Upcoming)</option>
                    <option value="Requires Escalation">Requires Escalation</option>
                    <option value="Missed">Missed / Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Meeting Link / Platform (e.g. Google Meet)
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Discussion Topics
                </label>
                <input
                  type="text"
                  value={discussionTopics}
                  onChange={e => setDiscussionTopics(e.target.value)}
                  placeholder="e.g. Role transitions, quarterly goals, wellbeing check"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Discussion Summary *
                </label>
                <textarea
                  rows={2}
                  value={discussionSummary}
                  onChange={e => setDiscussionSummary(e.target.value)}
                  required
                  placeholder="Key topics discussed, blockers identified, member sentiment..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                  Confidential TL Notes (Restricted to TL & Leadership)
                </label>
                <textarea
                  rows={2}
                  value={confidentialNotes}
                  onChange={e => setConfidentialNotes(e.target.value)}
                  placeholder="Private notes, leadership observation, sensitivity items (not visible to member)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/30 text-xs text-[#20243A] focus:outline-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Agreed Action Points *
                </label>
                <textarea
                  rows={2}
                  value={agreedActionPoints}
                  onChange={e => setAgreedActionPoints(e.target.value)}
                  required
                  placeholder="Clear deliverables, accountability commitments, and expectations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Next Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={e => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EAF2]">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F8F9FD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl saas-btn-primary text-white text-xs font-bold"
                >
                  Save O2O Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showResourceModal && canLeadO2O && (
        <div className="fixed inset-0 z-50 bg-[#20243A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#20243A]">Add O2O Resource Link</h3>

            <form onSubmit={handleCreateResource} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                  placeholder="e.g. Standard 1:1 Reflection Sheet"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={resCategory}
                  onChange={e => setResCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                >
                  <option value="O2O Forms">O2O Forms</option>
                  <option value="Meeting Templates">Meeting Templates</option>
                  <option value="Tracking Sheets">Tracking Sheets</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Guidelines">Guidelines</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Resource URL *
                </label>
                <input
                  type="url"
                  value={resUrl}
                  onChange={e => setResUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={resDesc}
                  onChange={e => setResDesc(e.target.value)}
                  placeholder="Purpose of this document..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs text-[#20243A] focus:outline-[#4658E8]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EAF2]">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F8F9FD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl saas-btn-primary text-white text-xs font-bold"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

