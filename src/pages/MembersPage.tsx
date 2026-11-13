import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  UserCheck, 
  Edit3, 
  X,
  ChevronRight,
  Shield,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DepartmentName, UserProfile, UserRole } from '../types';

export const MembersPage: React.FC = () => {
  const { 
    members, 
    departments, 
    teams,
    currentUser, 
    addMember, 
    updateMember, 
    approveUserRole, 
    rejectUserRole 
  } = useApp();
  
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<DepartmentName | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // LCP / Admin Role verification and approval modal
  const [isManagingRoles, setIsManagingRoles] = useState(false);
  const [verifyRole, setVerifyRole] = useState<UserRole>('GB');
  const [verifyDept, setVerifyDept] = useState<DepartmentName | undefined>('iGV');
  const [verifyTeam, setVerifyTeam] = useState<string>('');
  const [verifyDesignation, setVerifyDesignation] = useState('');

  // Form state for editing personal details
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Form state for manually onboarding a member (Admin)
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState<DepartmentName>('iGV');
  const [newRole, setNewRole] = useState<UserRole>('GB');
  const [newTeam, setNewTeam] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newReportingTo, setNewReportingTo] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  // STRICT ACCESS CONTROL RULES:
  // - LCP: View all members across all departments.
  // - EB: View all members if permitted, or general directory.
  // - LCVP: Only members of their own department.
  // - MB: Only members of their assigned team.
  // - GB: Membership directory of active members.
  const authorizedMembers = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'LCP') {
      return members;
    }

    if (currentUser.role === 'LCVP') {
      return members.filter(m => m.department_name === currentUser.department_name);
    }

    if (currentUser.role === 'MB') {
      return members.filter(m => m.id === currentUser.id || (m.department_name === currentUser.department_name && m.team_name === currentUser.team_name));
    }

    // GB members see verified active members in the general directory
    return members.filter(m => m.role_status === 'Approved' || m.id === currentUser.id);
  }, [members, currentUser]);

  // Filter members by search & department
  const filteredMembers = useMemo(() => {
    return authorizedMembers.filter(m => {
      const matchesDept = selectedDeptFilter === 'ALL' || m.department_name === selectedDeptFilter;
      const matchesQuery = m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesQuery;
    });
  }, [authorizedMembers, selectedDeptFilter, searchQuery]);

  // Pending role verification count for LCP / Admin
  const pendingRequests = useMemo(() => {
    if (currentUser?.role !== 'LCP') return [];
    return members.filter(m => m.role_status === 'Pending Approval');
  }, [members, currentUser]);

  const isLcp = currentUser?.role === 'LCP';

  const handleOpenMemberDetail = (m: UserProfile) => {
    setSelectedMember(m);
    setEditBio(m.bio || '');
    setEditPhone(m.phone || '');
    setIsEditingSelf(false);
    setIsManagingRoles(false);
    setVerifyRole(m.requested_role || m.role);
    setVerifyDept(m.department_name || 'iGV');
    setVerifyTeam(m.team_name || '');
    setVerifyDesignation(m.designation);
  };

  const handleSaveSelfUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    updateMember(selectedMember.id, {
      bio: editBio,
      phone: editPhone
    });
    setSelectedMember(prev => prev ? { ...prev, bio: editBio, phone: editPhone } : null);
    setIsEditingSelf(false);
  };

  const handleApproveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    approveUserRole(
      selectedMember.id, 
      verifyRole, 
      ['GB', 'MB', 'LCVP'].includes(verifyRole) ? verifyDept : undefined,
      ['GB', 'MB'].includes(verifyRole) ? verifyTeam : undefined,
      verifyDesignation
    );

    setSelectedMember(prev => prev ? {
      ...prev,
      role: verifyRole,
      role_status: 'Approved' as const,
      department_name: ['GB', 'MB', 'LCVP'].includes(verifyRole) ? verifyDept : undefined,
      team_name: ['GB', 'MB'].includes(verifyRole) ? verifyTeam : undefined,
      designation: verifyDesignation
    } : null);

    setIsManagingRoles(false);
  };

  const handleRejectRole = () => {
    if (!selectedMember) return;
    rejectUserRole(selectedMember.id, 'Information could not be verified by LCP.');
    setSelectedMember(prev => prev ? { ...prev, role: 'GB' as const, role_status: 'Rejected' as const } : null);
    setIsManagingRoles(false);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;

    const deptObj = departments.find(d => d.name === newDept);

    addMember({
      personal_email: newEmail,
      aiesec_email: newEmail,
      full_name: newFullName,
      email: newEmail,
      role: newRole,
      requested_role: newRole,
      role_status: 'Approved',
      department_id: deptObj?.id,
      department_name: newDept,
      team_name: newTeam,
      designation: newDesignation || `${newDept} Member`,
      avatar_url: newAvatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newFullName)}&backgroundColor=037ef3,004d99&textColor=ffffff`,
      joining_date: new Date().toISOString().split('T')[0],
      reporting_to: newReportingTo || 'Team Leader',
      bio: ''
    });

    setShowAddMemberModal(false);
    setNewFullName('');
    setNewEmail('');
    setNewDesignation('');
    setNewAvatar('');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <Users className="w-3.5 h-3.5" />
            <span>Membership Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            Members Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            {currentUser?.role === 'LCP' 
              ? 'Complete organisation overview of all members, roles, and pending verification requests.'
              : currentUser?.role === 'LCVP'
              ? `Department directory for ${currentUser.department_name}. Manage and monitor team members.`
              : currentUser?.role === 'MB'
              ? `Team directory for ${currentUser.team_name || currentUser.department_name}.`
              : 'Directory of registered AIESEC in Mumbai members.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isLcp && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* LCP Pending Verification Banner */}
      {isLcp && pendingRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs backdrop-blur-xs">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-950">
                {pendingRequests.length} Member Role Verification Request(s) Pending Review
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Review registrations to approve or modify requested positions before elevated permissions are granted.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-200 text-amber-950 rounded-lg">
            Action Required
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Department Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedDeptFilter === 'ALL'
                ? 'bg-[#20243A] text-white shadow-xs'
                : 'bg-white text-[#73798D] border border-[#E8EAF2] hover:bg-[#F0F2FF]'
            }`}
          >
            All Accessible ({authorizedMembers.length})
          </button>
          {departments.map(dept => {
            const count = authorizedMembers.filter(m => m.department_name === dept.name).length;
            const isSelected = selectedDeptFilter === dept.name;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptFilter(dept.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#4658E8] text-white shadow-xs'
                    : 'bg-white text-[#73798D] border border-[#E8EAF2] hover:bg-[#F0F2FF]'
                }`}
              >
                <span>{dept.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-[#F0F2FF] text-[#4658E8]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#73798D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, role..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8EAF2] bg-white text-xs text-[#20243A] focus:outline-[#4658E8] shadow-2xs"
          />
        </div>
      </div>

      {/* Empty State when no members exist */}
      {authorizedMembers.length === 0 ? (
        <div className="saas-card p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E9EAFE] text-[#4658E8] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#20243A]">No members found in your scope</h3>
          <p className="text-xs text-[#73798D] leading-relaxed">
            As real members register their accounts, their verified profiles will appear here according to your access level.
          </p>
        </div>
      ) : (
        /* Membership List: Photo LEFT, Name RIGHT, Designation BELOW */
        <div className="space-y-6">
          {departments.map(dept => {
            if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== dept.name) return null;
            const deptMembers = filteredMembers.filter(m => m.department_name === dept.name);
            if (deptMembers.length === 0) return null;

            return (
              <div key={dept.id} className="saas-card overflow-hidden">
                {/* Department Header */}
                <div className="px-6 py-4 bg-[#F8F9FD] border-b border-[#E8EAF2] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                    <h3 className="text-sm font-extrabold text-[#20243A] tracking-wide">{dept.name}</h3>
                    <span className="text-xs text-[#73798D] font-medium">({deptMembers.length} members)</span>
                  </div>
                </div>

                {/* Members List Items */}
                <div className="divide-y divide-[#E8EAF2]">
                  {deptMembers.map(member => (
                    <div
                      key={member.id}
                      onClick={() => handleOpenMemberDetail(member)}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F0F2FF]/50 cursor-pointer transition-colors group"
                    >
                      {/* Photo LEFT, Name RIGHT, Designation BELOW */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-[#E8EAF2] group-hover:ring-[#8175E8] transition-all"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-[#20243A] group-hover:text-[#4658E8] transition-colors">
                              {member.full_name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F0F2FF] text-[#4658E8] border border-[#E9EAFE]">
                              {member.role}
                            </span>
                            {member.role_status === 'Pending Approval' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                Pending Approval
                              </span>
                            )}
                            {currentUser && member.id === currentUser.id && (
                              <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#E9EAFE] text-[#4658E8] font-bold">You</span>
                            )}
                          </div>
                          <p className="text-xs text-[#73798D] font-medium mt-0.5">
                            {member.designation} {member.team_name ? `• ${member.team_name}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="hidden md:inline-block text-xs text-[#73798D]">
                          Joined {member.joining_date}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#73798D] group-hover:text-[#4658E8] transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Member Profile Drawer / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-[#17243A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#E8EAF2]">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-5 right-5 text-[#73798D] hover:text-[#20243A] font-bold p-1 rounded-lg hover:bg-[#F0F2FF]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Overview */}
            <div className="flex items-center space-x-4 pb-6 border-b border-[#E8EAF2]">
              <img
                src={selectedMember.avatar_url}
                alt={selectedMember.full_name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-[#E9EAFE] shadow-sm"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-extrabold text-[#20243A]">{selectedMember.full_name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E9EAFE] text-[#4658E8] border border-[#8175E8]/20">
                    {selectedMember.role}
                  </span>
                  {selectedMember.role_status === 'Pending Approval' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#73798D] font-medium mt-0.5">{selectedMember.designation}</p>
                <p className="text-xs font-bold text-[#4658E8] mt-0.5">
                  {selectedMember.department_name ? `${selectedMember.department_name} Department` : 'Organisation Core'}
                  {selectedMember.team_name ? ` • ${selectedMember.team_name}` : ''}
                </p>
              </div>
            </div>

            {/* Profile Information List */}
            <div className="py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-[#E8EAF2]">
                  <span className="text-[10px] font-bold text-[#73798D] uppercase tracking-wider block">Joining Date</span>
                  <span className="text-xs font-semibold text-[#20243A] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#4658E8]" />
                    {selectedMember.joining_date}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-[#E8EAF2]">
                  <span className="text-[10px] font-bold text-[#73798D] uppercase tracking-wider block">Reporting To</span>
                  <span className="text-xs font-semibold text-[#20243A] mt-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#4658E8]" />
                    {selectedMember.reporting_to || 'Department LCVP'}
                  </span>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-[#E8EAF2] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#73798D] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#73798D]" />
                    Email:
                  </span>
                  <a href={`mailto:${selectedMember.email}`} className="font-semibold text-[#4658E8] hover:underline">
                    {selectedMember.email}
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E8EAF2]">
                  <span className="text-[#73798D] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#73798D]" />
                    Contact:
                  </span>
                  <span className="font-semibold text-[#20243A]">
                    {selectedMember.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider block mb-1">
                  Introduction / Bio
                </span>
                <p className="text-xs text-[#73798D] leading-relaxed p-3.5 bg-[#F8F9FD] rounded-2xl border border-[#E8EAF2]">
                  {selectedMember.bio || 'Member of AIESEC in Mumbai.'}
                </p>
              </div>

              {/* LCP Role Verification & Approval Panel */}
              {isLcp && selectedMember.id !== currentUser?.id && (
                <div className="pt-2 border-t border-[#E8EAF2]">
                  {!isManagingRoles ? (
                    <div className="flex items-center justify-between p-3.5 bg-[#EAF2FF]/60 rounded-2xl border border-[#E9EAFE]">
                      <div>
                        <span className="text-xs font-bold text-[#20243A] block">
                          Role Status: <span className={selectedMember.role_status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}>{selectedMember.role_status}</span>
                        </span>
                        <span className="text-[11px] text-[#73798D]">
                          Requested: <strong>{selectedMember.requested_role}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => setIsManagingRoles(true)}
                        className="px-3.5 py-2 rounded-xl saas-btn-primary text-white text-xs font-bold flex items-center space-x-1"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Manage & Verify Role</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApproveRole} className="p-4 rounded-2xl border border-[#8175E8]/30 bg-[#E9EAFE]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4658E8] uppercase tracking-wider">
                          Approve / Change Position (LCP Access)
                        </span>
                        <span className="text-[10px] text-[#73798D]">Requested: {selectedMember.requested_role}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[#20243A] mb-1">Approved Role</label>
                          <select
                            value={verifyRole}
                            onChange={e => setVerifyRole(e.target.value as UserRole)}
                            className="w-full px-2.5 py-2 rounded-xl border border-[#E8EAF2] text-xs bg-white font-medium text-[#20243A] focus:outline-[#4658E8]"
                          >
                            <option value="GB">GB – General Body</option>
                            <option value="MB">MB – Management Board (TL)</option>
                            <option value="LCVP">LCVP – Vice President</option>
                            <option value="LCP">LCP – President</option>
                          </select>
                        </div>
                        {['GB', 'MB', 'LCVP'].includes(verifyRole) && (
                          <div>
                            <label className="block text-[11px] font-bold text-[#20243A] mb-1">Department</label>
                            <select
                              value={verifyDept}
                              onChange={e => setVerifyDept(e.target.value as DepartmentName)}
                              className="w-full px-2.5 py-2 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                            >
                              {departments.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {['GB', 'MB'].includes(verifyRole) && (
                        <div>
                          <label className="block text-[11px] font-bold text-[#20243A] mb-1">Assigned Team</label>
                          <input
                            type="text"
                            value={verifyTeam}
                            onChange={e => setVerifyTeam(e.target.value)}
                            placeholder="e.g. Project Sunshine"
                            className="w-full px-3 py-2 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-[#20243A] mb-1">Designation</label>
                        <input
                          type="text"
                          value={verifyDesignation}
                          onChange={e => setVerifyDesignation(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8EAF2] text-xs bg-white text-[#20243A] focus:outline-[#4658E8]"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <button
                          type="button"
                          onClick={handleRejectRole}
                          className="text-xs font-bold text-rose-600 hover:underline"
                        >
                          Reject Role
                        </button>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsManagingRoles(false)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#73798D] hover:bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                          >
                            Approve & Grant Permissions
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Editable self-details */}
              {currentUser && selectedMember.id === currentUser.id && (
                <div className="pt-2">
                  {!isEditingSelf ? (
                    <button
                      onClick={() => setIsEditingSelf(true)}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#037ef3] hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit My Personal Details</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSaveSelfUpdate} className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          placeholder="+91 ..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Short Bio / Introduction</label>
                        <textarea
                          rows={2}
                          value={editBio}
                          onChange={e => setEditBio(e.target.value)}
                          placeholder="Tell fellow members about your responsibilities..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingSelf(false)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 rounded-lg bg-[#037ef3] text-white text-xs font-bold hover:bg-blue-600"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E8EAF2] flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2.5 rounded-xl bg-[#20243A] text-white text-xs font-semibold hover:bg-[#17243A] transition-all shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Member Modal (LCP Only) */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-[#17243A]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E8EAF2]">
            <h3 className="text-lg font-extrabold text-[#20243A] mb-4">Add Member Directly</h3>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#20243A] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="e.g. Ananya Patel"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#20243A] mb-1">AIESEC Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ananya.patel@aiesec.net"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#20243A] mb-1">Position</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A]"
                  >
                    <option value="GB">GB – General Body</option>
                    <option value="MB">MB – Management Board</option>
                    <option value="LCVP">LCVP – Vice President</option>
                    <option value="LCP">LCP – President</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#20243A] mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={e => setNewDept(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A]"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#20243A] mb-1">Designation</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  placeholder="e.g. Outgoing Exchange Specialist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F0F2FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="saas-btn-primary px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
