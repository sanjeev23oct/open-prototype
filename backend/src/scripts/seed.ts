import { prisma } from '../lib/database.js';
import { ProjectStatus, SectionType } from '../types/database.js';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a default user for MVP
  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: 'user-12345', // Hardcoded user ID for MVP
      email: 'user@example.com',
      name: 'Default User',
      preferences: {
        defaultModel: 'deepseek-chat',
        outputType: 'html-js',
        styling: 'tailwind',
      },
    },
  });

  console.log('✅ Created default user:', defaultUser.email);

  // Create a sample project
  const sampleProject = await prisma.project.create({
    data: {
      userId: defaultUser.id,
      name: 'Sample Landing Page',
      description: 'A beautiful landing page with hero section and features',
      prompt: 'Create a modern landing page for a SaaS product with a hero section, features grid, and contact form',
      preferences: {
        outputType: 'html-js',
        styling: 'tailwind',
        responsive: true,
      },
      status: ProjectStatus.COMPLETED,
    },
  });

  console.log('✅ Created sample project:', sampleProject.name);

  // Create sample code sections
  const codeSections = [
    {
      projectId: sampleProject.id,
      sectionName: 'HTML Structure',
      sectionType: SectionType.HTML,
      codeContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaaS Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <!-- Content will be generated here -->
</body>
</html>`,
      documentation: 'Basic HTML structure with TailwindCSS CDN',
      orderIndex: 0,
      elementId: 'html-base',
    },
    {
      projectId: sampleProject.id,
      sectionName: 'Hero Section',
      sectionType: SectionType.COMPONENT,
      codeContent: `<section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
    <div class="container mx-auto px-4 text-center">
        <h1 class="text-5xl font-bold mb-6">Transform Your Business</h1>
        <p class="text-xl mb-8">The ultimate SaaS solution for modern teams</p>
        <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Get Started Free
        </button>
    </div>
</section>`,
      documentation: 'Hero section with gradient background and call-to-action',
      orderIndex: 1,
      elementId: 'hero-section',
    },
  ];

  await prisma.codeSection.createMany({
    data: codeSections,
  });

  console.log('✅ Created sample code sections');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });