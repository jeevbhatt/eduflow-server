# Multi-Tenant Architecture Analysis & RLS Strategy

## Current Architecture Issues

### ❌ Dynamic Table Per Institute (Sequelize)
```sql
-- Current approach creates:
course_123      -- Institute 123's courses
student_123     -- Institute 123's students
teacher_123     -- Institute 123's teachers
course_456      -- Institute 456's courses
student_456     -- Institute 456's students
teacher_456     -- Institute 456's teachers
```

**Problems:**
1. **Scalability**: 1,000 institutes × 10 tables = 10,000+ tables
2. **Management**: Migrations become nightmares
3. **Performance**: PostgreSQL degrades with 10,000+ tables
4. **Queries**: Cannot query across institutes (analytics impossible)
5. **RLS**: Cannot use RLS policies (need to create per table)
6. **Security**: SQL injection risk even with `buildTableName()`
7. **Backups**: Complex and slow
8. **Monitoring**: Hard to track performance

---

## ✅ Recommended: Single-Schema Multi-Tenant with RLS

### Architecture Redesign

```prisma
// All data in unified tables with institute_id for tenant isolation

model Category {
  id          String    @id @default(uuid()) @db.Uuid
  instituteId String    @map("institute_id") @db.Uuid  // Tenant isolation
  name        String
  description String?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  institute   Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  courses     Course[]

  @@unique([instituteId, name]) // Unique within institute
  @@index([instituteId])        // Fast tenant queries
  @@map("categories")
}

model Course {
  id           String      @id @default(uuid()) @db.Uuid
  instituteId  String      @map("institute_id") @db.Uuid
  categoryId   String      @map("category_id") @db.Uuid
  name         String      @map("course_name")
  description  String?     @map("course_description")
  price        Decimal     @map("course_price") @db.Decimal(10, 2)
  duration     Int         @map("course_duration") // in hours
  level        CourseLevel @map("course_level")
  thumbnail    String?     @map("course_thumbnail")
  isPublished  Boolean     @default(false) @map("is_published")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  deletedAt    DateTime?   @map("deleted_at")

  institute    Institute   @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  category     Category    @relation(fields: [categoryId], references: [id])
  chapters     Chapter[]
  students     StudentCourse[]
  teachers     TeacherCourse[]

  @@index([instituteId])
  @@index([categoryId])
  @@map("courses")
}

model Student {
  id              String          @id @default(uuid()) @db.Uuid
  instituteId     String          @map("institute_id") @db.Uuid
  userId          String?         @map("user_id") @db.Uuid // Link to User table
  firstName       String          @map("first_name")
  lastName        String          @map("last_name")
  email           String
  phone           String?
  address         String?
  enrolledDate    DateTime        @default(now()) @map("enrolled_date")
  photo           String?
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  deletedAt       DateTime?       @map("deleted_at")

  institute       Institute       @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  user            User?           @relation(fields: [userId], references: [id])
  enrolledCourses StudentCourse[]
  attendance      Attendance[]
  assessments     AssessmentResult[]

  @@unique([instituteId, email])
  @@index([instituteId])
  @@index([userId])
  @@map("students")
}

model Teacher {
  id            String          @id @default(uuid()) @db.Uuid
  instituteId   String          @map("institute_id") @db.Uuid
  userId        String?         @map("user_id") @db.Uuid
  firstName     String          @map("first_name")
  lastName      String          @map("last_name")
  email         String
  phone         String
  experience    Int             // years
  salary        Decimal         @db.Decimal(10, 2)
  joinedDate    DateTime        @map("joined_date")
  photo         String?
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  deletedAt     DateTime?       @map("deleted_at")

  institute     Institute       @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  user          User?           @relation(fields: [userId], references: [id])
  courses       TeacherCourse[]

  @@unique([instituteId, email])
  @@index([instituteId])
  @@index([userId])
  @@map("teachers")
}

model Chapter {
  id        String      @id @default(uuid()) @db.Uuid
  courseId  String      @map("course_id") @db.Uuid
  name      String      @map("chapter_name")
  duration  Int         @map("chapter_duration") // minutes
  level     CourseLevel @map("chapter_level")
  order     Int         @default(0)
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")

  course    Course      @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons   Lesson[]

  @@index([courseId])
  @@map("chapters")
}

model Lesson {
  id          String   @id @default(uuid()) @db.Uuid
  chapterId   String   @map("chapter_id") @db.Uuid
  name        String   @map("lesson_name")
  description String?  @map("lesson_description")
  videoUrl    String?  @map("video_url")
  duration    Int?     @map("lesson_duration") // minutes
  order       Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  @@index([chapterId])
  @@map("lessons")
}

model Attendance {
  id             String           @id @default(uuid()) @db.Uuid
  instituteId    String           @map("institute_id") @db.Uuid
  courseId       String           @map("course_id") @db.Uuid
  studentId      String           @map("student_id") @db.Uuid
  date           DateTime         @db.Date
  status         AttendanceStatus
  remarks        String?
  markedBy       String           @map("marked_by") @db.Uuid // Teacher user_id
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  institute      Institute        @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  student        Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId, date])
  @@index([instituteId])
  @@index([courseId])
  @@index([date])
  @@map("attendance")
}

model Assessment {
  id          String             @id @default(uuid()) @db.Uuid
  instituteId String             @map("institute_id") @db.Uuid
  courseId    String             @map("course_id") @db.Uuid
  title       String
  description String?
  maxMarks    Int                @map("max_marks")
  passingMarks Int               @map("passing_marks")
  scheduledAt DateTime?          @map("scheduled_at")
  duration    Int?               // minutes
  createdAt   DateTime           @default(now()) @map("created_at")
  updatedAt   DateTime           @updatedAt @map("updated_at")

  institute   Institute          @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  results     AssessmentResult[]

  @@index([instituteId])
  @@index([courseId])
  @@map("assessments")
}

model AssessmentResult {
  id           String     @id @default(uuid()) @db.Uuid
  assessmentId String     @map("assessment_id") @db.Uuid
  studentId    String     @map("student_id") @db.Uuid
  marks        Int
  remarks      String?
  submittedAt  DateTime?  @map("submitted_at")
  gradedBy     String?    @map("graded_by") @db.Uuid // Teacher user_id
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  student      Student    @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([assessmentId, studentId])
  @@index([studentId])
  @@map("assessment_results")
}

// Junction tables
model StudentCourse {
  id          String   @id @default(uuid()) @db.Uuid
  studentId   String   @map("student_id") @db.Uuid
  courseId    String   @map("course_id") @db.Uuid
  enrolledAt  DateTime @default(now()) @map("enrolled_at")

  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@index([courseId])
  @@map("student_courses")
}

model TeacherCourse {
  id         String   @id @default(uuid()) @db.Uuid
  teacherId  String   @map("teacher_id") @db.Uuid
  courseId   String   @map("course_id") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at")

  teacher    Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([teacherId, courseId])
  @@index([courseId])
  @@map("teacher_courses")
}

// Enums
enum CourseLevel {
  beginner
  intermediate
  advanced
}

enum AttendanceStatus {
  present
  absent
  late
  excused
}
```

---

## 🔒 Row Level Security (RLS) Configuration

### Why RLS is CRITICAL for This Architecture

**Benefits:**
1. **Database-Level Security**: Protection even if app logic fails
2. **Zero Trust**: Every query automatically filtered by tenant
3. **Performance**: PostgreSQL optimizes RLS with indexes
4. **Compliance**: GDPR, SOC2 require data isolation
5. **Multi-User Safety**: Prevents bugs from leaking data

### Supabase RLS Policies

Create these policies in Supabase Dashboard → Database → RLS:

```sql
-- ============================================
-- INSTITUTE RLS POLICIES
-- ============================================

-- Enable RLS on all tables
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

-- ============================================
-- HELPER FUNCTION: Get User's Institute ID
-- ============================================
CREATE OR REPLACE FUNCTION auth.user_institute_id()
RETURNS UUID AS $$
  SELECT current_institute_number::UUID
  FROM users
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check User Role
-- ============================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT
  FROM users
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- CATEGORIES TABLE POLICIES
-- ============================================

-- Super admin can see all
CREATE POLICY "Super admin full access on categories"
ON categories
FOR ALL
TO authenticated
USING (auth.user_role() = 'super-admin');

-- Institute admin can manage their categories
CREATE POLICY "Institute admin can manage categories"
ON categories
FOR ALL
TO authenticated
USING (institute_id = auth.user_institute_id())
WITH CHECK (institute_id = auth.user_institute_id());

-- Teachers can view their institute's categories
CREATE POLICY "Teachers can view categories"
ON categories
FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() IN ('teacher', 'institute')
);

-- Students can view their institute's categories
CREATE POLICY "Students can view categories"
ON categories
FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'student'
);

-- ============================================
-- COURSES TABLE POLICIES
-- ============================================

CREATE POLICY "Super admin full access on courses"
ON courses
FOR ALL
TO authenticated
USING (auth.user_role() = 'super-admin');

CREATE POLICY "Institute admin can manage courses"
ON courses
FOR ALL
TO authenticated
USING (institute_id = auth.user_institute_id())
WITH CHECK (institute_id = auth.user_institute_id());

CREATE POLICY "Teachers can manage their courses"
ON courses
FOR ALL
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
);

CREATE POLICY "Students can view published courses"
ON courses
FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'student'
  AND is_published = true
);

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================

CREATE POLICY "Super admin full access on students"
ON students
FOR ALL
TO authenticated
USING (auth.user_role() = 'super-admin');

CREATE POLICY "Institute admin can manage students"
ON students
FOR ALL
TO authenticated
USING (institute_id = auth.user_institute_id());

CREATE POLICY "Teachers can view their students"
ON students
FOR SELECT
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
);

CREATE POLICY "Students can view own profile"
ON students
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND auth.user_role() = 'student'
);

CREATE POLICY "Students can update own profile"
ON students
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- TEACHERS TABLE POLICIES
-- ============================================

CREATE POLICY "Super admin full access on teachers"
ON teachers
FOR ALL
TO authenticated
USING (auth.user_role() = 'super-admin');

CREATE POLICY "Institute admin can manage teachers"
ON teachers
FOR ALL
TO authenticated
USING (institute_id = auth.user_institute_id());

CREATE POLICY "Teachers can view own profile"
ON teachers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND auth.user_role() = 'teacher'
);

-- ============================================
-- ATTENDANCE TABLE POLICIES
-- ============================================

CREATE POLICY "Institute admin full access on attendance"
ON attendance
FOR ALL
TO authenticated
USING (institute_id = auth.user_institute_id());

CREATE POLICY "Teachers can manage attendance"
ON attendance
FOR ALL
TO authenticated
USING (
  institute_id = auth.user_institute_id()
  AND auth.user_role() = 'teacher'
);

CREATE POLICY "Students can view own attendance"
ON attendance
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  AND auth.user_role() = 'student'
);
```

