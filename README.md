# AIESEC in Mumbai – Membership & Performance Management Platform

A modern, comprehensive web platform engineered for **AIESEC in Mumbai** to unify organisational communication, member tracking, department-wise competition (Hackathon R&R), team tasks, Personal Development Plans (PDP), and individual member dashboards.

---

## 🌟 Core Modules

### 1. Home
- **Monthly Newsletters**: Monthly bulletins with cover images, month/year badges, modal reading view, and administrative publishing interface.
- **IXP Experiences**: Showcases member stories for Global Volunteer, Global Talent, and Global Teacher products across the world (Vietnam, Egypt, Germany, etc.).
- **Organisational Updates & Deadlines**: Category-tagged notices (Events, Achievements, Deadlines) with pinned announcements.

### 2. Hackathon (Department-wise Performance & R&R)
- **Department Standings**: Automatic live rankings calculated exclusively from verified point transactions across:
  - `oGV`
  - `iGV`
  - `iGT`
  - `oGT`
  - `Marketing`
  - `Business Development`
- **Department Drilldown**: Clicking on any department opens an interactive contribution breakdown showing top-performing members and recent verified submissions.
- **Individual Member Leaderboard**: Ranks all members across the organisation or filtered by department.
- **Log Your Work (Submission Engine)**: Direct submission form capturing activity, quantity, descriptions, and proof links (Google Drive, Docs, etc.) with real-time estimated point preview and celebratory animations.
- **Verification Dashboard**: Scoped to Team Leaders, LCVPs, and Admins to inspect proof documents, approve submissions (crediting points automatically), or reject with feedback reasons.
- **Configurable Points System**: Admin dashboard to add/edit/delete qualifying activities, point weights, categories, and unit metrics without code modification.

### 3. Members
- **Exact Layout Implementation**:
  - Member profile photograph on the **LEFT**.
  - Member name on the **RIGHT**.
  - Designation/Department **BELOW** the name.
  - Circular profile picture replacing serial numbering.
- **Department-wise Grouping**: Clear grouping for oGV, iGV, iGT, oGT, Marketing, and BD.
- **Interactive Profile Viewer**: Detailed card with joining date, reporting leader, email, phone, bio, and self-profile editing for permitted personal fields.
- **Admin Management**: Authorised leaders can add new members dynamically.

### 4. Tasks
- **Strict Role-Based & Team Visibility**:
  - **General Member**: Only sees their assigned tasks and collaborative tasks for their team.
  - **Team Leader**: Oversees all tasks within their assigned team.
  - **LCVP**: Complete department task overview.
  - **LCP / EB / Admin**: Organisation-wide task management.
- **Task Lifecycle**: Not Started, In Progress, Pending Verification, and Completed statuses.
- **Team Progress Metrics**: Live percentage completion bar, priority badges, deadline tracking, and document links.

### 5. PDP – Personal Development Plan
- **Departmental PDP Overview**: Competency targets (Calling & Outreach, Physical Meetings, Conversions, Event Attendance, Skill Learning).
- **Automated Achievement Calculations**: Dynamic percentage calculation (`(Achieved / Minimum Target) * 100`).
- **Leader Evaluation & Feedback**: Team Leaders and LCVPs review monthly numbers, record strengths, and document specific areas for improvement.

### 6. My Profile
- **Personal Identity**: User role badge, department, designation, and contact details.
- **My Performance**: Hackathon points earned, activity-wise points breakdown, and submission history.
- **My PDP**: Targets vs. achievements and leader feedback.
- **My Work**: All tasks assigned to the member with deadline alerts.

---

## 🔐 Role Switcher & Persona Testing

The top navigation includes a **Role Persona Switcher** dropdown allowing you to experience the platform as:
1. **Khushi Mishra** (`GENERAL_MEMBER`, iGV)
2. **Rohan Mehta** (`TEAM_LEADER`, iGV)
3. **Aarav Sharma** (`LCVP`, iGV)
4. **Priya Iyer** (`LCP` / `ADMIN`, Marketing & Executive Body)
5. **Advait Deshmukh** (`GENERAL_MEMBER`, oGV)
6. **Nisha Kulkarni** (`TEAM_LEADER`, oGV)
7. **Siddharth Rao** (`LCVP`, oGV)
8. **Tanya Kapoor** (`GENERAL_MEMBER`, iGT)
9. **Karan Singh** (`GENERAL_MEMBER`, BD)
10. **Simran Kaur** (`GENERAL_MEMBER`, Marketing)

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom AIESEC branding (`#037ef3`, `#004d99`, `#00c16e`, etc.)
- **Icons**: Lucide React
- **Animations**: Canvas Confetti
- **State Management**: React Context with LocalStorage persistence and transactional audit updates
- **Backend & Database**: Fully compatible with Supabase PostgreSQL (schema and RLS policies included in `supabase-schema.sql`).

---

## 🗄️ Supabase PostgreSQL Setup & RLS

A complete schema file `supabase-schema.sql` is provided in the repository root. It defines:
- Tables: `departments`, `teams`, `profiles`, `activities`, `work_submissions`, `point_transactions`, `tasks`, `task_assignments`, `pdp_targets`, `newsletters`, `ixp_stories`, `announcements`, `notifications`.
- **Database-Level Row Level Security (RLS)**: Enforces department and team task isolation, submission verification boundaries, and profile permission checks directly in PostgreSQL.

To connect your remote Supabase instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor in Supabase and run `supabase-schema.sql`.
3. Copy `.env.example` to `.env` and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the development server (`npm run dev`).
