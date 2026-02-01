import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search as SearchIcon, Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { IndexingStatus } from '@/components/IndexingStatus';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const [articleCount, setArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchArticleCount = async () => {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    setArticleCount(count || 0);
  };

  useEffect(() => {
    fetchArticleCount();
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen gradient-warm">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            <span className="font-medium text-sm text-muted-foreground">
              Crossborder Alex Search
            </span>
          </div>
          <IndexingStatus 
            articleCount={articleCount} 
            onIndexComplete={fetchArticleCount} 
          />
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center text-center pt-12 pb-24">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Semantic Search
            </div>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6 text-balance animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Search
            <span className="italic text-accent"> Crossborder Alex</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Find articles on global e-commerce, marketing, AI, and retail. 
            Our semantic search understands synonyms and context—not just keywords.
          </p>

          <div className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <SearchBar 
              onSearch={handleSearch} 
              isLoading={isLoading}
              autoFocus
              size="large"
            />
          </div>

          {/* Example searches */}
          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <p className="text-sm text-muted-foreground mb-4">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'international expansion strategies',
                'AI in retail',
                'cross-cultural marketing',
                'e-commerce trends Asia',
                'product localization'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleSearch(example)}
                  className="px-4 py-2 text-sm bg-card border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-accent/50 transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground">
          <p>
            Searching through{' '}
            <a 
              href="https://www.crossborderalex.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              crossborderalex.com
            </a>
            {' '}archive
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
