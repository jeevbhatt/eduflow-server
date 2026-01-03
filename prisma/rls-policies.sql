-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- EduFlow Multi-Tenant Architecture
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Enable RLS on all tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create helper functions
-- ============================================

-- Get current user's institute ID from JWT claims
CREATE OR REPLACE FUNCTION auth.user_institute_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'institute_id')::UUID,
    (SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    ))
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    (SELECT role::TEXT FROM users WHERE id = auth.uid())
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'super-admin'
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: Create service role bypass policy
-- This allows the backend service to bypass RLS
-- ============================================

-- SERVICE ROLE BYPASS (for backend API with service_role key)
CREATE POLICY "Service role bypass all tables"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass institutes"
ON institutes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass categories"
ON categories FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass courses"
ON courses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass students"
ON students FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass teachers"
ON teachers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass chapters"
ON chapters FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass lessons"
ON lessons FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass attendance"
ON attendance FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass assessments"
ON assessments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass assessment_results"
ON assessment_results FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass student_courses"
ON student_courses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass teacher_courses"
ON teacher_courses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass sessions"
ON sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass refresh_tokens"
ON refresh_tokens FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass security_logs"
ON security_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- STEP 4: USERS table policies
-- ============================================

-- Super admin can see all users
CREATE POLICY "Super admin full access on users"
ON users FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- STEP 5: INSTITUTES table policies
-- ============================================

CREATE POLICY "Super admin full access on institutes"
ON institutes FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

-- Institute owners can manage their institutes
CREATE POLICY "Owners can manage their institutes"
ON institutes FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Users can view institutes they belong to
CREATE POLICY "Members can view their institute"
ON institutes FOR SELECT
TO authenticated
USING (id = auth.user_institute_id());

-- ============================================
-- STEP 6: CATEGORIES table policies
-- ============================================

CREATE POLICY "Super admin full access on categories"
ON categories FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

-- Institute admins can manage categories
CREATE POLICY "Institute admin can manage categories"
ON categories FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
)
WITH CHECK (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
);

-- Teachers and students can view categories
CREATE POLICY "Members can view categories"
ON categories FOR SELECT
TO authenticated
USING (institute_id = auth.user_institute_id());

-- ============================================
-- STEP 7: COURSES table policies
-- ============================================

CREATE POLICY "Super admin full access on courses"
ON courses FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Institute admin can manage courses"
ON courses FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
)
WITH CHECK (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
);

-- Teachers can manage courses they're assigned to
CREATE POLICY "Teachers can manage assigned courses"
ON courses FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
  AND id IN (
    SELECT course_id FROM teacher_courses
    WHERE teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
);

-- Students can view published courses in their institute
CREATE POLICY "Students can view published courses"
ON courses FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'student'
  AND is_published = true
);

-- ============================================
-- STEP 8: STUDENTS table policies
-- ============================================

CREATE POLICY "Super admin full access on students"
ON students FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Institute admin can manage students"
ON students FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
)
WITH CHECK (institute_id = auth.user_institute_id());

-- Teachers can view students in their institute
CREATE POLICY "Teachers can view students"
ON students FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
);

-- Students can view/update their own profile
CREATE POLICY "Students can view own profile"
ON students FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Students can update own profile"
ON students FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 9: TEACHERS table policies
-- ============================================

CREATE POLICY "Super admin full access on teachers"
ON teachers FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Institute admin can manage teachers"
ON teachers FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
)
WITH CHECK (institute_id = auth.user_institute_id());

-- Teachers can view/update own profile
CREATE POLICY "Teachers can view own profile"
ON teachers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Teachers can update own profile"
ON teachers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 10: CHAPTERS & LESSONS policies
-- ============================================

-- Chapters inherit course access
CREATE POLICY "Super admin full access on chapters"
ON chapters FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Course managers can manage chapters"
ON chapters FOR ALL
TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE institute_id = auth.user_institute_id()
  )
  AND auth.user_role() IN ('institute', 'teacher')
)
WITH CHECK (
  course_id IN (
    SELECT id FROM courses WHERE institute_id = auth.user_institute_id()
  )
);

CREATE POLICY "Students can view chapters"
ON chapters FOR SELECT
TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE institute_id = auth.user_institute_id()
    AND is_published = true
  )
);

