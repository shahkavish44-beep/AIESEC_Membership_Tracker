import { Department, ActivityConfig, Team } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-ogv', name: 'oGV', description: '', color: '#F85A40', icon: 'PlaneTakeoff' },
  { id: 'dept-igv', name: 'iGV', description: '', color: '#037EF3', icon: 'HeartHandshake' },
  { id: 'dept-ogt', name: 'oGT', description: '', color: '#FCA130', icon: 'GraduationCap' },
  { id: 'dept-igt', name: 'iGT', description: '', color: '#00C16E', icon: 'Briefcase' },
  { id: 'dept-mkt', name: 'Marketing', description: '', color: '#A020F0', icon: 'Megaphone' },
  { id: 'dept-bd', name: 'Business Development', description: '', color: '#0A2540', icon: 'Handshake' },
];

export const INITIAL_TEAMS: Team[] = [
  { id: 'team-ogv-1', department_name: 'oGV', name: 'oGV Campus Launchers' },
  { id: 'team-ogv-2', department_name: 'oGV', name: 'oGV Customer Experience' },
  { id: 'team-igv-1', department_name: 'iGV', name: 'iGV Project Sunshine' },
  { id: 'team-igv-2', department_name: 'iGV', name: 'iGV Host & Logistics' },
  { id: 'team-ogt-1', department_name: 'oGT', name: 'oGT Corporate Outreach' },
  { id: 'team-ogt-2', department_name: 'oGT', name: 'oGT Match Operations' },
  { id: 'team-igt-1', department_name: 'iGT', name: 'iGT Key Accounts' },
  { id: 'team-igt-2', department_name: 'iGT', name: 'iGT Trainee Servicing' },
  { id: 'team-mkt-1', department_name: 'Marketing', name: 'Mkt Content & Media' },
  { id: 'team-mkt-2', department_name: 'Marketing', name: 'Mkt Campaigns & PR' },
  { id: 'team-bd-1', department_name: 'Business Development', name: 'BD Corporate Partnerships' },
  { id: 'team-bd-2', department_name: 'Business Development', name: 'BD Sponsorships & Grants' },
];

export const INITIAL_ACTIVITIES: ActivityConfig[] = [
  {
    id: 'act-1',
    name: 'College / School Physical Outreach',
    category: 'Outreach',
    points: 30,
    requires_quantity: true,
    requires_verification: true,
    unit_name: 'booths / classrooms',
    description: 'Direct campus info-desk pitching exchange products to students.'
  },
  {
    id: 'act-2',
    name: 'Corporate / Client Pitch Meeting',
    category: 'Meetings',
    points: 40,
    requires_quantity: true,
    requires_verification: true,
    unit_name: 'meetings conducted',
    description: 'Physical or virtual presentation to company HR or CSR directors.'
  },
  {
    id: 'act-3',
    name: 'Cold Calling Outreach Sprint',
    category: 'Outreach',
    points: 1,
    requires_quantity: true,
    requires_verification: true,
    unit_name: 'verified calls',
    description: 'Lead generation and follow-up calls with recorded call logs.'
  },
  {
    id: 'act-4',
    name: 'Exchange Participant (EP) Realization / Arrival',
    category: 'Operations',
    points: 100,
    requires_quantity: true,
    requires_verification: true,
    unit_name: 'EP arrivals',
    description: 'Airport pickup, onboarding and legal registration of incoming/outgoing trainee.'
  },
  {
    id: 'act-5',
    name: 'Host Family / Accommodation Finalization',
    category: 'Operations',
    points: 50,
    requires_quantity: true,
    requires_verification: true,
    unit_name: 'hosts onboarded',
    description: 'Vetting and contracting safe stay for international exchange participants.'
  },
  {
    id: 'act-6',
    name: 'Organizing Functional / LC Event',
    category: 'Events',
    points: 60,
    requires_quantity: false,
    requires_verification: true,
    unit_name: 'events',
    description: 'Global Village, Youth Speak Forum, or LCM planning and coordination.'
  },
  {
    id: 'act-7',
    name: 'Social Media Campaign / Reel Delivery',
    category: 'Outreach',
    points: 25,
    requires_quantity: true,
    requires_verification: true,
    unit_name: 'posts / reels',
    description: 'Created, approved and published digital engagement content reaching 1k+ views.'
  },
  {
    id: 'act-8',
    name: 'Department Milestone Achievement',
    category: 'Department Milestone',
    points: 150,
    requires_quantity: false,
    requires_verification: true,
    unit_name: 'milestone',
    description: 'Hitting quarterly department exchange target ahead of schedule.'
  }
];
