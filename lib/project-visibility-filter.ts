/**
 * 3-Step Gate Filtering Logic for Project Registration Projects
 * 
 * Business Logic:
 * If a project's source is "project_registration", it must meet ALL of the following conditions:
 * 1. Mentor Assignment: The project must have an assigned Mentor
 * 2. Content Completeness: Must have Tags AND Cover Image
 * 
 * Logic Table:
 * - Origin == Registration AND HasMentor AND HasTags AND HasImage -> SHOW
 * - Origin == Registration AND (MissingMentor OR MissingTags OR MissingImage) -> HIDE
 * - Origin != Registration -> Apply standard display rules (ignore these specific constraints)
 */

export interface ProjectVisibilityFilter {
  _id?: string;
  title?: string;
  description?: string;
  origin?: string;
  mentorAssigned?: boolean;
  mentorId?: string;
  mentorAssignmentId?: string;
  mentorStatus?: string;
  tags?: string[];
  images?: string[];
  likeCount?: number;
  shareCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  visibility?: string;
  projectStatus?: string;
  author?: any;
}

/**
 * Check if a project meets the 3-step gate requirements for visibility
 * @param project - The project object to check
 * @returns boolean - true if project should be visible, false if it should be hidden
 */
export function shouldShowProjectRegistration(project: ProjectVisibilityFilter): boolean {
  // If project is not from project registration, apply standard rules (always show)
  if (project.origin !== 'project_registration') {
    return true;
  }

  // 3-Step Gate Logic for project registration projects
  const hasMentor = checkMentorAssignment(project);
  const hasTags = checkTagsCompleteness(project);
  const hasImage = checkImageCompleteness(project);

  // Log the decision for debugging
  console.log(`🚪 3-Step Gate for "${project.title || 'Unknown Project'}":`, {
    origin: project.origin,
    hasMentor,
    hasTags,
    hasImage,
    shouldShow: hasMentor && hasTags && hasImage
  });

  // Show only if ALL conditions are met
  return hasMentor && hasTags && hasImage;
}

/**
 * Check if project has an assigned mentor
 */
function checkMentorAssignment(project: ProjectVisibilityFilter): boolean {
  // Check multiple possible mentor assignment indicators
  return !!(
    project.mentorAssigned === true ||
    project.mentorId ||
    project.mentorAssignmentId ||
    project.mentorStatus === 'accepted' ||
    project.projectStatus === 'ACTIVE' // If project is ACTIVE, it likely has a mentor
  );
}

/**
 * Check if project has complete tags
 */
function checkTagsCompleteness(project: ProjectVisibilityFilter): boolean {
  const tags = project.tags || [];
  return Array.isArray(tags) && tags.length > 0;
}

/**
 * Check if project has a cover image
 */
function checkImageCompleteness(project: ProjectVisibilityFilter): boolean {
  const images = project.images || [];
  return Array.isArray(images) && images.length > 0 && images.some(img => img && img.trim() !== '');
}

/**
 * Filter an array of projects using the 3-step gate logic
 * @param projects - Array of projects to filter
 * @returns Filtered array of projects
 */
export function filterProjectsByVisibility(projects: ProjectVisibilityFilter[]): ProjectVisibilityFilter[] {
  return projects.filter(project => shouldShowProjectRegistration(project));
}

/**
 * Get visibility statistics for debugging
 */
export function getVisibilityStats(projects: ProjectVisibilityFilter[]) {
  const stats = {
    total: projects.length,
    projectRegistration: projects.filter(p => p.origin === 'project_registration').length,
    otherOrigin: projects.filter(p => p.origin !== 'project_registration').length,
    visible: 0,
    hidden: 0,
    hiddenReasons: {
      missingMentor: 0,
      missingTags: 0,
      missingImage: 0,
      multipleIssues: 0
    }
  };

  projects.forEach(project => {
    if (project.origin === 'project_registration') {
      const hasMentor = checkMentorAssignment(project);
      const hasTags = checkTagsCompleteness(project);
      const hasImage = checkImageCompleteness(project);
      
      const shouldShow = hasMentor && hasTags && hasImage;
      
      if (shouldShow) {
        stats.visible++;
      } else {
        stats.hidden++;
        
        // Track why it's hidden
        const issues = [];
        if (!hasMentor) issues.push('missingMentor');
        if (!hasTags) issues.push('missingTags');
        if (!hasImage) issues.push('missingImage');
        
        if (issues.length === 1) {
          stats.hiddenReasons[issues[0] as keyof typeof stats.hiddenReasons]++;
        } else {
          stats.hiddenReasons.multipleIssues++;
        }
      }
    } else {
      stats.visible++; // Non-registration projects are always visible
    }
  });

  return stats;
}
