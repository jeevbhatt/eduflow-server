
import { PrismaClient, CourseLevel, Course } from "@prisma/client";

const prisma = new PrismaClient();

const COURSES_DATA = [
  // --- UNIVERSITY (TU/KU/PU Style) ---
  { categoryName: "Science & Technology", name: "B.Sc. CSIT - 1st Year (C Programming)", price: 45000, duration: 150, level: "beginner" },
  { categoryName: "Science & Technology", name: "BCA - 2nd Semester (Data Structures)", price: 38000, duration: 140, level: "intermediate" },
  { categoryName: "Science & Technology", name: "BIT - Database Management Systems", price: 40000, duration: 160, level: "intermediate" },
  { categoryName: "Science & Technology", name: "Master of Computer Science (M.Sc.)", price: 120000, duration: 300, level: "advanced" },
  { categoryName: "Management", name: "BBA - Principles of Management", price: 55000, duration: 120, level: "beginner" },
  { categoryName: "Management", name: "BBS - Business Accountancy I", price: 15000, duration: 110, level: "beginner" },
  { categoryName: "Management", name: "MBA - Entrepreneurship & Innovation", price: 85000, duration: 180, level: "advanced" },
  { categoryName: "Engineering", name: "B.E. Civil - Structural Analysis", price: 95000, duration: 200, level: "advanced" },
  { categoryName: "Engineering", name: "B.E. Computer - Artificial Intelligence", price: 85000, duration: 180, level: "intermediate" },
  { categoryName: "Health Sciences", name: "MBBS - Human Anatomy (Phase I)", price: 450000, duration: 400, level: "advanced" },
  { categoryName: "Health Sciences", name: "B.Sc. Nursing - Community Health", price: 45000, duration: 150, level: "intermediate" },

  // --- HIGH SCHOOL (+2 NEB) ---
  { categoryName: "Science (+2)", name: "Class 11 Physics (Full Course)", price: 12500, duration: 180, level: "beginner" },
  { categoryName: "Science (+2)", name: "Class 12 Physics (Modern Physics)", price: 12500, duration: 180, level: "intermediate" },
  { categoryName: "Science (+2)", name: "Class 11 Chemistry (Organic Focus)", price: 12000, duration: 170, level: "beginner" },
  { categoryName: "Science (+2)", name: "Class 12 Chemistry (Physical Chemistry)", price: 12000, duration: 170, level: "intermediate" },
  { categoryName: "Science (+2)", name: "Plus 2 Biology (Complete Guide)", price: 11000, duration: 160, level: "beginner" },
  { categoryName: "Management (+2)", name: "Class 11 Accountancy (I)", price: 8000, duration: 140, level: "beginner" },
  { categoryName: "Management (+2)", name: "Class 12 Accountancy (II)", price: 8500, duration: 140, level: "intermediate" },
  { categoryName: "Management (+2)", name: "Business Math - Class 11", price: 7500, duration: 130, level: "beginner" },
  { categoryName: "Management (+2)", name: "Economics - Class 12", price: 7000, duration: 120, level: "beginner" },

  // --- SCHOOL (CDC / SEE) ---
  { categoryName: "Secondary (SEE)", name: "SEE Science - Physics & Biology", price: 5500, duration: 100, level: "beginner" },
  { categoryName: "Secondary (SEE)", name: "SEE Compulsory Math (Full Syllabus)", price: 6000, duration: 120, level: "beginner" },
  { categoryName: "Secondary (SEE)", name: "Grade 10 Optional Math", price: 6500, duration: 130, level: "intermediate" },
  { categoryName: "Secondary (SEE)", name: "Social Studies & Nepali (SEE)", price: 4500, duration: 90, level: "beginner" },
  { categoryName: "Primary (CDC)", name: "Grade 5 Science & Environment", price: 3000, duration: 80, level: "beginner" },
  { categoryName: "Primary (CDC)", name: "Grade 4 Creative Arts & English", price: 2500, duration: 70, level: "beginner" },
  { categoryName: "Pre-School", name: "Montessori English Basics", price: 2000, duration: 40, level: "beginner" },

  // --- TRAINING CENTER ---
  { categoryName: "Loksewa Preparation", name: "Kharidar - General Knowledge Set", price: 6500, duration: 60, level: "beginner" },
  { categoryName: "Loksewa Preparation", name: "Nayab Subba - IQ & Writing", price: 8500, duration: 80, level: "intermediate" },
  { categoryName: "Loksewa Preparation", name: "Section Officer - Governance & Law", price: 15000, duration: 120, level: "advanced" },
  { categoryName: "IT & Professional", name: "MERN Stack Web Development", price: 35000, duration: 120, level: "intermediate" },
  { categoryName: "IT & Professional", name: "Python for Data Science", price: 28000, duration: 90, level: "beginner" },
  { categoryName: "IT & Professional", name: "Digital Marketing & SEO Course", price: 15000, duration: 60, level: "beginner" },
  { categoryName: "Language & Bridge", name: "IELTS Intensive Prep (8.0 Target)", price: 12000, duration: 60, level: "beginner" },
  { categoryName: "Language & Bridge", name: "PTE Academic - Quick Result", price: 10000, duration: 45, level: "beginner" },
  { categoryName: "Language & Bridge", name: "Japanese Language (N5 to N4)", price: 15000, duration: 180, level: "beginner" },
];

async function main() {
  console.log("📚 Seeding Academic Courses...");

  // Get all categories to map back
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, instituteId: true }
  });

  console.log(`   🔍 Found ${categories.length} categories to populate.`);

  // To speed up, we'll process in chunks
  const batchSize = 1000;
  let currentBatch: any[] = [];

  for (const cat of categories) {
    const matchingCourses = COURSES_DATA.filter(c => c.categoryName === cat.name);

    for (const courseInfo of matchingCourses) {
      currentBatch.push({
        instituteId: cat.instituteId,
        categoryId: cat.id,
        name: courseInfo.name,
        description: `Comprehensive study of ${courseInfo.name} following the standard Nepalese curriculum and industry standards.`,
        price: courseInfo.price,
        duration: courseInfo.duration,
        level: courseInfo.level as CourseLevel,
        isPublished: true,
      });

      if (currentBatch.length >= batchSize) {
        await prisma.course.createMany({ data: currentBatch, skipDuplicates: true });
        currentBatch = [];
      }
    }
  }

  if (currentBatch.length > 0) {
    await prisma.course.createMany({ data: currentBatch, skipDuplicates: true });
  }

  const totalCourses = await prisma.course.count();
  console.log(`✅ Successfully seeded ${totalCourses} active courses!`);
}

main()
  .catch((e) => {
    console.error("Courses seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
