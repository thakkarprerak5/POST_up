// Tag-to-Category Mapping System
// Single source of truth for categorizing projects based on tags

export interface CategoryMapping {
  name: string;
  slug: string;
  icon: string;
  color: string;
  tags: string[];
}

export const categoryTagMapping: CategoryMapping[] = [
  {
    name: "Web Developer",
    slug: "web-development",
    icon: "web",
    color: "blue",
    tags: [
      "web",
      "frontend", 
      "backend",
      "react",
      "next",
      "nextjs",
      "vue",
      "angular",
      "javascript",
      "typescript",
      "html",
      "css",
      "tailwind",
      "node",
      "nodejs",
      "express",
      "mongodb",
      "postgresql",
      "mysql",
      "api",
      "fullstack",
      "spa",
      "ssr",
      "web-development"
    ]
  },
  {
    name: "AI / ML",
    slug: "ai-ml", 
    icon: "ai",
    color: "purple",
    tags: [
      "ai",
      "ml",
      "machine-learning",
      "artificial-intelligence",
      "deep-learning",
      "neural-network",
      "tensorflow",
      "pytorch",
      "opencv",
      "nlp",
      "computer-vision",
      "chatbot",
      "gpt",
      "llm",
      "data-science",
      "python",
      "jupyter",
      "pandas",
      "numpy"
    ]
  },
  {
    name: "Data Analysis",
    slug: "data-analysis",
    icon: "data", 
    color: "green",
    tags: [
      "data",
      "analytics",
      "python",
      "r",
      "sql",
      "excel",
      "tableau",
      "power-bi",
      "visualization",
      "dashboard",
      "statistics",
      "pandas",
      "numpy",
      "matplotlib",
      "seaborn",
      "plotly",
      "big-data",
      "hadoop",
      "spark"
    ]
  },
  {
    name: "Mobile App",
    slug: "mobile-app",
    icon: "mobile",
    color: "orange", 
    tags: [
      "mobile",
      "android",
      "ios",
      "flutter",
      "react-native",
      "swift",
      "kotlin",
      "java",
      "dart",
      "xamarin",
      "cordova",
      "phonegap",
      "ionic",
      "app",
      "smartphone",
      "tablet",
      "mobile-development",
      "cross-platform"
    ]
  },
  {
    name: "Cyber Security",
    slug: "cyber-security",
    icon: "cyber",
    color: "red",
    tags: [
      "security",
      "cyber",
      "cybersecurity",
      "pentesting",
      "penetration-testing",
      "ethical-hacking",
      "network-security",
      "web-security",
      "cryptography",
      "encryption",
      "firewall",
      "malware",
      "vulnerability",
      "owasp",
      "authentication",
      "authorization",
      "blockchain-security",
      "forensics"
    ]
  },
  {
    name: "Blockchain",
    slug: "blockchain",
    icon: "blockchain",
    color: "indigo",
    tags: [
      "blockchain",
      "web3",
      "crypto",
      "cryptocurrency",
      "bitcoin",
      "ethereum",
      "solidity",
      "smart-contracts",
      "defi",
      "nft",
      "dao",
      "dapp",
      "metamask",
      "truffle",
      "hardhat",
      "ipfs",
      "consensus",
      "mining",
      "wallet"
    ]
  }
];

