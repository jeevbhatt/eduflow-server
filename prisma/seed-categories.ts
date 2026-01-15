
import { PrismaClient, InstituteType } from "@prisma/client";

const prisma = new PrismaClient();

const CORE_CATEGORIES: Record<InstituteType, { name: string; description: string }[]> = {
  UNIVERSITY: [
    { name: "Science & Technology", description: "Bachelor and Master programs in Pure Sciences, IT, and Engineering." },
    { name: "Management", description: "Business Administration, Commerce, and Management studies." },
    { name: "Humanities & Social Sciences", description: "Arts, Sociology, Economics, and Language studies." },
    { name: "Law", description: "LLB and LLM programs specializing in Nepalese and International Law." },
    { name: "Medicine & Health Sciences", description: "MBBS, Nursing, Pharmacy, and Public Health." },
    { name: "Engineering", description: "Civil, Computer, Electrical, and Electronic Engineering fields." },
    { name: "Agriculture", description: "Agricultural Science, Forestry, and Veterinary studies." },
  ],
  HIGH_SCHOOL: [
    { name: "Science (+2)", description: "Physics, Chemistry, Biology, and Mathematics stream." },
    { name: "Management (+2)", description: "Accountancy, Economics, and Business Studies stream." },
    { name: "Humanities (+2)", description: "Mass Communication, Sociology, and English stream." },
    { name: "Law (+2)", description: "Introduction to Legal Studies and Constitutional Law." },
    { name: "A-Levels", description: "Cambridge International Examinations curriculum." },
  ],
  SCHOOL: [
    { name: "Primary Education", description: "Grades 1 to 5 following the CDC curriculum." },
    { name: "Lower Secondary", description: "Grades 6 to 8 focused on core subject fundamentals." },
    { name: "Secondary Education", description: "Grades 9 and 10 preparing for the SEE examination." },
    { name: "Pre-Primary", description: "Nursery, LKG, and UKG foundational learning." },
  ],
  TRAINING_CENTER: [
    { name: "Information Technology", description: "Programming, Networking, and Cybersecurity training." },
    { name: "Vocational Skills", description: "Electrical, Plumbing, and Mechanical skills training (CTEVT based)." },
    { name: "Language & Test Prep", description: "IELTS, TOEFL, and foreign language certification." },
    { name: "Professional Development", description: "Banking, Accounting, and Soft Skills for professionals." },
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
