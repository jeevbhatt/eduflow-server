-- ============================================
-- STEP 1: Enable RLS on all tables
-- This file CAN be run via Prisma CLI
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
-- Create helper functions in PUBLIC schema
-- (Supabase auth schema requires Dashboard)
-- ============================================

-- Get current user's institute ID from app context
CREATE OR REPLACE FUNCTION public.get_user_institute_id(user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM institutes WHERE institute_number = (
    SELECT current_institute_number FROM users WHERE id = user_id
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = user_id
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- Create performance indexes
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
