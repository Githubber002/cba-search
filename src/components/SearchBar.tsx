import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight, Clock, Hash, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
  autoFocus?: boolean;
  size?: 'default' | 'large';
}

interface TitleSuggestion {
  id: string;
  title: string;
  url: string;
}

const RECENT_KEY = 'cba-recent-searches';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  try {
    const current = loadRecent().filter(
      (r) => r.toLowerCase() !== trimmed.toLowerCase()
    );
    const next = [trimmed, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export const SearchBar = ({
  onSearch,
  isLoading = false,
  initialQuery = '',
  autoFocus = false,
  size = 'default',
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [titles, setTitles] = useState<TitleSuggestion[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced autocomplete fetch
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setTitles([]);
      setTopics([]);
      return;
    }
    const timer = setTimeout(async () => {
      const like = `%${q}%`;
      const { data } = await supabase
        .from('articles')
        .select('id, title, url, topics')
        .ilike('title', like)
        .limit(6);

      setTitles(
        (data || []).map((a) => ({ id: a.id, title: a.title, url: a.url }))
      );

      // Derive matching topics from those rows + a broader topic query
      const { data: topicRows } = await supabase
        .from('articles')
        .select('topics')
        .contains('topics', [q.toLowerCase()])
        .limit(20);

      const set = new Set<string>();
      const lq = q.toLowerCase();
      (data || []).forEach((a: { topics?: string[] | null }) => {
        (a.topics || []).forEach((t) => {
          if (t.toLowerCase().includes(lq)) set.add(t);
        });
      });
      (topicRows || []).forEach((r: { topics?: string[] | null }) => {
        (r.topics || []).forEach((t) => {
          if (t.toLowerCase().includes(lq)) set.add(t);
        });
      });
      setTopics(Array.from(set).slice(0, 6));
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setRecent(loadRecent());
    setOpen(false);
    onSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  // Flatten suggestions for keyboard nav order: recent -> titles -> topics
  const showRecent = query.trim().length < 2 && recent.length > 0;
  const flat: Array<{ type: 'recent' | 'title' | 'topic'; value: string; url?: string }> =
    showRecent
      ? recent.map((r) => ({ type: 'recent' as const, value: r }))
      : [
          ...titles.map((t) => ({ type: 'title' as const, value: t.title, url: t.url })),
          ...topics.map((t) => ({ type: 'topic' as const, value: t })),
        ];

  const hasSuggestions = open && flat.length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item.type === 'title' && item.url) {
        setOpen(false);
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        submit(item.value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const isLarge = size === 'large';

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className={cn(
            'search-focus relative flex items-center w-full bg-card border border-border rounded-full transition-all duration-200',
            'hover:shadow-soft hover:border-primary/30',
            'focus-within:shadow-elevated focus-within:border-primary',
            isLarge ? 'px-5 sm:px-6 py-3 sm:py-4' : 'px-4 sm:px-5 py-2 sm:py-3'
          )}
        >
          <Search
            className={cn(
              'text-muted-foreground flex-shrink-0 transition-colors',
              isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'
            )}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search articles..."
            autoFocus={autoFocus}
            aria-autocomplete="list"
            aria-expanded={hasSuggestions}
            className={cn(
              'flex-1 min-w-0 bg-transparent border-none outline-none placeholder:text-muted-foreground/50',
              isLarge ? 'ml-3 sm:ml-4 text-base sm:text-lg' : 'ml-2 sm:ml-3 text-sm sm:text-base'
            )}
          />
          {isLoading ? (
            <Loader2
              className={cn(
                'text-primary animate-spin flex-shrink-0',
                isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'
              )}
            />
          ) : (
            <button
              type="submit"
              disabled={!query.trim()}
              className={cn(
                'flex items-center gap-2 px-4 sm:px-5 py-2 bg-primary text-primary-foreground font-medium rounded-full transition-all flex-shrink-0',
                'hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed',
                isLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              )}
            >
              <span className="hidden sm:inline">Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <p
          className={cn(
            'text-muted-foreground mt-3 text-center',
            isLarge ? 'text-sm' : 'text-xs'
          )}
        >
          AI-powered semantic search across all newsletter content
        </p>
      </form>

      {hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {showRecent && (
            <div className="px-4 py-2 text-xs font-body uppercase tracking-wider text-muted-foreground border-b border-border">
              Recent searches
            </div>
          )}
          {!showRecent && titles.length > 0 && (
            <div className="px-4 py-2 text-xs font-body uppercase tracking-wider text-muted-foreground border-b border-border">
              Articles
            </div>
          )}
          <ul role="listbox">
            {flat.map((item, i) => {
              const active = i === activeIndex;
              const Icon =
                item.type === 'recent' ? Clock : item.type === 'topic' ? Hash : FileText;
              return (
                <li key={`${item.type}-${item.value}-${i}`} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => {
                      if (item.type === 'title' && item.url) {
                        setOpen(false);
                        window.open(item.url, '_blank', 'noopener,noreferrer');
                      } else {
                        submit(item.value);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      active ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate">{item.value}</span>
                    {item.type === 'topic' && (
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        topic
                      </span>
                    )}
                  </button>
                  {/* Section divider between titles and topics */}
                  {!showRecent &&
                    item.type === 'title' &&
                    flat[i + 1]?.type === 'topic' && (
                      <div className="px-4 py-2 text-xs font-body uppercase tracking-wider text-muted-foreground border-t border-b border-border bg-background/50">
                        Topics
                      </div>
                    )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
