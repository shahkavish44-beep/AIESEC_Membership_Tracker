import React, { useState } from 'react';
import { 
  Users, 
  Trophy, 
  CheckSquare, 
  Target, 
  Calendar as CalendarIcon,
  HeartHandshake,
  UserCheck,
  Milestone,
  UserCircle, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Sparkles,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, members, switchUserById, notifications, markNotificationRead, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // EXACT 8 NAVIGATION SECTIONS (Timeline removed)
  const navItems = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'hackathon', label: 'Hackathon', icon: Trophy },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'pdp', label: 'PDP & Growth', icon: Target },
    { id: 'lc-calendar', label: 'LC Calendar', icon: CalendarIcon },
    { id: 'wellbeing', label: 'Membership Wellbeing', icon: HeartHandshake },
    { id: 'accountability', label: 'TL Accountability', icon: UserCheck },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];

  const unreadNotifs = notifications.filter(n => !n.read && (n.user_id === currentUser?.id || n.user_id === 'all_admin'));

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'LCP':
        return 'bg-[#E9EAFE] text-[#4658E8] border-[#8175E8]/30 font-bold';
      case 'LCVP':
        return 'bg-[#EAF2FF] text-[#2563EB] border-[#3B82F6]/30 font-bold';
      case 'MB':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'GB':
      default:
        return 'bg-[#F0F2FF] text-[#73798D] border-[#E8EAF2] font-medium';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#E8EAF2] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Portal Branding */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('members')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4658E8] via-[#6366F1] to-[#8175E8] flex items-center justify-center text-white shadow-md shadow-[#4658E8]/20 transition-transform duration-200 hover:scale-105">
              <span className="font-extrabold text-xl tracking-tight">A</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg text-[#20243A] tracking-tight">
                  AIESEC
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF2FF] text-[#4658E8] border border-[#4658E8]/20">
                  Mumbai
                </span>
              </div>
              <p className="text-[10px] text-[#73798D] font-medium tracking-wide">
                Membership Management Portal
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-[#E9EAFE] text-[#4658E8] font-bold shadow-xs' 
                      : 'text-[#73798D] hover:text-[#20243A] hover:bg-[#F0F2FF]/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#4658E8]' : 'text-[#73798D]'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#4658E8] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Controls & Logout */}
          <div className="hidden md:flex items-center space-x-2.5 shrink-0">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#73798D] hover:text-[#20243A] hover:bg-[#F0F2FF] rounded-xl relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4658E8] rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8EAF2] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8EAF2] mb-2">
                    <span className="text-xs font-bold text-[#20243A] uppercase tracking-wider">Notifications</span>
                    <span className="text-[11px] text-[#73798D] font-medium">{unreadNotifs.length} new</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {unreadNotifs.length === 0 ? (
                      <p className="text-xs text-[#73798D] text-center py-4">No new notifications</p>
                    ) : (
                      unreadNotifs.slice(0, 5).map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                            n.read ? 'bg-[#F8F9FD] opacity-70' : 'bg-[#EAF2FF]/60 border border-[#E9EAFE]'
                          }`}
                        >
                          <p className="text-xs font-semibold text-[#20243A]">{n.title}</p>
                          <p className="text-[11px] text-[#73798D] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Card */}
            {currentUser && (
              <div className="relative">
                <div 
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border border-[#E8EAF2] hover:border-[#8175E8]/50 bg-white hover:bg-[#F0F2FF]/60 transition-all text-left cursor-pointer shadow-xs"
                >
                  <img 
                    src={currentUser.avatar_url} 
                    alt={currentUser.full_name} 
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-[#E9EAFE]" 
                  />
                  <div className="leading-tight">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-[#20243A] truncate max-w-[110px]">
                        {currentUser.full_name}
                      </span>
                      {members.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-[#73798D]" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${getRoleBadge(currentUser.role)}`}>
                        {currentUser.role} {currentUser.department_name ? `• ${currentUser.department_name}` : ''}
                      </span>
                      {currentUser.role_status === 'Pending Approval' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold" title="Pending LCP Approval">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Switcher */}
                {showRoleSwitcher && members.length > 1 && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E8EAF2] p-2.5 z-50">
                    <div className="p-2 border-b border-[#E8EAF2]">
                      <span className="text-[11px] font-bold text-[#73798D] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#4658E8]" /> Switch Account
                      </span>
                    </div>
                    <div className="space-y-1 mt-2 max-h-60 overflow-y-auto">
                      {members.map(member => (
                        <button
                          key={member.id}
                          onClick={() => {
                            switchUserById(member.id);
                            setShowRoleSwitcher(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left transition-colors ${
                            currentUser.id === member.id ? 'bg-[#E9EAFE] border border-[#8175E8]/30' : 'hover:bg-[#F0F2FF]'
                          }`}
                        >
                          <img src={member.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#20243A] truncate">{member.full_name}</p>
                            <p className="text-[10px] text-[#73798D] truncate">{member.designation}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getRoleBadge(member.role)}`}>
                            {member.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-[#73798D] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>

          {/* Mobile hamburger button */}
          <div className="xl:hidden flex items-center space-x-2">
            <button
              onClick={logout}
              className="p-1.5 text-[#73798D] hover:text-rose-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#73798D] hover:text-[#20243A] rounded-xl hover:bg-[#F0F2FF]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#E8EAF2] bg-white px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-[#E9EAFE] text-[#4658E8] font-bold border-l-4 border-[#4658E8]' : 'text-[#73798D] hover:bg-[#F0F2FF]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4658E8]' : 'text-[#73798D]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
