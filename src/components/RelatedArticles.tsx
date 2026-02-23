import { ExternalLink, Hash } from 'lucide-react';

interface RelatedArticle {
  id: string;
  title: string;
  url: string;
  topics?: string[];
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export const RelatedArticles = ({ articles }: RelatedArticlesProps) => {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-14">
      <h2 className="font-display text-lg sm:text-xl text-foreground mb-4 flex items-center gap-2">
        <span className="w-6 h-px bg-border" />
        You might also like
        <span className="w-6 h-px bg-border" />
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-soft transition-all"
          >
            <h3 className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {article.title}
            </h3>
            {article.topics && article.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {article.topics.slice(0, 3).map((topic, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs text-secondary-foreground">
                    <Hash className="w-2.5 h-2.5 text-primary" />
                    {topic}
                  </span>
                ))}
              </div>
            )}
            <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-3 h-3" />
              Read article
            </span>
          </a>
        ))}
      </div>
    </section>
  );
};
