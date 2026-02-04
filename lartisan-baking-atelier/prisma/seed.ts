import { PrismaClient, Role, CourseLevel, OrderStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // ============================================
  // 1. Create Categories
  // ============================================
  console.log("Creating categories...");

  const breadCategory = await prisma.category.upsert({
    where: { slug: "bread" },
    update: {},
    create: {
      name: "Bread",
      slug: "bread",
      description:
        "Master the art of artisan bread making, from sourdough to heritage grains.",
      image: "/images/categories/bread.jpg",
    },
  });

  const pastryCategory = await prisma.category.upsert({
    where: { slug: "pastry" },
    update: {},
    create: {
      name: "Pastry",
      slug: "pastry",
      description:
        "Delicate pastries, viennoiserie, and French patisserie techniques.",
      image: "/images/categories/pastry.jpg",
    },
  });

  // ============================================
  // 2. Create Admin User
  // ============================================
  console.log("Creating admin user...");

  const adminPassword = await hashPassword("AdminPass123!");
  const admin = await prisma.user.upsert({
    where: { email: "admin@lartisan.sg" },
    update: {},
    create: {
      email: "admin@lartisan.sg",
      name: "Admin User",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      pdpaConsent: true,
      pdpaConsentDate: new Date(),
    },
  });

  // ============================================
  // 3. Create Courses
  // ============================================
  console.log("Creating courses...");

  const sourdoughCourse = await prisma.course.upsert({
    where: { slug: "sourdough-mastery" },
    update: {},
    create: {
      title: "Sourdough Mastery",
      slug: "sourdough-mastery",
      description:
        "From starter cultivation to perfect oven spring. Master hydration, fermentation, and scoring techniques in this comprehensive 6-week program. You will learn to create artisan-quality sourdough bread with confidence and consistency.",
      shortDescription: "Master the art of sourdough from starter to oven.",
      price: 299.0,
      compareAtPrice: 399.0,
      gstIncluded: true,
      categoryId: breadCategory.id,
      images: [
        "/images/courses/sourdough-1.jpg",
        "/images/courses/sourdough-2.jpg",
      ],
      curriculum: {
        modules: [
          { title: "Understanding Sourdough", lessons: 4 },
          { title: "Creating Your Starter", lessons: 3 },
          { title: "Mixing & Autolyse", lessons: 5 },
          { title: "Fermentation Mastery", lessons: 6 },
          { title: "Shaping Techniques", lessons: 4 },
          { title: "Baking & Scoring", lessons: 5 },
        ],
      },
      videoCount: 27,
      duration: 360, // 6 hours
      level: CourseLevel.INTERMEDIATE,
      featured: true,
      published: true,
    },
  });

  const viennoiserieCourse = await prisma.course.upsert({
    where: { slug: "viennoiserie-artistry" },
    update: {},
    create: {
      title: "Viennoiserie Artistry",
      slug: "viennoiserie-artistry",
      description:
        "Perfect laminated doughs, croissants, and brioche. Learn the precise techniques of French pastry including lamination, butter temperature control, and professional shaping. Create stunning viennoiserie that rivals the finest Parisian bakeries.",
      shortDescription: "Master laminated doughs and French viennoiserie.",
      price: 349.0,
      compareAtPrice: 449.0,
      gstIncluded: true,
      categoryId: pastryCategory.id,
      images: [
        "/images/courses/viennoiserie-1.jpg",
        "/images/courses/viennoiserie-2.jpg",
      ],
      curriculum: {
        modules: [
          { title: "Introduction to Lamination", lessons: 3 },
          { title: "Butter & Temperature Control", lessons: 4 },
          { title: "Classic Croissants", lessons: 6 },
          { title: "Pain au Chocolat", lessons: 4 },
          { title: "Brioche Techniques", lessons: 5 },
          { title: "Danish Pastries", lessons: 5 },
        ],
      },
      videoCount: 27,
      duration: 420, // 7 hours
      level: CourseLevel.ADVANCED,
      featured: true,
      published: true,
    },
  });

  const patisserieCourse = await prisma.course.upsert({
    where: { slug: "patisserie-fundamentals" },
    update: {},
    create: {
      title: "Pâtisserie Fundamentals",
      slug: "patisserie-fundamentals",
      description:
        "Essential techniques for perfect pastries, from choux to crémeux. Build a solid foundation in French pastry with 8 foundational modules covering classic techniques, recipes, and presentation skills.",
      shortDescription: "Build your foundation in French pastry arts.",
      price: 249.0,
      gstIncluded: true,
      categoryId: pastryCategory.id,
      images: ["/images/courses/patisserie-1.jpg"],
      curriculum: {
        modules: [
          { title: "Pâte à Choux", lessons: 5 },
          { title: "Crème Pâtissière", lessons: 4 },
          { title: "Tart Shells", lessons: 5 },
          { title: "Ganache & Glazes", lessons: 4 },
          { title: "Meringues", lessons: 3 },
          { title: "Assembly & Decoration", lessons: 6 },
        ],
      },
      videoCount: 27,
      duration: 320, // 5.3 hours
      level: CourseLevel.BEGINNER,
      featured: false,
      published: true,
    },
  });

  const artisanBreadCourse = await prisma.course.upsert({
    where: { slug: "artisan-breads" },
    update: {},
    create: {
      title: "Artisan Breads",
      slug: "artisan-breads",
      description:
        "Beyond basics: ciabatta, focaccia, rye, and heritage grains. Explore fermentation science, grain selection, and advanced shaping techniques. Perfect for those ready to expand beyond sourdough into the wider world of artisan bread.",
      shortDescription:
        "Explore heritage grains and advanced bread techniques.",
      price: 279.0,
      gstIncluded: true,
      categoryId: breadCategory.id,
      images: ["/images/courses/artisan-bread-1.jpg"],
      curriculum: {
        modules: [
          { title: "Grain Selection & Milling", lessons: 4 },
          { title: "Ciabatta Mastery", lessons: 5 },
          { title: "Focaccia Variations", lessons: 4 },
          { title: "Rye & Whole Grains", lessons: 6 },
          { title: "Advanced Fermentation", lessons: 5 },
          { title: "Heritage Wheat Breads", lessons: 4 },
        ],
      },
      videoCount: 28,
      duration: 380, // 6.3 hours
      level: CourseLevel.INTERMEDIATE,
      featured: false,
      published: true,
    },
  });

  // ============================================
  // 4. Create Videos for Courses
  // ============================================
  console.log("Creating course videos...");

  // Sourdough videos
  const sourdoughVideos = [
    { title: "Welcome to Sourdough Mastery", durationSeconds: 300 },
    { title: "Understanding Wild Yeast", durationSeconds: 900 },
    { title: "Equipment & Ingredients", durationSeconds: 600 },
    { title: "Creating Your Starter - Day 1", durationSeconds: 1200 },
    { title: "Feeding Your Starter", durationSeconds: 480 },
    { title: "Reading Your Starter", durationSeconds: 540 },
  ];

  for (let i = 0; i < sourdoughVideos.length; i++) {
    await prisma.video.upsert({
      where: { id: `sourdough-video-${i}` },
      update: {},
      create: {
        id: `sourdough-video-${i}`,
        courseId: sourdoughCourse.id,
        title: sourdoughVideos[i].title,
        durationSeconds: sourdoughVideos[i].durationSeconds,
        videoUrl: `/videos/sourdough/${i}.mp4`,
        thumbnailUrl: `/thumbnails/sourdough/${i}.jpg`,
        orderIndex: i,
        published: true,
      },
    });
  }

  // ============================================
  // 5. Create Sample Order
  // ============================================
  console.log("Creating sample order...");

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: "ORD-SAMPLE-001",
      userId: admin.id,
      status: OrderStatus.COMPLETED,
      subtotal: 299.0,
      gstAmount: 26.91, // 9% of 299
      total: 325.91,
      currency: "SGD",
      customerEmail: admin.email,
      customerName: admin.name,
      items: {
        create: [
          {
            courseId: sourdoughCourse.id,
            quantity: 1,
            unitPrice: 299.0,
            total: 299.0,
          },
        ],
      },
    },
  });

  // ============================================
  // 6. Create Sample Reviews
  // ============================================
  console.log("Creating sample reviews...");

  await prisma.review.create({
    data: {
      userId: admin.id,
      courseId: sourdoughCourse.id,
      rating: 5,
      content:
        "Absolutely transformative course! I went from failed loaves to beautiful sourdough in just 3 weeks. The instructor explains everything so clearly.",
      approved: true,
    },
  });

  // ============================================
  // 7. Create Achievements
  // ============================================
  console.log("Creating achievements...");

  const achievements = [
    {
      name: "First Steps",
      slug: "first-steps",
      description: "Complete your first course",
      icon: "🎓",
      criteriaType: "courses_completed",
      criteriaValue: 1,
    },
    {
      name: "Bread Enthusiast",
      slug: "bread-enthusiast",
      description: "Complete 3 bread courses",
      icon: "🍞",
      criteriaType: "courses_completed",
      criteriaValue: 3,
    },
    {
      name: "Dedicated Baker",
      slug: "dedicated-baker",
      description: "Maintain a 7-day learning streak",
      icon: "🔥",
      criteriaType: "streak",
      criteriaValue: 7,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {},
      create: achievement,
    });
  }

  console.log("Seeding completed successfully!");
  console.log("");
  console.log("Admin User:");
  console.log("  Email: admin@lartisan.sg");
  console.log("  Password: AdminPass123!");
  console.log("");
  console.log("Courses Created:");
  console.log(`  - ${sourdoughCourse.title}`);
  console.log(`  - ${viennoiserieCourse.title}`);
  console.log(`  - ${patisserieCourse.title}`);
  console.log(`  - ${artisanBreadCourse.title}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
