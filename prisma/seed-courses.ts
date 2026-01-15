
import { PrismaClient, CourseLevel, Course } from "@prisma/client";

const prisma = new PrismaClient();

const COURSES_DATA = [
  // --- UNIVERSITY ---
  { categoryName: "Science & Technology", name: "B.Sc. Computer Science & IT (CSIT)", price: 450000, duration: 4000, level: "beginner" },
  { categoryName: "Science & Technology", name: "Bachelor in Computer Application (BCA)", price: 380000, duration: 3800, level: "beginner" },
  { categoryName: "Management", name: "Bachelor of Business Administration (BBA)", price: 550000, duration: 3500, level: "beginner" },
  { categoryName: "Management", name: "Bachelor of Business Studies (BBS)", price: 150000, duration: 3000, level: "beginner" },
  { categoryName: "Engineering", name: "B.E. Civil Engineering", price: 850000, duration: 5000, level: "intermediate" },
  { categoryName: "Law", name: "B.A. LL.B (5-Year Integrated)", price: 400000, duration: 6000, level: "beginner" },
  { categoryName: "Medicine & Health Sciences", name: "Bachelor of Medicine, Bachelor of Surgery (MBBS)", price: 4500000, duration: 7000, level: "advanced" },

  // --- HIGH SCHOOL ---
  { categoryName: "Science (+2)", name: "Class 11 Physics", price: 25000, duration: 180, level: "beginner" },
  { categoryName: "Science (+2)", name: "Class 12 Chemistry", price: 25000, duration: 180, level: "intermediate" },
  { categoryName: "Management (+2)", name: "Principles of Accounting I", price: 20000, duration: 150, level: "beginner" },
  { categoryName: "Management (+2)", name: "Business Studies", price: 18000, duration: 140, level: "beginner" },

  // --- SCHOOL ---
  { categoryName: "Secondary Education", name: "Class 10 - Science (Nepal Board)", price: 15000, duration: 200, level: "beginner" },
  { categoryName: "Secondary Education", name: "Class 10 - Mathematics", price: 15000, duration: 200, level: "beginner" },
  { categoryName: "Lower Secondary", name: "Grade 8 Social Studies", price: 10000, duration: 150, level: "beginner" },

  // --- TRAINING CENTER ---
  { categoryName: "Information Technology", name: "Fullstack Web Development (MERN)", price: 35000, duration: 120, level: "intermediate" },
  { categoryName: "Information Technology", name: "Mastering Python & Django", price: 28000, duration: 90, level: "intermediate" },
  { categoryName: "Vocational Skills", name: "Industrial Electrical Technician", price: 22000, duration: 150, level: "beginner" },
  { categoryName: "Language & Test Prep", name: "IELTS Preparation Course", price: 12000, duration: 60, level: "beginner" },
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
