import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

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
          "search-focus relative flex items-center w-full bg-card border border-border rounded-full transition-all duration-200",
          "hover:shadow-soft hover:border-primary/30",
          "focus-within:shadow-elevated focus-within:border-primary",
          isLarge ? "px-5 sm:px-6 py-3 sm:py-4" : "px-4 sm:px-5 py-2 sm:py-3"
        )}
      >
        <Search 
          className={cn(
            "text-muted-foreground flex-shrink-0 transition-colors",
            isLarge ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"
          )} 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          autoFocus={autoFocus}
          className={cn(
            "flex-1 min-w-0 bg-transparent border-none outline-none placeholder:text-muted-foreground/50",
            isLarge ? "ml-3 sm:ml-4 text-base sm:text-lg" : "ml-2 sm:ml-3 text-sm sm:text-base"
          )}
        />
        {isLoading ? (
          <Loader2 className={cn(
            "text-primary animate-spin flex-shrink-0",
            isLarge ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"
          )} />
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className={cn(
              "flex items-center gap-2 px-4 sm:px-5 py-2 bg-primary text-primary-foreground font-medium rounded-full transition-all flex-shrink-0",
              "hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed",
              isLarge ? "text-sm sm:text-base" : "text-xs sm:text-sm"
            )}
          >
            <span className="hidden sm:inline">Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className={cn(
        "text-muted-foreground mt-3 text-center",
        isLarge ? "text-sm" : "text-xs"
      )}>
        AI-powered semantic search across all newsletter content
      </p>
    </form>
  );
};
