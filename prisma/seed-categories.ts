
import { PrismaClient, InstituteType } from "@prisma/client";

const prisma = new PrismaClient();

const CORE_CATEGORIES: Record<InstituteType, { name: string; description: string }[]> = {
  UNIVERSITY: [
    { name: "Science & Technology", description: "BSc. CSIT, BCA, and BIT programs following TU and KU curricula." },
    { name: "Management", description: "BBA, BBS, and MBA programs focusing on Nepal's business landscape." },
    { name: "Engineering", description: "Civil, Computer, and Electrical Engineering licensed by Nepal Engineering Council." },
    { name: "Health Sciences", description: "MBBS, BSc. Nursing, and Public Health programs (IOM/KU)." },
    { name: "Humanities & Social Sciences", description: "Sociology, Rural Development, and Journalism degrees." },
    { name: "Law", description: "BA.LLB and LLM programs specializing in Nepalese Jurisprudence." },
  ],
  HIGH_SCHOOL: [
    { name: "Science (+2)", description: "NEB Class 11-12 Physics, Chemistry, Biology, and Math streams." },
    { name: "Management (+2)", description: "Accountancy, Economics, and Social Studies for the modern manager." },
    { name: "Law (+2)", description: "Introduction to Law and Constitutional Studies for high schoolers." },
    { name: "Education & Humanities", description: "Mass Com, Sociology, and Teaching foundational courses." },
  ],
  SCHOOL: [
    { name: "Primary (CDC)", description: "Grades 1 to 5 following the Curriculum Development Centre (CDC) standards." },
    { name: "Secondary (SEE)", description: "Grades 6 to 10 focusing on core subjects and SEE preparation." },
    { name: "Pre-School", description: "Nursery, LKG, and UKG Montessori-inspired foundational years." },
  ],
  TRAINING_CENTER: [
    { name: "Loksewa Preparation", description: "Aayog preparation for Kharidar, Na.Su, and Section Officer exams." },
    { name: "IT & Professional", description: "MERN Stack, Python, and Digital Marketing career-focused training." },
    { name: "Language & Bridge", description: "IELTS, PTE, and Japanese language courses for abroad study." },
  ],
};

async function main() {
  console.log("📂 Seeding Academic Categories...");

  const institutes = await prisma.institute.findMany({
    select: { id: true, type: true, instituteName: true }
  });

  console.log(`   🔍 Found ${institutes.length} institutes to categorize.`);

  let totalCreated = 0;

  for (const inst of institutes) {
    const categories = CORE_CATEGORIES[inst.type as InstituteType] || [];

    // Create categories for each institute
    await prisma.category.createMany({
      data: categories.map(cat => ({
        ...cat,
        instituteId: inst.id,
      })),
      skipDuplicates: true,
    });

    totalCreated += categories.length;
  }

  console.log(`✅ Seeded ${totalCreated} categories across all institutes.`);
}

main()
  .catch((e) => {
    console.error("Categories seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
