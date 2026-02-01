import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Frown } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { SearchResult } from '@/components/SearchResult';
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  url: string;
  published_date: string | null;
  relevance?: number;
  topics?: string[];
  images?: string[];
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const handleSearch = (newQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  const createSnippet = (content: string, maxLength: number = 250): string => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 border-2 border-border hover:border-accent hover:text-accent transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
            <span className="font-body text-sm sm:text-lg uppercase tracking-wider truncate">Crossborder Alex Search</span>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={isLoading}
            initialQuery={query}
          />
        </div>

        {/* Results */}
        <main>
          {isLoading ? (
            <div className="py-12 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 sm:gap-3 text-muted-foreground font-body text-lg sm:text-xl">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-accent border-t-transparent animate-spin" />
                <span className="uppercase">Searching with AI...</span>
              </div>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="py-12 sm:py-20 text-center px-2">
              <Frown className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="font-display text-xs sm:text-lg text-foreground mb-4">No results found</h2>
              <p className="font-body text-lg sm:text-xl text-muted-foreground mb-6">
                Try different keywords or synonyms. The archive may not have been indexed yet.
              </p>
              <button
                onClick={() => navigate('/')}
                className="font-body text-lg sm:text-xl text-accent hover:underline uppercase"
              >
                Go back and re-index articles
              </button>
            </div>
          ) : (
            <>
              {results.length > 0 && (
                <p className="font-body text-sm sm:text-lg text-muted-foreground mb-4 sm:mb-6 uppercase">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </p>
              )}
              <div className="space-y-3 sm:space-y-4 animate-stagger">
                {results.map((article) => (
                  <SearchResult
                    key={article.id}
                    title={article.title}
                    subtitle={article.subtitle || undefined}
                    snippet={createSnippet(article.content)}
                    url={article.url}
                    publishedDate={article.published_date || undefined}
                    topics={article.topics}
                    images={article.images}
                    relevanceScore={article.relevance}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResults;