-- Lessons inherit chapter access
CREATE POLICY "Super admin full access on lessons"
ON lessons FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Course managers can manage lessons"
ON lessons FOR ALL
TO authenticated
USING (
  chapter_id IN (
    SELECT ch.id FROM chapters ch
    JOIN courses c ON ch.course_id = c.id
    WHERE c.institute_id = auth.user_institute_id()
  )
  AND auth.user_role() IN ('institute', 'teacher')
)
WITH CHECK (
  chapter_id IN (
    SELECT ch.id FROM chapters ch
    JOIN courses c ON ch.course_id = c.id
    WHERE c.institute_id = auth.user_institute_id()
  )
);

CREATE POLICY "Students can view lessons"
ON lessons FOR SELECT
TO authenticated
USING (
  chapter_id IN (
    SELECT ch.id FROM chapters ch
    JOIN courses c ON ch.course_id = c.id
    WHERE c.institute_id = auth.user_institute_id()
    AND c.is_published = true
  )
);

-- ============================================
-- STEP 11: ATTENDANCE policies
-- ============================================

CREATE POLICY "Super admin full access on attendance"
ON attendance FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Institute admin can manage attendance"
ON attendance FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
)
WITH CHECK (institute_id = auth.user_institute_id());

-- Teachers can manage attendance for their courses
CREATE POLICY "Teachers can manage attendance"
ON attendance FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
)
WITH CHECK (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
);

-- Students can view own attendance
CREATE POLICY "Students can view own attendance"
ON attendance FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- ============================================
-- STEP 12: ASSESSMENTS policies
-- ============================================

CREATE POLICY "Super admin full access on assessments"
ON assessments FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Institute admin can manage assessments"
ON assessments FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'institute'
)
WITH CHECK (institute_id = auth.user_institute_id());

CREATE POLICY "Teachers can manage assessments"
ON assessments FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
)
WITH CHECK (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
);

CREATE POLICY "Students can view assessments"
ON assessments FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'student'
);

-- ============================================
-- STEP 13: ASSESSMENT_RESULTS policies
-- ============================================

CREATE POLICY "Super admin full access on assessment_results"
ON assessment_results FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Institute admin can manage results"
ON assessment_results FOR ALL
TO authenticated
USING (
  assessment_id IN (
    SELECT id FROM assessments WHERE institute_id = auth.user_institute_id()
  )
  AND auth.user_role() = 'institute'
)
WITH CHECK (
  assessment_id IN (
    SELECT id FROM assessments WHERE institute_id = auth.user_institute_id()
  )
);

CREATE POLICY "Teachers can manage results"
ON assessment_results FOR ALL
TO authenticated
USING (
  assessment_id IN (
    SELECT id FROM assessments WHERE institute_id = auth.user_institute_id()
  )
  AND auth.user_role() = 'teacher'
)
WITH CHECK (
  assessment_id IN (
    SELECT id FROM assessments WHERE institute_id = auth.user_institute_id()
  )
);

-- Students can view own results
CREATE POLICY "Students can view own results"
ON assessment_results FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- ============================================
-- STEP 14: JUNCTION TABLE policies
-- ============================================

-- Student Courses
CREATE POLICY "Service role bypass student_courses policy"
ON student_courses FOR ALL TO service_role USING (true);

CREATE POLICY "Institute can manage student enrollments"
ON student_courses FOR ALL
TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE institute_id = auth.user_institute_id()
  )
  AND auth.user_role() = 'institute'
);

CREATE POLICY "Students can view own enrollments"
ON student_courses FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Teacher Courses
CREATE POLICY "Institute can manage teacher assignments"
ON teacher_courses FOR ALL
TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE institute_id = auth.user_institute_id()
  )
  AND auth.user_role() = 'institute'
);

CREATE POLICY "Teachers can view own assignments"
ON teacher_courses FOR SELECT
TO authenticated
USING (
  teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
);

-- ============================================
-- STEP 15: SESSION & TOKEN policies
-- ============================================

CREATE POLICY "Users can manage own sessions"
ON sessions FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own refresh tokens"
ON refresh_tokens FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 16: SECURITY LOGS policies
-- ============================================

CREATE POLICY "Super admin full access on security_logs"
ON security_logs FOR ALL
TO authenticated
USING (auth.is_super_admin())
WITH CHECK (auth.is_super_admin());

CREATE POLICY "Users can view own security logs"
ON security_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- STEP 17: Create indexes for RLS performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_institute_id ON categories(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_institute_id ON courses(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_institute_published ON courses(institute_id, is_published);
CREATE INDEX IF NOT EXISTS idx_students_institute_id ON students(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_institute_id ON teachers(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_institute_id ON attendance(institute_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_assessments_institute_id ON assessments(institute_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_student_id ON assessment_results(student_id);

-- ============================================
-- DONE!
-- Your database now has Row Level Security enabled
-- ============================================