// Helper function to categorize a project based on its tags or content
export function categorizeProject(projectTags: string[], title?: string, description?: string): string[] {
  const matchedCategories: string[] = [];
  
  // First try to match by tags
  if (projectTags && projectTags.length > 0) {
    for (const category of categoryTagMapping) {
      const hasMatchingTag = projectTags.some(tag => 
        category.tags.some(categoryTag => 
          tag.toLowerCase().includes(categoryTag.toLowerCase()) ||
          categoryTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      if (hasMatchingTag) {
        matchedCategories.push(category.slug);
      }
    }
  }
  
  // If no tags matched, try to infer from title and description
  if (matchedCategories.length === 0 && (title || description)) {
    const content = `${title || ''} ${description || ''}`.toLowerCase();
    
    // Enhanced keyword matching for fallback
    const fallbackMapping: Record<string, string> = {
      'web development': 'web-development',
      'react': 'web-development',
      'next': 'web-development',
      'vue': 'web-development',
      'angular': 'web-development',
      'javascript': 'web-development',
      'typescript': 'web-development',
      'html': 'web-development',
      'css': 'web-development',
      'node': 'web-development',
      'nodejs': 'web-development',
      'express': 'web-development',
      'mongodb': 'web-development',
      'postgresql': 'web-development',
      'mysql': 'web-development',
      'api': 'web-development',
      
      'ai': 'ai-ml',
      'ml': 'ai-ml',
      'machine learning': 'ai-ml',
      'machine-learning': 'ai-ml',
      'artificial intelligence': 'ai-ml',
      'artificial-intelligence': 'ai-ml',
      'deep learning': 'ai-ml',
      'deep-learning': 'ai-ml',
      'neural': 'ai-ml',
      'tensorflow': 'ai-ml',
      'pytorch': 'ai-ml',
      'opencv': 'ai-ml',
      'nlp': 'ai-ml',
      'chatbot': 'ai-ml',
      'gpt': 'ai-ml',
      'llm': 'ai-ml',
      'data science': 'ai-ml',
      'python': 'ai-ml',
      'prediction': 'ai-ml',
      'stock': 'ai-ml',
      
      'data': 'data-analysis',
      'analytics': 'data-analysis',
      'analysis': 'data-analysis',
      'visualization': 'data-analysis',
      'dashboard': 'data-analysis',
      'statistics': 'data-analysis',
      'pandas': 'data-analysis',
      'numpy': 'data-analysis',
      'matplotlib': 'data-analysis',
      'seaborn': 'data-analysis',
      'plotly': 'data-analysis',
      'excel': 'data-analysis',
      'tableau': 'data-analysis',
      'power bi': 'data-analysis',
      'power-bi': 'data-analysis',
      
      'mobile': 'mobile-app',
      'android': 'mobile-app',
      'ios': 'mobile-app',
      'flutter': 'mobile-app',
      'react native': 'mobile-app',
      'react-native': 'mobile-app',
      'swift': 'mobile-app',
      'kotlin': 'mobile-app',
      'java': 'mobile-app',
      'dart': 'mobile-app',
      'app': 'mobile-app',
      'smartphone': 'mobile-app',
      'tablet': 'mobile-app',
      
      'security': 'cyber-security',
      'cyber': 'cyber-security',
      'cybersecurity': 'cyber-security',
      'pentesting': 'cyber-security',
      'penetration testing': 'cyber-security',
      'penetration-testing': 'cyber-security',
      'ethical hacking': 'cyber-security',
      'ethical-hacking': 'cyber-security',
      'network security': 'cyber-security',
      'network-security': 'cyber-security',
      'web security': 'cyber-security',
      'web-security': 'cyber-security',
      'cryptography': 'cyber-security',
      'encryption': 'cyber-security',
      'firewall': 'cyber-security',
      'malware': 'cyber-security',
      'vulnerability': 'cyber-security',
      'owasp': 'cyber-security',
      'authentication': 'cyber-security',
      'authorization': 'cyber-security',
      
      'blockchain': 'blockchain',
      'web3': 'blockchain',
      'crypto': 'blockchain',
      'cryptocurrency': 'blockchain',
      'bitcoin': 'blockchain',
      'ethereum': 'blockchain',
      'solidity': 'blockchain',
      'smart contracts': 'blockchain',
      'smart-contracts': 'blockchain',
      'defi': 'blockchain',
      'nft': 'blockchain',
      'dao': 'blockchain',
      'dapp': 'blockchain',
      'metamask': 'blockchain',
      'truffle': 'blockchain',
      'hardhat': 'blockchain',
      'ipfs': 'blockchain',
      'consensus': 'blockchain',
      'mining': 'blockchain',
      'wallet': 'blockchain'
    };
    
    // Find matching keywords
    for (const [keyword, categorySlug] of Object.entries(fallbackMapping)) {
      if (content.includes(keyword)) {
        matchedCategories.push(categorySlug);
        break; // Only assign one category for fallback
      }
    }
  }
  
  // If still no match, assign uncategorized
  if (matchedCategories.length === 0) {
    matchedCategories.push('uncategorized');
  }
  
  return matchedCategories;
}

// Helper function to get category by slug
export function getCategoryBySlug(slug: string): CategoryMapping | undefined {
  return categoryTagMapping.find(category => category.slug === slug);
}

// Helper function to count projects per category
export function countProjectsByCategory(projects: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  // Initialize counts to 0 for all categories
  categoryTagMapping.forEach(category => {
    counts[category.slug] = 0;
  });
  
  // Count projects for each category
  projects.forEach(project => {
    const matchedCategories = categorizeProject(
      project.tags || [], 
      project.title, 
      project.description
    );
    matchedCategories.forEach(categorySlug => {
      if (counts[categorySlug] !== undefined) {
        counts[categorySlug]++;
      }
    });
  });
  
  return counts;
}

// Helper function to filter projects by category
export function filterProjectsByCategory(projects: any[], categorySlug: string): any[] {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return [];
  
  return projects.filter(project => 
    categorizeProject(
      project.tags || [], 
      project.title, 
      project.description
    ).includes(categorySlug)
  );
}

export default categoryTagMapping;
