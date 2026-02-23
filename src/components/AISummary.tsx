import { Sparkles } from 'lucide-react';

interface AISummaryProps {
  summary: string;
  isLoading?: boolean;
}

export const AISummary = ({ summary, isLoading }: AISummaryProps) => {
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
      <p className="text-foreground leading-relaxed">{summary}</p>
    </div>
  );
};
