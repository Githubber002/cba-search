import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Frown } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { SearchResult } from '@/components/SearchResult';
import { AISummary } from '@/components/AISummary';
import { RelatedArticles } from '@/components/RelatedArticles';
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
  const [summary, setSummary] = useState<string | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d' | '1y'>('all');
  const [sortOrder, setSortOrder] = useState<'relevance' | 'newest' | 'oldest'>('relevance');
  const [activeTopics, setActiveTopics] = useState<string[]>([]);

  // Reset topic filter when query changes
  useEffect(() => {
    setActiveTopics([]);
  }, [query]);

  const filterByDate = (articles: Article[]) => {
    if (dateFilter === 'all') return articles;
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[dateFilter];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return articles.filter(a => a.published_date && new Date(a.published_date).getTime() >= cutoff);
  };

  const filterByTopics = (articles: Article[]) => {
    if (activeTopics.length === 0) return articles;
    const active = activeTopics.map(t => t.toLowerCase());
    return articles.filter(a =>
      (a.topics || []).some(t => active.includes(t.toLowerCase()))
    );
  };

  const sortResults = (articles: Article[]) => {
    if (sortOrder === 'relevance') return articles;
    const sorted = [...articles];
    sorted.sort((a, b) => {
      const da = a.published_date ? new Date(a.published_date).getTime() : 0;
      const db = b.published_date ? new Date(b.published_date).getTime() : 0;
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return sorted;
  };

  const visibleResults = sortResults(filterByTopics(filterByDate(results)));

  // Build topic facets with counts from all results
  const topicFacets = (() => {
    const counts = new Map<string, number>();
    results.forEach(r => {
      (r.topics || []).forEach(t => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  })();

  const toggleTopic = (topic: string) => {
    setActiveTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    setSummary(null);
    setRelated([]);

    try {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      setResults(data.results || []);
      setSummary(data.summary || null);
      setRelated(data.related || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSummary(null);
      setRelated([]);
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

  // Pass full content; SearchResult builds a keyword-context window from it.


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
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="font-body text-sm sm:text-lg text-muted-foreground uppercase">
                    {visibleResults.length} of {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                      className="bg-card border border-border rounded-full px-3 py-1.5 text-xs sm:text-sm text-foreground hover:border-primary/30 focus:border-primary outline-none transition-colors"
                      aria-label="Filter by date"
                    >
                      <option value="all">All time</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="1y">Last year</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                      className="bg-card border border-border rounded-full px-3 py-1.5 text-xs sm:text-sm text-foreground hover:border-primary/30 focus:border-primary outline-none transition-colors"
                      aria-label="Sort results"
                    >
                      <option value="relevance">Most relevant</option>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Topic filter chips */}
              {topicFacets.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="font-body text-xs uppercase tracking-wider text-muted-foreground mr-1">
                    Filter by topic:
                  </span>
                  {topicFacets.map(([topic, count]) => {
                    const active = activeTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs sm:text-sm border transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground border-border hover:border-primary/40'
                        )}
                      >
                        {topic}
                        <span
                          className={cn(
                            'ml-1.5 text-[10px]',
                            active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                  {activeTopics.length > 0 && (
                    <button
                      onClick={() => setActiveTopics([])}
                      className="px-3 py-1 rounded-full text-xs sm:text-sm text-accent hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}


              {/* AI Summary */}
              {isLoading ? (
                <div className="mb-6">
                  <AISummary summary="" isLoading />
                </div>
              ) : summary ? (
                <div className="mb-6">
                  <AISummary 
                    summary={summary} 
                    sources={results.slice(0, 5).map(r => ({ title: r.title, url: r.url }))}
                  />
                </div>
              ) : null}

              {visibleResults.length === 0 && results.length > 0 && (
                <p className="font-body text-sm text-muted-foreground py-6 text-center">
                  No results match the selected date filter.
                </p>
              )}

              <div className="space-y-3 sm:space-y-4 animate-stagger">
                {visibleResults.map((article) => (
                  <SearchResult
                    key={article.id}
                    title={article.title}
                    subtitle={article.subtitle || undefined}
                    snippet={article.content}
                    url={article.url}
                    publishedDate={article.published_date || undefined}
                    topics={article.topics}
                    images={article.images}
                    relevanceScore={article.relevance}
                    searchQuery={query}
                  />
                ))}
              </div>

              {/* Related Articles */}
              <RelatedArticles articles={related} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResults;
