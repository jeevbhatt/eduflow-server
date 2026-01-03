-- ============================================
-- SERVICE ROLE POLICIES
-- Allows backend API (using service_role key) to bypass RLS
-- Run via Prisma CLI
-- ============================================

-- Users table
CREATE POLICY "service_role_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Institutes table
CREATE POLICY "service_role_institutes" ON institutes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Categories table
CREATE POLICY "service_role_categories" ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Courses table
CREATE POLICY "service_role_courses" ON courses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Students table
CREATE POLICY "service_role_students" ON students FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Teachers table
CREATE POLICY "service_role_teachers" ON teachers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Chapters table
CREATE POLICY "service_role_chapters" ON chapters FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Lessons table
CREATE POLICY "service_role_lessons" ON lessons FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Attendance table
CREATE POLICY "service_role_attendance" ON attendance FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Assessments table
CREATE POLICY "service_role_assessments" ON assessments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Assessment Results table
CREATE POLICY "service_role_assessment_results" ON assessment_results FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Student Courses table
CREATE POLICY "service_role_student_courses" ON student_courses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Teacher Courses table
CREATE POLICY "service_role_teacher_courses" ON teacher_courses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sessions table
CREATE POLICY "service_role_sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Refresh Tokens table
CREATE POLICY "service_role_refresh_tokens" ON refresh_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Security Logs table
CREATE POLICY "service_role_security_logs" ON security_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
