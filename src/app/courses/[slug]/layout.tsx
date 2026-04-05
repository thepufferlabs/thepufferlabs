import { getCourseBySlug } from "@/lib/courses/registry";
import { fetchSidebar } from "@/lib/courses/content-loader";
import CourseSidebar from "@/components/courses/CourseSidebar";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function CourseLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const product = await getCourseBySlug(slug);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!product) {
    return (
      <div className="min-h-screen bg-navy pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Course not found</h1>
          <Link href={`${basePath}/courses/`} className="text-teal hover:underline text-sm">
            &larr; Back to courses
          </Link>
        </div>
      </div>
    );
  }

  let sidebar;
  try {
    sidebar = await fetchSidebar(slug);
  } catch {
    sidebar = { projectSlug: slug, sections: [] };
  }

  return (
    <div className="min-h-screen bg-navy flex pt-16">
      <CourseSidebar slug={slug} sections={sidebar.sections} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
