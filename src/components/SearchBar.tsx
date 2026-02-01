import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
  autoFocus?: boolean;
  size?: 'default' | 'large';
}

export const SearchBar = ({ 
  onSearch, 
  isLoading = false, 
  initialQuery = '',
  autoFocus = false,
  size = 'default'
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div 
        className={cn(
          "search-focus relative flex items-center w-full bg-card border border-border rounded-xl transition-all duration-300",
          "hover:border-accent/50 hover:shadow-soft",
          "focus-within:border-accent focus-within:shadow-elevated",
          isLarge ? "px-6 py-5" : "px-4 py-3"
        )}
      >
        <Search 
          className={cn(
            "text-muted-foreground flex-shrink-0 transition-colors",
            "group-focus-within:text-accent",
            isLarge ? "w-6 h-6" : "w-5 h-5"
          )} 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles... try synonyms like 'global trade' or 'marketing strategy'"
          autoFocus={autoFocus}
          className={cn(
            "flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground/60 font-sans",
            isLarge ? "mx-4 text-lg" : "mx-3 text-base"
          )}
        />
        {isLoading ? (
          <Loader2 className={cn(
            "text-accent animate-spin flex-shrink-0",
            isLarge ? "w-6 h-6" : "w-5 h-5"
          )} />
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all",
              "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
              isLarge ? "text-base" : "text-sm"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        )}
      </div>
      <p className={cn(
        "text-muted-foreground mt-3 text-center",
        isLarge ? "text-sm" : "text-xs"
      )}>
        AI-powered semantic search understands context and synonyms
      </p>
    </form>
  );
};
