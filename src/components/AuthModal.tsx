import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DepartmentName, UserRole } from '../types';
import { LogIn, UserPlus, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { register, login, departments, teams } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Registration Form Fields according to PART 6:
  // 1. Full Name
  // 2. Personal Email Address
  // 3. AIESEC Email ID
  // 4. Password
  // 5. Current Position: LCP, LCVP, MB, GB
  // 6. Department
  // 7. Team, where applicable
  const [fullName, setFullName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [aiesecEmail, setAiesecEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState<UserRole>('GB');
  const [department, setDepartment] = useState<DepartmentName>('iGV');
  const [teamName, setTeamName] = useState<string>('');

  // Login form field
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const availableTeams = teams.filter(t => t.department_name === department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isRegistering) {
      if (!fullName.trim() || !personalEmail.trim() || !aiesecEmail.trim() || !password) {
        setErrorMsg('Please complete all required fields.');
        return;
      }

      const reqDept = ['GB', 'MB', 'LCVP'].includes(position) ? department : undefined;
      const reqTeam = ['GB', 'MB'].includes(position) ? (teamName || availableTeams[0]?.name || '') : undefined;

      const res = register(
        fullName,
        personalEmail,
        aiesecEmail,
        password,
        position,
        reqDept,
        reqTeam
      );
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed');
      }
    } else {
      const res = login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17243A]/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E8EAF2] max-h-[92vh] overflow-y-auto">
        
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4658E8] via-[#6366F1] to-[#8175E8] flex items-center justify-center text-white shadow-lg shadow-[#4658E8]/25 mx-auto mb-3">
            <span className="font-extrabold text-2xl tracking-tighter">A</span>
          </div>
          <h2 className="text-2xl font-black text-[#20243A] tracking-tight">
            AIESEC in Mumbai
          </h2>
          <p className="text-xs font-bold text-[#4658E8] uppercase tracking-wider mt-0.5">
            Membership Management Portal
          </p>
          <p className="text-xs text-[#73798D] mt-1.5 leading-relaxed">
            {isRegistering ? 'Register your membership account to join AIESEC in Mumbai' : 'Sign in to access your portal, deliverables and calendar'}
          </p>
        </div>

        {/* Toggle Login / Register */}
        <div className="flex p-1 bg-[#F0F2FF] rounded-2xl mb-5 border border-[#E8EAF2]">
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegistering ? 'bg-white text-[#20243A] shadow-xs border border-[#E8EAF2]' : 'text-[#73798D] hover:text-[#20243A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegistering ? 'bg-white text-[#20243A] shadow-xs border border-[#E8EAF2]' : 'text-[#73798D] hover:text-[#20243A]'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegistering ? (
            <>
              {/* 1. Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Aryan Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                />
              </div>

              {/* 2. Personal Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Personal Email Address *
                </label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={e => setPersonalEmail(e.target.value)}
                  required
                  placeholder="name@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                />
              </div>

              {/* 3. AIESEC Email ID */}
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  AIESEC Email ID *
                </label>
                <input
                  type="email"
                  value={aiesecEmail}
                  onChange={e => setAiesecEmail(e.target.value)}
                  required
                  placeholder="name@aiesec.net"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                />
              </div>

              {/* 4. Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                />
              </div>

              {/* 5. Current Position: Exact options LCP, LCVP, MB, GB */}
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Current Position *
                </label>
                <select
                  value={position}
                  onChange={e => {
                    const newRole = e.target.value as UserRole;
                    setPosition(newRole);
                    if (newRole === 'LCP') {
                      setTeamName('');
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white font-medium text-[#20243A] transition-all"
                >
                  <option value="LCP">LCP</option>
                  <option value="LCVP">LCVP</option>
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                </select>
              </div>

              {/* 6. Department (oGV, iGV, oGT, iGT, Marketing, BD) */}
              {['GB', 'MB', 'LCVP'].includes(position) && (
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={e => {
                      const newDept = e.target.value as DepartmentName;
                      setDepartment(newDept);
                      const t = teams.filter(item => item.department_name === newDept);
                      if (t.length > 0) setTeamName(t[0].name);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role Verification Notice */}
              <div className="p-3.5 bg-[#EAF2FF] rounded-2xl border border-[#4658E8]/20 flex items-start space-x-2.5 text-[11px] text-[#20243A]">
                <ShieldCheck className="w-4 h-4 text-[#4658E8] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Approval Workflow:</strong> New accounts are registered with a <em>Pending Approval</em> status. The LCP verifies your appointment before elevated permissions are granted.
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  AIESEC or Personal Email *
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  placeholder="name@aiesec.net"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs sm:text-sm focus:outline-[#4658E8] bg-[#F8F9FD] focus:bg-white text-[#20243A] transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#4658E8] to-[#6366F1] hover:from-[#3B4BD6] hover:to-[#4F46E5] text-white font-bold text-sm shadow-md shadow-[#4658E8]/25 transition-all flex items-center justify-center space-x-2 mt-5 transform active:scale-[0.99]"
          >
            {isRegistering ? (
              <>
                <UserPlus className="w-4 h-4 text-white" />
                <span>Create Account & Request Role</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-white" />
                <span>Sign In to Portal</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
