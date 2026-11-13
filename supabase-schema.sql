-- ====================================================================
-- AIESEC IN MUMBAI - MEMBERSHIP & PERFORMANCE MANAGEMENT PLATFORM
-- SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role_enum AS ENUM ('LCP', 'EB', 'ADMIN', 'LCVP', 'TEAM_LEADER', 'GENERAL_MEMBER');
CREATE TYPE submission_status_enum AS ENUM ('Pending Verification', 'Approved', 'Rejected');
CREATE TYPE task_status_enum AS ENUM ('Not Started', 'In Progress', 'Completed', 'Pending Verification');
CREATE TYPE task_priority_enum AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- 3. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#037ef3',
    icon VARCHAR(30) DEFAULT 'Users',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TEAMS
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PROFILES (Members)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    role user_role_enum NOT NULL DEFAULT 'GENERAL_MEMBER',
    designation VARCHAR(100) NOT NULL DEFAULT 'Member',
    avatar_url TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    reporting_to VARCHAR(100),
    bio TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ACTIVITIES (Configurable Hackathon Point System)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    requires_quantity BOOLEAN DEFAULT false,
    requires_verification BOOLEAN DEFAULT true,
    unit_name VARCHAR(50) DEFAULT 'unit',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. WORK SUBMISSIONS
CREATE TABLE work_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1,
    calculated_points INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    proof_link TEXT NOT NULL,
    status submission_status_enum DEFAULT 'Pending Verification',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verifier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT
);

-- 8. POINT TRANSACTIONS (Audit ledger for all verified points)
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES work_submissions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    activity_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    assigned_by_id UUID NOT NULL REFERENCES profiles(id),
    priority task_priority_enum DEFAULT 'Medium',
    status task_status_enum DEFAULT 'Not Started',
    due_date DATE NOT NULL,
    attachment_url TEXT,
    verified_by_id UUID REFERENCES profiles(id),
    submission_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TASK ASSIGNMENTS (For individual or collaborative assignments)
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(task_id, member_id)
);

-- 11. PDP TARGETS & ACHIEVEMENTS
CREATE TABLE pdp_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    target_metric VARCHAR(150) NOT NULL,
    minimum_target NUMERIC(10, 2) NOT NULL DEFAULT 0,
    actual_achieved NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(30) DEFAULT 'units',
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    feedback TEXT,
    areas_for_improvement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. NEWSLETTERS
CREATE TABLE newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    cover_image TEXT NOT NULL,
    pdf_url TEXT,
    summary TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. IXP STORIES
CREATE TABLE ixp_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_name VARCHAR(100) NOT NULL,
    member_photo TEXT NOT NULL,
    destination_country VARCHAR(100) NOT NULL,
    experience_type VARCHAR(50) NOT NULL,
    testimonial TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. ANNOUNCEMENTS
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Announcement',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_name VARCHAR(100) NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdp_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ixp_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's profile role and department
CREATE OR REPLACE FUNCTION get_auth_profile()
RETURNS TABLE (role user_role_enum, department_id UUID, team_id UUID) AS $$
  SELECT role, department_id, team_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: Everyone authenticated can view directory profiles. Only Admin can insert/delete. User can update own permitted info.
CREATE POLICY "Public profile view" ON profiles FOR SELECT USING (true);
CREATE POLICY "User update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN')
);

-- DEPARTMENTS & TEAMS: Viewable by all authenticated. Managed by Admin.
CREATE POLICY "View departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admin manage departments" ON departments FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN')
);
CREATE POLICY "View teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Admin manage teams" ON teams FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN')
);

-- TASKS: STRICT ISOLATION
-- General Member: Only tasks assigned to them or their team.
-- Team Leader: All tasks in their team.
-- LCVP: All tasks in their department.
-- Admin / EB / LCP: All tasks organization-wide.
CREATE POLICY "Select tasks policy" ON tasks FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN')
    OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'LCVP' 
        AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
    OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'TEAM_LEADER'
        AND team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())
    )
    OR (
        id IN (SELECT task_id FROM task_assignments WHERE member_id = auth.uid())
        OR team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Insert tasks policy" ON tasks FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN', 'LCVP', 'TEAM_LEADER')
);

-- WORK SUBMISSIONS
CREATE POLICY "Select work submissions" ON work_submissions FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN')
    OR department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    OR member_id = auth.uid()
);

CREATE POLICY "Insert own work submission" ON work_submissions FOR INSERT WITH CHECK (
    member_id = auth.uid()
);

-- PDP TARGETS
CREATE POLICY "Select PDP policy" ON pdp_targets FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('LCP', 'EB', 'ADMIN')
    OR member_id IN (
        SELECT id FROM profiles WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
    )
);

