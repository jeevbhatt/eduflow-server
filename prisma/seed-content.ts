
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONTENT_MAP = {
  "B.Sc. Computer Science & IT (CSIT)": [
    {
      name: "Chapter 1: Introduction to Computing",
      duration: 300,
      lessons: [
        { name: "Evolution of Computers", duration: 45, description: "History and generations of computer systems." },
        { name: "Computer Architecture", duration: 60, description: "Von Neumann architecture and CPU components." },
        { name: "Data Representation", duration: 60, description: "Binary, Hexadecimal, and ASCII/Unicode." },
      ]
    },
    {
      name: "Chapter 2: Programming Logic",
      duration: 600,
      lessons: [
        { name: "Algorithms and Flowcharts", duration: 90, description: "Problem-solving techniques using visual tools." },
        { name: "Basic Syntax of C", duration: 120, description: "Learning variables, types, and directives." },
        { name: "Control Structures", duration: 120, description: "If-else conditions and Switch cases." },
      ]
    }
  ],
  "Class 10 - Science (Nepal Board)": [
    {
      name: "Unit 1: Force",
      duration: 450,
      lessons: [
        { name: "Gravitation", duration: 60, description: "Newton's law of universal gravitation." },
        { name: "Gravity and Acceleration", duration: 60, description: "Concept of g and weight vs mass." },
        { name: "Free Fall and Weightlessness", duration: 60, description: "Understanding terminal velocity." },
      ]
    },
    {
      name: "Unit 2: Pressure",
      duration: 400,
      lessons: [
        { name: "Pascal's Law", duration: 60, description: "Hydraulic press and lifting mechanism." },
        { name: "Upthrust and Archimedes Principle", duration: 90, description: "Why things float in fluids." },
        { name: "Atmospheric Pressure", duration: 45, description: "Torricelli barometers and weather." },
      ]
    }
  ],
  "Fullstack Web Development (MERN)": [
    {
      name: "Module 1: Frontend Mastery",
      duration: 1200,
      lessons: [
        { name: "Modern React Hook", duration: 180, description: "State, Effect, and Context in depth." },
        { name: "Tailwind CSS Layouts", duration: 120, description: "Building responsive grids and flexbox." },
        { name: "State Management with Zustand", duration: 120, description: "Lightweight state management." },
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
