-- ============================================
-- AUTHENTICATED USER POLICIES
-- Role-based access control for Supabase authenticated users
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================
-- INSTITUTES TABLE
-- ============================================
CREATE POLICY "institutes_owner_all" ON institutes FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "institutes_member_select" ON institutes FOR SELECT TO authenticated
USING (institute_number = (SELECT current_institute_number FROM users WHERE id = auth.uid()));

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE POLICY "categories_institute_all" ON categories FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "categories_member_select" ON categories FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE POLICY "courses_institute_all" ON courses FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "courses_teacher_manage" ON courses FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'teacher'
  AND id IN (
    SELECT course_id FROM teacher_courses WHERE teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "courses_student_select" ON courses FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND is_published = true
);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE POLICY "students_institute_all" ON students FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "students_teacher_select" ON students FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'teacher'
);

CREATE POLICY "students_own_select" ON students FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "students_own_update" ON students FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- TEACHERS TABLE
-- ============================================
CREATE POLICY "teachers_institute_all" ON teachers FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "teachers_own_select" ON teachers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "teachers_own_update" ON teachers FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- CHAPTERS TABLE
-- ============================================
CREATE POLICY "chapters_course_manager" ON chapters FOR ALL TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "chapters_student_select" ON chapters FOR SELECT TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE is_published = true AND institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- ============================================
-- LESSONS TABLE
-- ============================================
CREATE POLICY "lessons_course_manager" ON lessons FOR ALL TO authenticated
USING (
  chapter_id IN (
    SELECT ch.id FROM chapters ch
    JOIN courses c ON ch.course_id = c.id
    WHERE c.institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "lessons_student_select" ON lessons FOR SELECT TO authenticated
USING (
  chapter_id IN (
    SELECT ch.id FROM chapters ch
    JOIN courses c ON ch.course_id = c.id
    WHERE c.is_published = true AND c.institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE POLICY "attendance_institute_all" ON attendance FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "attendance_student_select" ON attendance FOR SELECT TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- ============================================
-- ASSESSMENTS TABLE
-- ============================================
CREATE POLICY "assessments_institute_all" ON assessments FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "assessments_student_select" ON assessments FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

-- ============================================
-- ASSESSMENT RESULTS TABLE
-- ============================================
CREATE POLICY "results_manager_all" ON assessment_results FOR ALL TO authenticated
USING (
  assessment_id IN (
    SELECT id FROM assessments WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "results_student_select" ON assessment_results FOR SELECT TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- ============================================
-- STUDENT COURSES TABLE
-- ============================================
CREATE POLICY "student_courses_institute_all" ON student_courses FOR ALL TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "student_courses_own_select" ON student_courses FOR SELECT TO authenticated
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- ============================================
-- TEACHER COURSES TABLE
-- ============================================
CREATE POLICY "teacher_courses_institute_all" ON teacher_courses FOR ALL TO authenticated
USING (
  course_id IN (
    SELECT id FROM courses WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "teacher_courses_own_select" ON teacher_courses FOR SELECT TO authenticated
USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE POLICY "sessions_own_all" ON sessions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
CREATE POLICY "refresh_tokens_own_all" ON refresh_tokens FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- SECURITY LOGS TABLE
-- ============================================
CREATE POLICY "security_logs_own_select" ON security_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());
