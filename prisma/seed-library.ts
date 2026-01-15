
import { PrismaClient, InstituteType } from "@prisma/client";

const prisma = new PrismaClient();

const LIBRARY_CONFIG = [
  {
    type: "UNIVERSITY",
    categories: [
      { name: "Academic E-books", resources: [
        { title: "Introduction to Algorithms", format: "pdf", size: "12MB", url: "https://example.com/algo.pdf" },
        { title: "Microeconomics for Business", format: "ebook", size: "4MB", url: "https://example.com/econ.epub" }
      ]},
      { name: "Research Journals", resources: [
        { title: "Nepalese Journal of Management", format: "journal", size: "1.5MB", url: "https://example.com/njm.pdf" },
        { title: "Science & Tech Review (TU)", format: "journal", size: "2.2MB", url: "https://example.com/tu-review.pdf" }
      ]},
      { name: "Past Papers (TU/KU)", resources: [
        { title: "B.Sc. CSIT 2079 Question Bank", format: "pdf", size: "5MB", url: "https://example.com/csit-papers.pdf" },
        { title: "BBA Semester II Exams 2078", format: "pdf", size: "3MB", url: "https://example.com/bba-papers.pdf" }
      ]}
    ]
  },
  {
    type: "SCHOOL",
    categories: [
      { name: "Board Exam Guides", resources: [
        { title: "SEE Science Solution 2080", format: "pdf", size: "8MB", url: "https://example.com/see-science.pdf" },
        { title: "Grade 10 Optional Math Guide", format: "pdf", size: "10MB", url: "https://example.com/opt-math.pdf" }
      ]},
      { name: "Interactive Lessons", resources: [
        { title: "Social Studies Map Practice", format: "other", size: "2MB", url: "https://example.com/maps.zip" }
      ]}
    ]
  }
];

async function main() {
  console.log("📚 Seeding Digital Library...");

  const institutes = await prisma.institute.findMany({
    select: { id: true, type: true, ownerId: true }
  });

  for (const inst of institutes) {
    const config = LIBRARY_CONFIG.find(c => c.type === inst.type);
    if (!config) continue;

    for (const catData of config.categories) {
      const category = await prisma.libraryCategory.create({
        data: {
          name: catData.name,
          instituteId: inst.id,
          description: `Digital resources and assets for ${catData.name}.`,
        }
      });

      await prisma.libraryResource.createMany({
        data: catData.resources.map(res => ({
          title: res.title,
          type: res.format.toLowerCase() as any,
          fileUrl: res.url,
          categoryId: category.id,
          instituteId: inst.id,
          description: `Supporting material: ${res.title}`,
          isPublic: true,
          uploadedBy: inst.ownerId, // Set to owner as default
        }))
      });
    }
  }

  console.log(`✅ Library categories and resources seeded.`);
}

main()
  .catch((e) => {
    console.error("Library seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
