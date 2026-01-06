export const categories = [
  {
    name: "Web Developer",
    slug: "web-development",
    icon: "web",
    color: "blue",
  },
  {
    name: "AI/ML",
    slug: "ai-ml",
    icon: "ai",
    color: "purple",
  },
  {
    name: "Data Analysis",
    slug: "data-analysis",
    icon: "data",
    color: "green",
  },
  {
    name: "Mobile App",
    slug: "mobile-app",
    icon: "mobile",
    color: "orange",
  },
  {
    name: "Cyber Security",
    slug: "cyber-security",
    icon: "cyber",
    color: "red",
  },
  {
    name: "Blockchain",
    slug: "blockchain",
    icon: "blockchain",
    color: "indigo",
  },
]

export const projects = [
  {
    id: 1,
    category: "web-development",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "E-Commerce Dashboard",
    description:
      "A full-stack e-commerce dashboard with real-time analytics, inventory management, and order tracking. Built with Next.js and PostgreSQL.",
    tags: ["React", "Next.js", "PostgreSQL", "Web Development"],
    images: ["/ecommerce-dashboard-analytics.png", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/ecommerce-dashboard",
    liveUrl: "https://ecommerce-dashboard.vercel.app",
  },
  {
    id: 2,
    category: "web-development",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Portfolio Website",
    description: "Personal developer portfolio with dark mode, project showcase, and contact form integration.",
    tags: ["React", "Tailwind CSS", "Framer Motion", "Web Development"],
    images: ["/developer-portfolio-website-dark.jpg", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/portfolio",
    liveUrl: "https://johndoe-portfolio.vercel.app",
  },
  {
    id: 3,
    category: "web-development",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Task Management App",
    description:
      "Kanban-style task management application with drag-and-drop functionality, team collaboration, and deadline reminders.",
    tags: ["React", "TypeScript", "DnD Kit", "Web Development"],
    images: ["/task-management-kanban.png", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/task-manager",
    liveUrl: "https://task-manager-app.vercel.app",
  },
  {
    id: 4,
    category: "ai-ml",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "AI Chatbot Assistant",
    description:
      "An intelligent chatbot powered by GPT-4 with context awareness, conversation history, and custom training capabilities.",
    tags: ["Python", "OpenAI", "LangChain", "AI/ML"],
    images: ["/ai-chatbot-interface-dark.jpg", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/ai-chatbot",
    liveUrl: "https://ai-chatbot-demo.vercel.app",
  },
  {
    id: 5,
    category: "mobile-app",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Fitness Tracker App",
    description:
      "Cross-platform mobile app for tracking workouts, calories, and health metrics with weekly progress reports.",
    tags: ["React Native", "Expo", "Firebase", "Mobile App"],
    images: ["/generic-mobile-app.png", "/analytics-chart.png", "/generic-data-dashboard.png"],
    githubUrl: "https://github.com/johndoe/fitness-tracker",
    liveUrl: "https://expo.dev/@johndoe/fitness-tracker",
  },
  {
    id: 6,
    category: "mobile-app",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "Recipe Sharing App",
    description: "Social mobile app for discovering, sharing, and saving recipes with ingredient shopping lists.",
    tags: ["Flutter", "Dart", "Supabase", "Mobile App"],
    images: ["/generic-mobile-app.png", "/generic-data-dashboard.png", "/analytics-chart.png"],
    githubUrl: "https://github.com/johndoe/recipe-app",
    liveUrl: "https://play.google.com/store/apps/details?id=com.johndoe.recipes",
  },
  {
    id: 7,
    category: "blockchain",
    author: {
      name: "John Doe",
      avatar: "/young-male-student-developer.jpg",
      username: "@johndoe",
    },
    title: "NFT Marketplace",
    description: "Decentralized NFT marketplace with wallet integration, minting capabilities, and auction features.",
    tags: ["Solidity", "Ethereum", "Web3.js", "Blockchain"],
    images: ["/generic-data-dashboard.png", "/analytics-chart.png", "/ecommerce-dashboard-analytics.png"],
    githubUrl: "https://github.com/johndoe/nft-marketplace",
    liveUrl: "https://nft-marketplace-demo.vercel.app",
  },
]

export const collectionCategories = categories.map((c, i) => {
  // Count projects that match category directly OR have matching tags
  const matchingProjects = projects.filter((p) => {
    // Include projects that match category directly
    if (p.category === c.slug) return true
    
    // Include projects that have tags matching the category name or slug
    const categoryKeywords = [
      c.name?.toLowerCase() || '',
      c.slug?.toLowerCase() || '',
      // Add common variations for better matching
      c.name?.toLowerCase().replace(/\s+/g, '') || '',
      c.slug?.toLowerCase().replace(/-/g, '') || ''
    ].filter(Boolean)
    
    return p.tags?.some(tag => 
      categoryKeywords.some(keyword => 
        tag.toLowerCase().includes(keyword) || 
        keyword.includes(tag.toLowerCase())
      )
    )
  })
  
  return {
    ...c,
    projectCount: matchingProjects.length,
  }
})

export default {
  categories,
  projects,
  collectionCategories,
}
