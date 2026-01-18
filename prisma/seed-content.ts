
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONTENT_MAP = {
  "B.Sc. CSIT - 1st Year (C Programming)": [
    {
      name: "Unit 1: Fundamentals of C",
      duration: 300,
      lessons: [
        { name: "Introduction to Program Logic", duration: 45, description: "Flowcharts and algorithms." },
        { name: "Basic Structure of C Program", duration: 60, description: "Headers, main, and variables." },
        { name: "Data Types & Operators", duration: 60, description: "Integers, floats, and logical operators." },
      ]
    },
    {
      name: "Unit 2: Control Structures",
      duration: 400,
      lessons: [
        { name: "If-Else and Nested Conditions", duration: 90, description: "Decision making in code." },
        { name: "Loops: For, While, Do-While", duration: 120, description: "Iteration techniques." },
      ]
    },
    {
      name: "Unit 3: Functions & Arrays",
      duration: 500,
      lessons: [
        { name: "Defining Functions", duration: 60, description: "Arguments and return types." },
        { name: "1D and 2D Arrays", duration: 90, description: "Storing collection of data." },
      ]
    }
  ],
  "SEE Compulsory Math (Full Syllabus)": [
    {
      name: "Sets & Arithmetic",
      duration: 450,
      lessons: [
        { name: "Set Operations & Venn Diagrams", duration: 90, description: "Solving 2 and 3 circle problems." },
        { name: "Compound Interest", duration: 60, description: "Bank interest and population growth." },
        { name: "Tax & Wealth", duration: 60, description: "VAT and service charges calculations." },
      ]
    },
    {
      name: "Algebra",
      duration: 600,
      lessons: [
        { name: "Factorization", duration: 120, description: "HCF and LCM of algebraic expressions." },
        { name: "Radicals & Indices", duration: 90, description: "Working with powers and roots." },
      ]
    },
    {
      name: "Geometry & Trigonometry",
      duration: 700,
      lessons: [
        { name: "Area of Triangles & Quadrilaterals", duration: 120, description: "Formula-based area calculations." },
        { name: "Circles: Theorems & Deductions", duration: 180, description: "Proving geometric theorems." },
      ]
    }
  ],
  "Class 11 Physics (Full Course)": [
    {
      name: "Unit 1: Mechanics",
      duration: 450,
      lessons: [
        { name: "Physical Quantities & Dimensions", duration: 60, description: "SI units and dimensional analysis." },
        { name: "Vectors & Scalars", duration: 60, description: "Resolution and resultants." },
        { name: "Kinematics & Projectile Motion", duration: 90, description: "2D motion under gravity." },
      ]
    },
    {
      name: "Unit 2: Heat & Thermodynamics",
      duration: 400,
      lessons: [
        { name: "Thermal Expansion", duration: 60, description: "Linear, superficial, and cubical expansion." },
        { name: "Laws of Thermodynamics", duration: 90, description: "Energy conservation in heat systems." },
      ]
    }
  ],
  "Section Officer - Governance & Law": [
    {
      name: "Constitution of Nepal",
      duration: 500,
      lessons: [
        { name: "Fundamental Rights & Duties", duration: 90, description: "Articles 16-48 of current constitution." },
        { name: "Federalism & State Power", duration: 90, description: "Allocation of power between local and federal." },
      ]
    },
    {
      name: "Public Administration",
      duration: 400,
      lessons: [
        { name: "Concept of Civil Service", duration: 60, description: "History and role in Nepal." },
        { name: "Financial Management (Audit)", duration: 90, description: "Government budgeting and accounting." },
      ]
    }
  ],
  "MERN Stack Web Development": [
    {
      name: "React.js Mastery",
      duration: 1200,
      lessons: [
        { name: "Hooks & Custom Hooks", duration: 180, description: "useMemo, useCallback and custom logic." },
        { name: "Server Side Rendering with Next.js", duration: 120, description: "SEO and performance optimization." },
      ]
    },
    {
      name: "Node & Express Backend",
      duration: 800,
      lessons: [
        { name: "RESTful API Design", duration: 120, description: "CRUD operations and middleware." },
        { name: "Token Authentication (JWT)", duration: 90, description: "Secure login systems." },
      ]
    }
  ]
};

async function main() {
  console.log("📝 Seeding Chapters and Lessons...");

  const courses = await prisma.course.findMany({
    where: {
      name: { in: Object.keys(CONTENT_MAP) }
    },
    select: { id: true, name: true }
  });

  console.log(`   🔍 Found ${courses.length} instances of deep-content courses.`);

  for (const course of courses) {
    const chapters = CONTENT_MAP[course.name as keyof typeof CONTENT_MAP];

    for (let i = 0; i < chapters.length; i++) {
      const chapterData = chapters[i];
      const createdChapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          name: chapterData.name,
          duration: chapterData.duration,
          level: "beginner",
          order: i,
        }
      });

      await prisma.lesson.createMany({
        data: chapterData.lessons.map((lesson, lIdx) => ({
          chapterId: createdChapter.id,
          name: lesson.name,
          duration: lesson.duration,
          description: lesson.description,
          order: lIdx,
        }))
      });
    }
  }

  console.log(`✅ Deep content (Chapters & Lessons) seeded successfully.`);
}

main()
  .catch((e) => {
    console.error("Content seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
