import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen gradient-warm relative">
      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex justify-center items-center mb-8 sm:mb-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            <span className="font-body text-base sm:text-lg text-muted-foreground uppercase tracking-wider">
              Crossborder Alex Search
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center text-center pt-8 sm:pt-12 pb-16 sm:pb-24">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/20 text-accent border-2 border-accent text-xs sm:text-sm font-body uppercase tracking-wide mb-6 sm:mb-8">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              AI-Powered Semantic Search
            </div>
          </div>

          <h1 className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl text-foreground leading-relaxed mb-4 sm:mb-6 text-balance animate-fade-in-up retro-glow px-2" style={{ animationDelay: '100ms' }}>
            Search
            <span className="text-accent block mt-2">Crossborder Alex</span>
          </h1>

          <p className="font-body text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 sm:mb-12 animate-fade-in-up leading-relaxed px-2" style={{ animationDelay: '200ms' }}>
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
          <div className="mt-8 sm:mt-12 animate-fade-in-up px-2" style={{ animationDelay: '400ms' }}>
            <p className="font-body text-base sm:text-lg text-muted-foreground mb-4 uppercase">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                'international expansion',
                'AI in retail',
                'cross-cultural marketing',
                'e-commerce Asia',
                'localization',
                'social commerce',
                'logistics China',
                'consumer trends'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleSearch(example)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 font-body text-base sm:text-lg bg-card border-2 border-border text-muted-foreground hover:text-accent hover:border-accent transition-all uppercase tracking-wide"
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
