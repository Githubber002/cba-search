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

  // Parse inline [1], [2] citations and turn them into anchor links to sources
  const renderSummaryWithCitations = () => {
    if (!sources || sources.length === 0) return summary;

    const parts: (string | JSX.Element)[] = [];
    const regex = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(summary)) !== null) {
      const num = parseInt(match[1], 10);
      const source = sources[num - 1];
      if (match.index > lastIndex) {
        parts.push(summary.slice(lastIndex, match.index));
      }
      if (source) {
        parts.push(
          <a
            key={key++}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.title}
            className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 mx-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors align-baseline no-underline"
          >
            {num}
          </a>
        );
      } else {
        parts.push(match[0]);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < summary.length) parts.push(summary.slice(lastIndex));
    return parts;
  };

  return (
    <div className="p-5 sm:p-6 bg-primary/5 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary uppercase tracking-wide">AI Summary</span>
      </div>
      <p className="text-foreground leading-relaxed mb-2">{renderSummaryWithCitations()}</p>
      <p className="text-xs text-muted-foreground mb-4 italic">
        Click a numbered citation or a source below to read the full article.
      </p>
      {sources && sources.length > 0 && (
        <div className="border-t border-primary/10 pt-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sources</p>
          <div className="flex flex-col gap-2">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-start gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs sm:text-sm text-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="line-clamp-2 flex-1">{source.title}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-1 text-muted-foreground group-hover:text-primary" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
