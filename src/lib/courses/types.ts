export interface CourseMeta {
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  level: string;
  tags: string[];
  banner: string;
  thumbnail: string;
  repoType: string;
  status: string;
  version?: string;
  githubTopics?: string[];
  previewDocPaths: string[];
  premiumDocPaths: string[];
  publicBlogPaths: string[];
  premiumBlogPaths: string[];
  sampleCodePaths: string[];
  premiumCodePaths: string[];
}

/** Enriched course data combining product + course details from Supabase */
export interface CourseInfo extends CourseMeta {
  updatedAt: string;
  stars: number;
  thumbnailUrl: string;
  freeContentCount: number;
  premiumContentCount: number;
  priceCents: number;
  currency: string;
  comparePriceCents: number | null;
}

export interface ContentEntry {
  contentKey: string;
  title: string;
  section: string;
  accessLevel: "free" | "premium";
  contentType: "doc" | "blog" | "code";
  sourceType: string;
  sourcePath: string;
  routePath: string;
  tags: string[];
  order: number;
  isPublished: boolean;
  migrationTargetPath: string | null;
}

export interface SidebarItem {
  contentKey: string;
  title: string;
  routePath: string;
  accessLevel: "free" | "premium";
  order: number;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: string;
  premium?: boolean;
  items: SidebarItem[];
}

export interface Sidebar {
  projectSlug: string;
  sections: SidebarSection[];
}

export interface TocItem {
  order: number;
  contentKey: string;
  title: string;
  accessLevel: "free" | "premium";
}

export interface TocPhase {
  phase: string;
  description: string;
  items: TocItem[];
}

export interface Toc {
  projectSlug: string;
  title: string;
  toc: TocPhase[];
}
