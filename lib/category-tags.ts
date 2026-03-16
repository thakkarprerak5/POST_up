// Category Tag Mapping System - Single source of truth for category definitions
export interface CategoryDefinition {
  slug: string;
  name: string;
  icon: string;
  color: string;
  tags: string[];
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    slug: 'web-development',
    name: 'Web Developer',
    icon: 'web',
    color: 'blue',
    tags: [
      'react', 'next', 'nextjs', 'html', 'css', 'javascript', 'typescript',
      'node', 'nodejs', 'express', 'mongodb', 'postgresql', 'mysql', 'api',
      'frontend', 'backend', 'fullstack', 'vue', 'angular', 'svelte', 'tailwind',
      'webpack', 'vite', 'npm', 'yarn', 'git', 'rest', 'graphql', 'jwt'
    ]
  },
  {
    slug: 'ai-ml',
    name: 'AI / ML',
    icon: 'ai',
    color: 'purple',
    tags: [
      'python', 'tensorflow', 'pytorch', 'machine-learning', 'ml', 'ai',
      'artificial-intelligence', 'deep-learning', 'neural-network', 'opencv',
      'nlp', 'natural-language-processing', 'chatbot', 'gpt', 'llm',
      'data-science', 'scikit-learn', 'pandas', 'numpy', 'jupyter',
      'keras', 'reinforcement-learning', 'computer-vision', 'prediction',
      'model', 'training', 'inference'
    ]
  },
  {
    slug: 'data-analysis',
    name: 'Data Analysis',
    icon: 'data',
    color: 'green',
    tags: [
      'data-science', 'sql', 'pandas', 'numpy', 'analysis', 'analytics',
      'visualization', 'dashboard', 'statistics', 'excel', 'tableau',
      'power-bi', 'matplotlib', 'seaborn', 'plotly', 'etl', 'data',
      'database', 'query', 'report', 'insights', 'metrics', 'charts'
    ]
  },
  {
    slug: 'mobile-app',
    name: 'Mobile App',
    icon: 'mobile',
    color: 'orange',
    tags: [
      'android', 'ios', 'mobile', 'app', 'flutter', 'react-native',
      'swift', 'kotlin', 'java', 'dart', 'xamarin', 'cordova',
      'smartphone', 'tablet', 'mobile-development', 'ui', 'ux',
      'responsive', 'touch', 'gesture', 'push-notifications', 'app-store'
    ]
  },
  {
    slug: 'cyber-security',
    name: 'Cyber Security',
    icon: 'cyber',
    color: 'red',
    tags: [
      'security', 'cyber', 'cybersecurity', 'penetration-testing', 'pentesting',
      'ethical-hacking', 'network-security', 'web-security', 'cryptography',
      'firewall', 'malware', 'vulnerability', 'owasp', 'authentication',
      'authorization', 'encryption', 'ssl', 'tls', 'hacking', 'audit',
      'compliance', 'risk', 'threat', 'incident-response'
    ]
  },
  {
    slug: 'blockchain',
    name: 'Blockchain',
    icon: 'blockchain',
    color: 'indigo',
    tags: [
      'blockchain', 'web3', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum',
      'solidity', 'smart-contracts', 'defi', 'nft', 'dao', 'dapp',
      'metamask', 'truffle', 'hardhat', 'ipfs', 'consensus', 'mining',
      'wallet', 'token', 'erc20', 'erc721', 'ganache', 'rust', 'go-ethereum'
    ]
  }
];

// Helper functions for category operations
export const getCategoryBySlug = (slug: string): CategoryDefinition | undefined => {
  return CATEGORY_DEFINITIONS.find(cat => cat.slug === slug);
};

export const getAllCategories = (): CategoryDefinition[] => {
  return CATEGORY_DEFINITIONS;
};

export const getCategoryTags = (slug: string): string[] => {
  const category = getCategoryBySlug(slug);
  return category ? category.tags : [];
};

// Check if a project belongs to a category based on tag intersection
export const projectBelongsToCategory = (projectTags: string[], categorySlug: string): boolean => {
  const categoryTags = getCategoryTags(categorySlug);
  if (categoryTags.length === 0) return false;
  
  // Convert both arrays to lowercase
  const normalizedProjectTags = projectTags.map(tag => tag.toLowerCase());
  const normalizedCategoryTags = categoryTags.map(tag => tag.toLowerCase());
  
  // Find intersection: project.tags ∩ category.tags ≠ empty
  const intersection = normalizedProjectTags.filter(tag => 
    normalizedCategoryTags.includes(tag)
  );
  
  return intersection.length > 0;
};

// Get all categories a project belongs to
export const getProjectCategories = (projectTags: string[]): string[] => {
  return CATEGORY_DEFINITIONS
    .filter(category => projectBelongsToCategory(projectTags, category.slug))
    .map(category => category.slug);
};
