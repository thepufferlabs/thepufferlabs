import { discoverCourseRepos } from "@/lib/courses/registry";
import { fetchCourseInfo } from "@/lib/courses/content-loader";
import CourseCatalog from "@/components/courses/CourseCatalog";
import Link from "next/link";

export const metadata = {
  title: "Courses — The Puffer Labs",
  description: "Premium learning paths for software engineers. Deep-dive courses from beginner to Staff/Principal Engineer mastery.",
};

export default async function CourseCatalogPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const registry = await discoverCourseRepos();

  const courses = await Promise.all(
    registry.map(async (entry) => {
      try {
        return await fetchCourseInfo(entry);
      } catch (err) {
        console.error(`Failed to fetch course meta for ${entry.slug}:`, err);
        return null;
      }
    })
  );

  const validCourses = courses.filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="min-h-screen bg-navy pt-16">
      {/* Header */}
      <header className="border-b border-[var(--theme-border)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal/10 text-teal border border-teal/20">Premium Courses</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-3">Learn by Building Mastery</h1>
            <p className="text-text-muted leading-relaxed">
              Production-grade learning paths designed for engineers who want depth, not surface-level tutorials. Each course takes you from foundations to staff-level expertise.
            </p>
          </div>
        </div>
      </header>

      {/* Catalog */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <CourseCatalog courses={validCourses} basePath={basePath} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--theme-border)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link href={`${basePath}/`} className="text-sm text-text-dim hover:text-teal transition-colors">
            &larr; Back to The Puffer Labs
          </Link>
          <p className="text-xs text-text-dim font-mono">&copy; {new Date().getFullYear()} The Puffer Labs</p>
        </div>
      </footer>
    </div>
  );
}
