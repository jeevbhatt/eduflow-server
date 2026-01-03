-- ============================================
-- LIBRARY TABLES RLS POLICIES
-- ============================================

-- Enable RLS on library tables
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_borrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SERVICE ROLE BYPASS
-- ============================================
CREATE POLICY "service_role_library_categories" ON library_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_library_resources" ON library_resources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_library_borrows" ON library_borrows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_library_favorites" ON library_favorites FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- LIBRARY CATEGORIES POLICIES
-- ============================================
CREATE POLICY "library_categories_institute_all" ON library_categories FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "library_categories_member_select" ON library_categories FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

-- ============================================
-- LIBRARY RESOURCES POLICIES
-- ============================================
CREATE POLICY "library_resources_institute_all" ON library_resources FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "library_resources_teacher_manage" ON library_resources FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'teacher'
  AND uploaded_by = auth.uid()
);

CREATE POLICY "library_resources_student_select" ON library_resources FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND is_public = true
);

-- ============================================
-- LIBRARY BORROWS POLICIES
-- ============================================
CREATE POLICY "library_borrows_manager_all" ON library_borrows FOR ALL TO authenticated
USING (
  resource_id IN (
    SELECT id FROM library_resources WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "library_borrows_student_own" ON library_borrows FOR SELECT TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- ============================================
-- LIBRARY FAVORITES POLICIES
-- ============================================
CREATE POLICY "library_favorites_own_all" ON library_favorites FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_library_categories_institute_id ON library_categories(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_library_resources_institute_id ON library_resources(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_library_resources_category_id ON library_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_type ON library_resources(type);
CREATE INDEX IF NOT EXISTS idx_library_borrows_student_id ON library_borrows(student_id);
CREATE INDEX IF NOT EXISTS idx_library_borrows_status ON library_borrows(status);
CREATE INDEX IF NOT EXISTS idx_library_favorites_user_id ON library_favorites(user_id);
