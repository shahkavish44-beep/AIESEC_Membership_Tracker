import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  Tag, 
  Filter, 
  ExternalLink,
  Shield,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LCEvent, LCEventCategory, DepartmentName } from '../types';

export const LCCalendarPage: React.FC = () => {
  const { lcEvents, createLCEvent, deleteLCEvent, currentUser, departments } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<LCEventCategory | 'All'>('All');
  const [selectedDept, setSelectedDept] = useState<DepartmentName | 'All'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LCEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LCEventCategory>('LC Event');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('18:00');
  const [eventDept, setEventDept] = useState<DepartmentName | 'All Departments'>('All Departments');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [visibility, setVisibility] = useState<LCEvent['visibility']>('LC Wide');

  // Role permissions for event creation:
  // ONLY LCP and LCVP can add/schedule events in the LC Calendar.
  // MB and GB cannot add events.
  const canCreateEvent = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === 'LCP' || currentUser.role === 'LCVP';
  }, [currentUser]);

  // Calendar dates math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Role-based Event Visibility Filtering:
  // All members see LC Wide events.
  // Department-specific events visible only to that department (or LCP).
  // Private meetings visible only to organizers or authorized members.
  const visibleEvents = useMemo(() => {
    if (!currentUser) return [];

    return lcEvents.filter(event => {
      // 1. Category filter
      if (selectedCategory !== 'All' && event.category !== selectedCategory) return false;

      // 2. Department filter
      if (selectedDept !== 'All' && event.department_name !== selectedDept) return false;

      // 3. Permission isolation
      if (currentUser.role === 'LCP') return true;

      if (event.visibility === 'LC Wide') return true;

      if (event.visibility === 'Department') {
        return event.department_name === currentUser.department_name || event.organizer_id === currentUser.id;
      }

      if (event.visibility === 'Team') {
        return (event.department_name === currentUser.department_name && event.team_name === currentUser.team_name) || event.organizer_id === currentUser.id;
      }

      // Private
      return event.organizer_id === currentUser.id;
    });
  }, [lcEvents, currentUser, selectedCategory, selectedDept]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, LCEvent[]> = {};
    visibleEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [visibleEvents]);

  // Upcoming events sorted chronologically
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...visibleEvents]
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [visibleEvents]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !currentUser) return;

    // Enforce role creation constraints:
    // LCVP cannot create events outside their department unless LC Wide approved
    const assignedDept = currentUser.role === 'LCP' 
      ? eventDept 
      : (currentUser.department_name || 'All Departments');

    createLCEvent({
      title: title.trim(),
      description: description.trim(),
      category,
      date: eventDate,
      time: eventTime || undefined,
      department_name: assignedDept,
      team_name: currentUser.role === 'MB' ? currentUser.team_name : undefined,
      location_or_link: locationOrLink.trim() || 'Online / Google Meet',
      visibility
    });

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setLocationOrLink('');
  };

  const getCategoryBadge = (cat: LCEventCategory) => {
    switch (cat) {
      case 'LC Event':
        return 'bg-[#E9EAFE] text-[#4658E8] border-[#8175E8]/30 font-bold';
      case 'EB Meeting':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      case 'Department Meeting':
        return 'bg-[#EAF2FF] text-[#2563EB] border-blue-200 font-bold';
      case 'Team Meeting':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Conference':
      case 'Training':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Deadline':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-[#F0F2FF] text-[#73798D] border-[#E8EAF2]';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 saas-gradient-header p-6 sm:p-8 rounded-3xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E9EAFE] text-[#4658E8] text-xs font-bold mb-3 border border-[#8175E8]/20">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Organisation-Wide Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20243A] tracking-tight">
            LC Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#73798D] mt-1 max-w-xl leading-relaxed">
            Centralised calendar for AIESEC in Mumbai. Discover upcoming LC events, department meetings, team alignments, synergies, and deadlines.
          </p>
        </div>

        {canCreateEvent && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="saas-btn-primary px-4 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create LC Event</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {(['All', 'LC Event', 'Department Meeting', 'Team Meeting', 'Training', 'Conference', 'Deadline'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-[#20243A] text-white font-bold shadow-xs' 
                  : 'bg-white text-[#73798D] border border-[#E8EAF2] hover:bg-[#F0F2FF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Department Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#73798D] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#4658E8]" /> Dept:
          </span>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value as any)}
            className="px-3.5 py-1.5 rounded-xl border border-[#E8EAF2] bg-white text-xs font-medium text-[#20243A] focus:outline-[#4658E8]"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Monthly Calendar & Upcoming Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Monthly Interactive Calendar (2 cols) */}
        <div className="lg:col-span-2 saas-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#20243A]">
                {monthNames[month]} {year}
              </h2>
              <p className="text-xs text-[#73798D]">Monthly view of verified LC activities</p>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-[#F3F7FC] text-[#17243A] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-[#F3F7FC] text-[#17243A] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#687386] pb-2 border-b border-slate-100">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank start offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[75px] sm:min-h-[90px] rounded-2xl bg-[#F3F7FC]/40 border border-transparent" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`min-h-[75px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    isToday 
                      ? 'bg-[#E9EAFE]/60 border-[#4658E8] shadow-sm' 
                      : 'bg-white border-[#E8EAF2]/80 hover:border-[#E8EAF2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-[#4658E8]' : 'text-[#20243A]'}`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#4658E8]/10 text-[#4658E8]">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#E9EAFE] hover:bg-[#4658E8]/20 text-[#4658E8] cursor-pointer border border-[#8175E8]/20"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-[#73798D] font-medium block text-center">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Upcoming Events List (1 col) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#20243A]">Upcoming Events & Deadlines</h3>
            <span className="text-xs text-[#73798D]">{upcomingEvents.length} scheduled</span>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#E8EAF2] p-8 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-[#73798D] mx-auto" />
              <p className="text-xs font-bold text-[#20243A]">No upcoming events scheduled yet.</p>
              <p className="text-[11px] text-[#73798D]">
                Authorised leaders can schedule department meetings, LC forums, or deadlines using the "Create LC Event" button.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-2xl border border-[#E8EAF2] p-4 hover:border-[#4658E8]/30 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadge(event.category)}`}>
                      {event.category}
                    </span>
                    <span className="text-[11px] text-[#73798D] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> {event.date} {event.time ? `• ${event.time}` : ''}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#20243A] leading-snug">{event.title}</h4>

                  {event.description && (
                    <p className="text-xs text-[#73798D] line-clamp-2 leading-relaxed">{event.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8EAF2] text-[11px] text-[#73798D]">
                    <span>Dept: <strong>{event.department_name || 'All LC'}</strong></span>
                    <span className="text-[#4658E8] font-semibold">{event.visibility}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-[#20243A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-5 right-5 text-[#73798D] hover:text-[#20243A] font-bold p-1"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getCategoryBadge(selectedEvent.category)}`}>
                {selectedEvent.category}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0F2FF] text-[#73798D]">
                {selectedEvent.visibility}
              </span>
            </div>

            <h2 className="text-xl font-black text-[#20243A]">{selectedEvent.title}</h2>

            <div className="p-3.5 bg-[#F8F9FD] rounded-2xl border border-[#E8EAF2] text-xs space-y-2">
              <div className="flex items-center justify-between text-[#20243A]">
                <span className="font-semibold flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#4658E8]" /> Date:
                </span>
                <strong>{selectedEvent.date} {selectedEvent.time ? `at ${selectedEvent.time}` : ''}</strong>
              </div>

              <div className="flex items-center justify-between text-[#20243A]">
                <span className="font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#4658E8]" /> Location / Link:
                </span>
                <span className="truncate max-w-[200px] text-[#4658E8] font-medium">{selectedEvent.location_or_link}</span>
              </div>

              <div className="flex items-center justify-between text-[#20243A]">
                <span className="font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#4658E8]" /> Department:
                </span>
                <strong>{selectedEvent.department_name || 'All LC'}</strong>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="text-xs text-[#20243A] leading-relaxed">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#73798D] block mb-1">
                  Event Brief:
                </span>
                <p className="p-3 bg-white rounded-xl border border-[#E8EAF2]">{selectedEvent.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#E8EAF2] text-xs text-[#73798D]">
              <span>Organised by: <strong>{selectedEvent.organizer_name} ({selectedEvent.organizer_role})</strong></span>

              {(currentUser?.role === 'LCP' || selectedEvent.organizer_id === currentUser?.id) && (
                <button
                  onClick={() => {
                    deleteLCEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  className="text-red-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && canCreateEvent && (
        <div className="fixed inset-0 z-50 bg-[#20243A]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#20243A]">Schedule New LC Event</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. November Local Committee Meeting (LCM)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] text-[#20243A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as LCEventCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] bg-white text-[#20243A] font-medium"
                  >
                    <option value="LC Event">LC Event</option>
                    <option value="Department Meeting">Department Meeting</option>
                    <option value="Team Meeting">Team Meeting</option>
                    <option value="EB Meeting">EB Meeting</option>
                    <option value="Interdepartmental Synergy">Interdepartmental Synergy</option>
                    <option value="Training">Training</option>
                    <option value="Conference">Conference</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] bg-white text-[#20243A]"
                  >
                    <option value="LC Wide">LC Wide (All Members)</option>
                    <option value="Department">Department Specific</option>
                    <option value="Team">Team Specific</option>
                    <option value="Private">Private / EB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] text-[#20243A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] text-[#20243A]"
                  />
                </div>
              </div>

              {currentUser?.role === 'LCP' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                    Department Focus
                  </label>
                  <select
                    value={eventDept}
                    onChange={e => setEventDept(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] bg-white text-[#20243A]"
                  >
                    <option value="All Departments">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Location or Virtual Meeting Link
                </label>
                <input
                  type="text"
                  value={locationOrLink}
                  onChange={e => setLocationOrLink(e.target.value)}
                  placeholder="e.g. St. Xavier College / https://meet.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] text-[#20243A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#20243A] uppercase tracking-wider mb-1">
                  Description / Agenda
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Share details and expectations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EAF2] text-xs focus:outline-[#4658E8] text-[#20243A]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E8EAF2]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8EAF2] text-xs font-semibold text-[#73798D] hover:bg-[#F8F9FD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl saas-btn-primary text-white text-xs font-bold"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

