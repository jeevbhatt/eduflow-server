-- ============================================
-- RLS POLICIES FOR NEW DASHBOARD FEATURES
-- Run after main RLS setup
-- ============================================

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SERVICE ROLE BYPASS POLICIES
-- ============================================
CREATE POLICY "service_role_conversations" ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_conversation_participants" ON conversation_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_schedule_events" ON schedule_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_schedule_event_attendees" ON schedule_event_attendees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_assignments" ON assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_assignment_submissions" ON assignment_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_forum_categories" ON forum_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_forum_topics" ON forum_topics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_forum_posts" ON forum_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_study_groups" ON study_groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_study_group_members" ON study_group_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_study_sessions" ON study_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_support_tickets" ON support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_support_ticket_messages" ON support_ticket_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_student_progress" ON student_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_achievements" ON achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_student_achievements" ON student_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_learning_streaks" ON learning_streaks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_payments" ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_feature_flags" ON feature_flags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_experiments" ON experiments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_experiment_results" ON experiment_results FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- MESSAGING POLICIES
-- ============================================
CREATE POLICY "conversations_participant_access" ON conversations FOR SELECT TO authenticated
USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "conversation_participants_own" ON conversation_participants FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_view" ON conversation_participants FOR SELECT TO authenticated
USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "messages_conversation_access" ON messages FOR SELECT TO authenticated
USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "messages_send" ON messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- SCHEDULE POLICIES
-- ============================================
CREATE POLICY "schedule_events_institute_manage" ON schedule_events FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "schedule_events_view" ON schedule_events FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "schedule_attendees_own" ON schedule_event_attendees FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "schedule_attendees_view" ON schedule_event_attendees FOR SELECT TO authenticated
USING (
  event_id IN (
    SELECT id FROM schedule_events WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- ============================================
-- ASSIGNMENTS POLICIES
-- ============================================
CREATE POLICY "assignments_institute_manage" ON assignments FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "assignments_student_view" ON assignments FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "submissions_teacher_manage" ON assignment_submissions FOR ALL TO authenticated
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "submissions_student_own" ON assignment_submissions FOR ALL TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
)
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- ============================================
-- FORUM POLICIES
-- ============================================
CREATE POLICY "forum_categories_institute_manage" ON forum_categories FOR ALL TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'institute'
);

CREATE POLICY "forum_categories_view" ON forum_categories FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "forum_topics_create" ON forum_topics FOR INSERT TO authenticated
WITH CHECK (
  category_id IN (
    SELECT id FROM forum_categories WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
  AND author_id = auth.uid()
);

CREATE POLICY "forum_topics_view" ON forum_topics FOR SELECT TO authenticated
USING (
  category_id IN (
    SELECT id FROM forum_categories WHERE institute_id IN (
      SELECT id FROM institutes WHERE institute_number = (
        SELECT current_institute_number FROM users WHERE id = auth.uid()
      )
    )
  )
);

CREATE POLICY "forum_topics_manage_own" ON forum_topics FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "forum_posts_create" ON forum_posts FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "forum_posts_view" ON forum_posts FOR SELECT TO authenticated
USING (
  topic_id IN (
    SELECT id FROM forum_topics WHERE category_id IN (
      SELECT id FROM forum_categories WHERE institute_id IN (
        SELECT id FROM institutes WHERE institute_number = (
          SELECT current_institute_number FROM users WHERE id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "forum_posts_manage_own" ON forum_posts FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- ============================================
-- STUDY GROUP POLICIES
-- ============================================
CREATE POLICY "study_groups_institute_view" ON study_groups FOR SELECT TO authenticated
USING (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "study_groups_create" ON study_groups FOR INSERT TO authenticated
WITH CHECK (
  institute_id IN (
    SELECT id FROM institutes WHERE institute_number = (
      SELECT current_institute_number FROM users WHERE id = auth.uid()
    )
  )
  AND created_by = auth.uid()
);

CREATE POLICY "study_group_members_own" ON study_group_members FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "study_group_members_admin" ON study_group_members FOR ALL TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "study_sessions_group_member" ON study_sessions FOR SELECT TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "study_sessions_admin_manage" ON study_sessions FOR ALL TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- SUPPORT TICKET POLICIES
-- ============================================
CREATE POLICY "support_tickets_own" ON support_tickets FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_assigned" ON support_tickets FOR ALL TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "support_ticket_messages_ticket_access" ON support_ticket_messages FOR SELECT TO authenticated
USING (
  ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid() OR assigned_to = auth.uid()
  )
);

CREATE POLICY "support_ticket_messages_send" ON support_ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid() OR assigned_to = auth.uid()
  )
);

-- ============================================
-- PROGRESS & ACHIEVEMENTS POLICIES
-- ============================================
CREATE POLICY "student_progress_own" ON student_progress FOR ALL TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "student_progress_teacher_view" ON student_progress FOR SELECT TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "achievements_view" ON achievements FOR SELECT TO authenticated
USING (true);

CREATE POLICY "student_achievements_own" ON student_achievements FOR SELECT TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "student_achievements_manage" ON student_achievements FOR ALL TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('institute', 'teacher')
);

CREATE POLICY "learning_streaks_own" ON learning_streaks FOR ALL TO authenticated
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- ============================================
-- PAYMENTS POLICIES (Admin only via service_role)
-- ============================================
CREATE POLICY "payments_institute_view" ON payments FOR SELECT TO authenticated
USING (
  institute_id IN (SELECT id FROM institutes WHERE owner_id = auth.uid())
);

-- ============================================
-- FEATURE FLAGS & EXPERIMENTS (Admin only via service_role)
-- ============================================
-- Only accessible via service_role, no authenticated policies needed

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_schedule_events_institute_id ON schedule_events(institute_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_assignments_institute_id ON assignments(institute_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_institute_id ON payments(institute_id);
