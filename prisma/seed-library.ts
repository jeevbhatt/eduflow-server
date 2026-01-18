
import { PrismaClient, InstituteType } from "@prisma/client";

const prisma = new PrismaClient();

const LIBRARY_CONFIG = [
  {
    type: "UNIVERSITY",
    categories: [
      { name: "Science & Engineering", resources: [
        { title: "Introduction to Algorithms (CLRS)", format: "pdf", size: "15MB", url: "https://example.com/algo1.pdf" },
        { title: "University Physics - Sears and Zemansky", format: "pdf", size: "25MB", url: "https://example.com/phys1.pdf" },
        { title: "Digital Logic Design - Morris Mano", format: "pdf", size: "10MB", url: "https://example.com/logic1.pdf" },
        { title: "Linear Algebra - David C. Lay", format: "pdf", size: "12MB", url: "https://example.com/math1.pdf" },
        { title: "Structural Analysis - R.C. Hibbeler", format: "pdf", size: "18MB", url: "https://example.com/civil1.pdf" }
      ]},
      { name: "Management & Economics", resources: [
        { title: "Principles of Management - Koontz", format: "pdf", size: "8MB", url: "https://example.com/mgmt1.pdf" },
        { title: "Financial Accounting - TU Syllabus", format: "pdf", size: "12MB", url: "https://example.com/acc1.pdf" },
        { title: "Macroeconomics - S. Bajracharya", format: "pdf", size: "14MB", url: "https://example.com/econ1.pdf" },
        { title: "Marketing Management - Philip Kotler", format: "pdf", size: "20MB", url: "https://example.com/mkt1.pdf" }
      ]},
      { name: "Past Papers & Guides", resources: [
        { title: "CSIT Entrance Preparation Guide 2081", format: "pdf", size: "15MB", url: "https://example.com/csit-prep.pdf" },
        { title: "IOM Entrance Question Bank (MBBS)", format: "pdf", size: "30MB", url: "https://example.com/iom-prep.pdf" },
        { title: "KU Engineering Past Collections", format: "pdf", size: "10MB", url: "https://example.com/eng-papers.pdf" }
      ]},
      { name: "Nepali Literature", resources: [
        { title: "Muna Madan - Laxmi Prasad Devkota", format: "pdf", size: "1MB", url: "https://example.com/lit1.pdf" },
        { title: "Palpasa Café - Narayan Wagle", format: "pdf", size: "2MB", url: "https://example.com/lit2.pdf" },
        { title: "Sirish Ko Phool - Parijat", format: "pdf", size: "1.5MB", url: "https://example.com/lit3.pdf" },
        { title: "Seto Dharti - Amar Neupane", format: "pdf", size: "2MB", url: "https://example.com/lit4.pdf" },
        { title: "Karnali Blues - Buddhi Sagar", format: "pdf", size: "2.5MB", url: "https://example.com/lit5.pdf" }
      ]}
    ]
  },
  {
    type: "SCHOOL",
    categories: [
      { name: "CDC School Textbooks", resources: [
        { title: "Hamro Nepali Kitab - Grade 1 to 10", format: "pdf", size: "20MB", url: "https://example.com/school1.pdf" },
        { title: "Compulsory Mathematics Grade 10", format: "pdf", size: "15MB", url: "https://example.com/school2.pdf" },
        { title: "Science and Technology - Grade 9", format: "pdf", size: "12MB", url: "https://example.com/school3.pdf" },
        { title: "Social Studies & Geography Nepal", format: "pdf", size: "18MB", url: "https://example.com/school4.pdf" }
      ]},
      { name: "SEE Preparation Guides", resources: [
        { title: "SEE Ten Plus One - 2081 Edition", format: "pdf", size: "25MB", url: "https://example.com/see1.pdf" },
        { title: "Science Model Questions & Solutions", format: "pdf", size: "10MB", url: "https://example.com/see2.pdf" },
        { title: "Optional Math Practice Book", format: "pdf", size: "12MB", url: "https://example.com/see3.pdf" }
      ]},
      { name: "General Knowledge & IQ", resources: [
        { title: "Nepal GK (Loksewa & School)", format: "pdf", size: "8MB", url: "https://example.com/gk1.pdf" },
        { title: "Aayog IQ Practice Set", format: "pdf", size: "5MB", url: "https://example.com/iq1.pdf" }
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
