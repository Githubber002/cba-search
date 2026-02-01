import { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Update cursor position based on text length
  useEffect(() => {
    if (wrapperRef.current && inputRef.current) {
      const input = inputRef.current;
      const computedStyle = window.getComputedStyle(input);
      const fontSize = parseFloat(computedStyle.fontSize);
      // Approximate character width for VT323 monospace font
      const charWidth = fontSize * 0.6;
      const cursorPos = query.length * charWidth + 8; // 8px initial offset
      wrapperRef.current.style.setProperty('--cursor-position', `${cursorPos}px`);
    }
  }, [query]);

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
          "search-focus relative flex items-center w-full bg-card border-2 border-border transition-all duration-300",
          "hover:border-accent hover:shadow-soft",
          "focus-within:border-accent focus-within:shadow-elevated",
          isLarge ? "px-4 sm:px-6 py-3 sm:py-4" : "px-3 sm:px-4 py-2 sm:py-3"
        )}
      >
        <Search 
          className={cn(
            "text-muted-foreground flex-shrink-0 transition-colors",
            "group-focus-within:text-accent",
            isLarge ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"
          )} 
        />
        <div ref={wrapperRef} className="flex-1 min-w-0 relative c64-cursor-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            autoFocus={autoFocus}
            className={cn(
              "w-full bg-transparent border-none outline-none placeholder:text-muted-foreground/60 font-body uppercase tracking-wide c64-cursor",
              isLarge ? "ml-2 sm:ml-3 text-lg sm:text-2xl" : "ml-2 text-base sm:text-xl"
            )}
          />
        </div>
        {isLoading ? (
          <Loader2 className={cn(
            "text-accent animate-spin flex-shrink-0",
            isLarge ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"
          )} />
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className={cn(
              "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-accent text-accent-foreground font-body uppercase tracking-wide transition-all border-2 border-transparent flex-shrink-0",
              "hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed",
              isLarge ? "text-base sm:text-xl" : "text-sm sm:text-lg"
            )}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        )}
      </div>
      <p className={cn(
        "text-muted-foreground mt-2 sm:mt-3 text-center font-body uppercase tracking-wide",
        isLarge ? "text-base sm:text-lg" : "text-sm sm:text-base"
      )}>
        AI-powered semantic search
      </p>
    </form>
  );
};
