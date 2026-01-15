
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BLOGS = [
  {
    title: "The Future of Digital Education in Nepal",
    slug: "future-digital-education-nepal",
    content: "Content about digital education in Nepal...",
    excerpt: "How Nepal is transitioning from traditional to digital classrooms and what it means for the next generation.",
    thumbnail: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800",
  },
  {
    title: "5 Tips for Successful Online Learning",
    slug: "tips-successful-online-learning",
    content: "Content about online learning tips...",
    excerpt: "Help your students get the most out of virtual classrooms with these proven strategies.",
    thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800",
  },
  {
    title: "Integrating AI in Modern Classrooms",
    slug: "integrating-ai-classrooms",
    content: "Content about AI integration...",
    excerpt: "Discover how Artificial Intelligence is being used to personalize learning and assist teachers.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800",
  },
  {
    title: "The Role of Parents in Digital Education",
    slug: "role-parents-digital-education",
    content: "Content about parent involvement...",
    excerpt: "Parental support is crucial in the digital age. Learn how to bridge the gap between home and school.",
    thumbnail: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=800",
  },
  {
    title: "EduFlow: Transforming School Management",
    slug: "eduflow-transforming-management",
    content: "Content about EduFlow impact...",
    excerpt: "How our platform is helping 500+ schools streamline their administration and focus on teaching.",
    thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800",
  },
  {
    title: "Cybersecurity for Schools: A Quick Guide",
    slug: "cybersecurity-for-schools",
    content: "Content about cybersecurity...",
    excerpt: "Protecting student data is a priority. Here are the essential security measures every school needs.",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800",
  },
  {
    title: "The Importance of Data Privacy in EdTech",
    slug: "importance-data-privacy-edtech",
    content: "Content about data privacy...",
    excerpt: "Why privacy matters more than ever and how EduFlow ensures your institution's data is safe.",
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800",
  },
  {
    title: "Remote Teaching Strategies that Work",
    slug: "remote-teaching-strategies",
    content: "Content about remote teaching...",
    excerpt: "Engage your students remotely with these interactive tools and pedagogical approaches.",
    thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800",
  },
  {
    title: "The Growth of Hybrid Learning Models",
    slug: "growth-hybrid-learning",
    content: "Content about hybrid learning...",
    excerpt: "Combining the best of in-person and online education for higher flexibility and better results.",
    thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800",
  },
  {
    title: "Enhancing Student Engagement with Technology",
    slug: "enhancing-student-engagement",
    content: "Content about student engagement...",
    excerpt: "Practical ways to use tablets, interactive whiteboards, and software to boost student participation.",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800",
  },
  {
    title: "Professional Development for 21st Century Teachers",
    slug: "professional-development-teachers",
    content: "Content about teacher training...",
    excerpt: "Continuous learning is key for educators. Explore new skills required for the modern classroom.",
    thumbnail: "https://images.unsplash.com/photo-1544531585-9847b68c8c86?q=80&w=800",
  },
  {
    title: "STEM Education: Building the Future",
    slug: "stem-education-future",
    content: "Content about STEM...",
    excerpt: "Why Science, Technology, Engineering, and Math are critical for the economic growth of Nepal.",
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800",
  },
  {
    title: "Creating Accessible Learning Content",
    slug: "creating-accessible-content",
    content: "Content about accessibility...",
    excerpt: "Ensuring every student, including those with disabilities, has equal access to educational resources.",
    thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",
  },
  {
    title: "The Power of Educational Analytics",
    slug: "power-educational-analytics",
    content: "Content about analytics...",
    excerpt: "Turn data into insights to identify at-risk students and improve overall academic performance.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bbbda5366392?q=80&w=800",
  },
  {
    title: "Personalized Learning in the Digital Age",
    slug: "personalized-learning-digital-age",
    content: "Content about personalization...",
    excerpt: "How technology allows for custom learning paths tailored to each individual's pace and style.",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800",
  },
  {
    title: "Mobile Learning: Education on the Go",
    slug: "mobile-learning-on-the-go",
    content: "Content about mobile learning...",
    excerpt: "The rise of smartphone-based learning and how schools can leverage it effectively.",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800",
  },
  {
    title: "Gamification in the Classroom",
    slug: "gamification-in-classroom",
    content: "Content about gamification...",
    excerpt: "Using game-design elements to motivate and enhance students' learning experiences.",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800",
  },
  {
    title: "Collaborative Learning Tools for Students",
    slug: "collaborative-learning-tools",
    content: "Content about collaboration tools...",
    excerpt: "Tools that foster teamwork and collective problem-solving among students across different locations.",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
  },
  {
    title: "Preparing Students for a Tech-Driven World",
    slug: "preparing-students-tech-world",
    content: "Content about future prep...",
    excerpt: "The skills beyond academics that students need to thrive in the 21st-century job market.",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800",
  },
  {
    title: "Overcoming the Digital Divide in Education",
    slug: "overcoming-digital-divide",
    content: "Content about digital divide...",
    excerpt: "Strategies for providing technology to underserved communities to ensure educational equity.",
    thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=800",
  },
  {
    title: "Best Practices for School Communication",
    slug: "best-practices-school-communication",
    content: "Content about communication...",
    excerpt: "How to maintain clear, efficient, and professional communication with parents and staff.",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800",
  },
];

async function main() {
  console.log("📝 Seeding Blogs...");

  const superAdmin = await prisma.user.findUnique({
    where: { email: "super-admin@eduflow.com.np" }
  });

  if (!superAdmin) {
    console.error("❌ Super Admin not found. Run seed-admin.ts first.");
    return;
  }

  await prisma.blog.deleteMany();

  for (const blog of BLOGS) {
    await prisma.blog.create({
      data: {
        ...blog,
        authorId: superAdmin.id,
        isPublished: true,
        publishedAt: new Date(),
      }
    });
  }

  console.log(`✅ ${BLOGS.length} blogs created.`);
}

main()
  .catch((e) => {
    console.error("Blog seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
