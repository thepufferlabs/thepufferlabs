import type { Metadata } from "next";
import { fetchAllBlogs } from "@/lib/github";
import BlogFeed from "@/components/blogs/BlogFeed";

export const metadata: Metadata = {
  title: "Blogs — The Puffer Labs",
  description: "Technical deep-dives from open-source projects. Each blog is pulled from the README of a public repository.",
};

export default async function BlogsPage() {
  const blogs = await fetchAllBlogs();

  // Collect unique categories, sorted with "Other Projects" last
  const categorySet = new Set(blogs.map((b) => b.category));
  const categories = [...categorySet].sort((a, b) => {
    if (a === "Other Projects") return 1;
    if (b === "Other Projects") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-navy pt-16">
      {/* Header */}
      <div className="border-b border-[var(--theme-border)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">Blogs</h1>
          <p className="text-sm text-text-muted max-w-2xl">Technical deep-dives pulled from the README of each open-source project. Each card links to the full writeup.</p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal">{blogs.length}</div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{categories.length}</div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{new Set(blogs.map((b) => b.language)).size}</div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Languages</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed + sidebar */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <BlogFeed blogs={blogs} categories={categories} />
      </div>
    </div>
  );
}