---

## 🔧 Prisma Client Configuration with RLS

### Update Database Client for RLS

```typescript
// src/database/prisma.ts
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with user context for RLS
 * Pass userId from JWT to enable RLS policies
 */
function createPrismaClient(userId?: string): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg({
    connectionString,
    // Set user context for RLS
    ...(userId && {
      connection: {
        application_name: `user_${userId}`,
      },
    }),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  });
}

// Singleton for non-user-specific queries
const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;

// User-scoped client factory for RLS
export function getPrismaClientForUser(userId: string) {
  return createPrismaClient(userId);
}
```

### Middleware for User Context

```typescript
// src/middleware/rlsMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { getPrismaClientForUser } from "../database/prisma";

// Extend Express Request to include user-scoped Prisma client
declare global {
  namespace Express {
    interface Request {
      prisma?: PrismaClient;
      userId?: string;
    }
  }
}

/**
 * RLS Middleware - Creates user-scoped Prisma client
 * Must be used AFTER authentication middleware
 */
export const rlsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Assuming auth middleware sets req.user
  const userId = req.user?.id;

  if (userId) {
    // Create user-scoped client with RLS context
    req.prisma = getPrismaClientForUser(userId);
  }

  next();
};
```

---

## 📊 Performance Considerations

### Indexing Strategy

