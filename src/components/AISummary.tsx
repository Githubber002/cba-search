import { Sparkles, ExternalLink } from 'lucide-react';

interface Source {
  title: string;
  url: string;
}

interface AISummaryProps {
  summary: string;
  sources?: Source[];
  isLoading?: boolean;
}

export const AISummary = ({ summary, sources, isLoading }: AISummaryProps) => {
  if (isLoading) {
    return (
      <div className="p-5 sm:p-6 bg-primary/5 border border-primary/20 rounded-xl animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-wide">AI Summary</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-primary/10 rounded w-full" />
          <div className="h-4 bg-primary/10 rounded w-4/5" />
          <div className="h-4 bg-primary/10 rounded w-3/5" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-5 sm:p-6 bg-primary/5 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary uppercase tracking-wide">AI Summary</span>
      </div>
      <p className="text-foreground leading-relaxed mb-4">{summary}</p>
      {sources && sources.length > 0 && (
        <div className="border-t border-primary/10 pt-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-full text-xs sm:text-sm text-foreground hover:text-primary hover:border-primary/30 transition-all"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
