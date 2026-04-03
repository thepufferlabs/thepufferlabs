import SectionWrapper from "@/components/ui/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import { FEATURED_ARTICLES } from "@/lib/constants";

export default function FeaturedContent() {
  return (
    <SectionWrapper id="blog">
      <SectionHeading label="Blog" title="Featured Content" description="Deep dives into the engineering decisions that shape production systems." />

      <div className="grid md:grid-cols-3 gap-6">
        {FEATURED_ARTICLES.map((article) => (
          <Card key={article.title} className="group flex flex-col">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span key={tag} className="inline-block text-[10px] font-semibold tracking-wider uppercase text-teal bg-teal/10 px-2.5 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-text-primary mb-3 leading-snug group-hover:text-teal transition-colors">{article.title}</h3>

            {/* Description */}
            <p className="text-sm text-text-muted leading-relaxed flex-1">{article.description}</p>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-glass-border flex items-center justify-between">
              <span className="text-xs text-text-dim font-mono">{article.readTime}</span>
              <span className="text-xs text-teal font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Read
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8.7 1.3a1 1 0 00-1.4 1.4L11.58 7H2a1 1 0 000 2h9.58l-4.3 4.3a1 1 0 001.42 1.4l6-6a1 1 0 000-1.4l-6-6z" />
                </svg>
              </span>
            </div>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