```sql
-- Ensure all institute_id columns are indexed
CREATE INDEX CONCURRENTLY idx_categories_institute_id ON categories(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_courses_institute_id ON courses(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_students_institute_id ON students(institute_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_teachers_institute_id ON teachers(institute_id) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_courses_institute_published ON courses(institute_id, is_published);
CREATE INDEX CONCURRENTLY idx_attendance_student_date ON attendance(student_id, date);
```

### Query Optimization

RLS automatically adds `WHERE institute_id = <user_institute>` to ALL queries. PostgreSQL optimizer uses indexes efficiently.

---

## 🚀 Migration Strategy

### Phase 1: Add New Tables (Keep Sequelize Running)
1. Add new Prisma models to schema
2. Run migration: `npm run prisma:migrate`
3. Enable RLS policies in Supabase
4. Test with new features first

### Phase 2: Data Migration
```typescript
// Migration script: migrate-to-unified-tables.ts
import prisma from './database/prisma';
import sequelize from './database/connection';
import { QueryTypes } from 'sequelize';

async function migrateInstituteData(instituteNumber: string) {
  const instituteTable = `institute_${instituteNumber}`;

  // Get institute ID from new table
  const institute = await prisma.institute.findUnique({
    where: { instituteNumber }
  });

  if (!institute) throw new Error(`Institute ${instituteNumber} not found`);

  // Migrate categories
  const categories = await sequelize.query(
    `SELECT * FROM category_${instituteNumber}`,
    { type: QueryTypes.SELECT }
  );

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: {
        id: cat.id,
        instituteId: institute.id,
        name: cat.categoryName,
        description: cat.categoryDescription,
      },
      update: {},
    });
  }

  // Migrate courses, students, teachers...
  // Similar pattern for each table
}
```

### Phase 3: Switch Controllers to Prisma
```typescript
// Before (Sequelize - Dynamic Tables)
const courses = await sequelize.query(
  `SELECT * FROM course_${instituteNumber}`,
  { type: QueryTypes.SELECT }
);

// After (Prisma - RLS Handles Filtering)
const courses = await req.prisma.course.findMany({
  // RLS automatically filters by institute_id
  where: { deletedAt: null }
});
```

### Phase 4: Remove Sequelize
1. Drop old dynamic tables
2. Remove Sequelize dependencies
3. Remove `buildTableName()` security helpers

---

## ✅ Benefits Summary

| Aspect | Dynamic Tables (Current) | Unified + RLS (Recommended) |
|--------|------------------------|---------------------------|
| **Scalability** | ❌ Poor (10K+ tables) | ✅ Excellent (12 tables) |
| **Security** | ⚠️ App-level only | ✅ Database-level RLS |
| **Performance** | ❌ Degrades with scale | ✅ Index-optimized |
| **Queries** | ❌ Cannot cross-institute | ✅ Easy analytics |
| **Migrations** | ❌ Nightmare | ✅ Simple |
| **Backup/Restore** | ❌ Complex | ✅ Standard |
| **Monitoring** | ❌ Per-table stats | ✅ Unified metrics |
| **Code Complexity** | ❌ High | ✅ Low |
| **Type Safety** | ⚠️ Runtime checks | ✅ Compile-time (Prisma) |
| **Audit Trail** | ❌ Per-table logs | ✅ Unified logging |

---

## 🎯 Recommendation

**Implement the unified schema with RLS immediately.**

The current dynamic table approach will not scale and creates significant security, performance, and maintenance risks. Row Level Security is the industry-standard solution for multi-tenant SaaS applications and provides defense-in-depth security at the database layer.
