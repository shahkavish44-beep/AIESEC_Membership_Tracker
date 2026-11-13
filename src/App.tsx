import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MembersPage } from './pages/MembersPage';
import { HackathonPage } from './pages/HackathonPage';
import { TasksPage } from './pages/TasksPage';
import { PDPPage } from './pages/PDPPage';
import { ProfilePage } from './pages/ProfilePage';
import { LCCalendarPage } from './pages/LCCalendarPage';
import { WellbeingPage } from './pages/WellbeingPage';
import { TLAccountabilityPage } from './pages/TLAccountabilityPage';
import { AuthModal } from './components/AuthModal';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('members');
  const { session } = useApp();

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#20243A] flex flex-col font-sans relative selection:bg-[#E9EAFE] selection:text-[#4658E8]">
      {/* Background ambient decorative mesh/glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#EAF2FF]/60 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#E9EAFE]/50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-[#F0F2FF]/80 rounded-full blur-3xl opacity-70"></div>
      </div>

      {/* If not authenticated, require registration or login */}
      {!session && <AuthModal />}

      {/* Main Top Header & Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 relative z-10">
        {activeTab === 'members' && <MembersPage />}
        {activeTab === 'hackathon' && <HackathonPage />}
        {activeTab === 'tasks' && <TasksPage />}
        {activeTab === 'pdp' && <PDPPage />}
        {activeTab === 'lc-calendar' && <LCCalendarPage />}
        {activeTab === 'wellbeing' && <WellbeingPage />}
        {activeTab === 'accountability' && <TLAccountabilityPage />}
        {activeTab === 'profile' && <ProfilePage onNavigate={setActiveTab} />}
      </main>

      {/* Footer with clean minimal SaaS styling */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-[#E8EAF2] mt-auto py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#73798D] gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-md bg-[#4658E8] text-white flex items-center justify-center font-bold text-[10px]">A</div>
            <span className="font-bold text-[#20243A]">AIESEC in Mumbai</span>
            <span className="text-[#E8EAF2]">•</span>
            <span>Membership Management System</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F0F2FF] text-[#4658E8] font-semibold text-[11px] border border-[#E9EAFE]">
              Term 24.25
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
