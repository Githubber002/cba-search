import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Sparkles, Database, Plane, Ship, ArrowRight } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const [articleCount, setArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchArticleCount = async () => {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });
      setArticleCount(count || 0);
    };
    fetchArticleCount();
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen gradient-warm relative overflow-hidden">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Globe className="absolute top-[15%] right-[10%] w-32 h-32 sm:w-48 sm:h-48 text-primary animate-float" style={{ animationDelay: '0s' }} />
        <Plane className="absolute bottom-[25%] left-[8%] w-16 h-16 sm:w-24 sm:h-24 text-primary animate-float" style={{ animationDelay: '2s' }} />
        <Ship className="absolute top-[60%] right-[5%] w-20 h-20 sm:w-28 sm:h-28 text-primary animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 sm:mb-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full animate-globe-pulse" />
            </div>
            <span className="font-display text-lg sm:text-xl text-foreground">
              Crossborder Alex
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-soft border border-border">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {articleCount} articles indexed
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center text-center pt-4 sm:pt-8 pb-16 sm:pb-24">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Semantic Search
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight mb-6 text-balance animate-fade-in-up px-2" style={{ animationDelay: '100ms' }}>
            Your Gateway to
            <span className="text-primary block mt-1">Global E-Commerce Intelligence</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in-up leading-relaxed px-2" style={{ animationDelay: '200ms' }}>
            Explore {articleCount}+ articles on international expansion, cross-border logistics, 
            localization strategies, and emerging markets.
          </p>

          <div className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <SearchBar 
              onSearch={handleSearch} 
              isLoading={isLoading}
              autoFocus
              size="large"
            />
          </div>

          {/* Category chips */}
          <div className="mt-12 sm:mt-16 animate-fade-in-up px-2" style={{ animationDelay: '400ms' }}>
            <p className="text-sm text-muted-foreground mb-5 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-border" />
              Popular Topics
              <span className="w-8 h-px bg-border" />
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                { label: 'international expansion', icon: '🌍' },
                { label: 'AI in retail', icon: '🤖' },
                { label: 'cross-cultural marketing', icon: '🎯' },
                { label: 'e-commerce Asia', icon: '🏮' },
                { label: 'Shenzhen, China', icon: '🇨🇳' },
                { label: 'Japan', icon: '🇯🇵' },
                { label: 'localization', icon: '🌐' },
                { label: 'social commerce', icon: '📱' },
                { label: 'logistics China', icon: '📦' },
                { label: 'consumer trends', icon: '📈' }
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => handleSearch(label)}
                  className="group px-4 py-2 bg-card rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary hover:shadow-soft transition-all flex items-center gap-2"
                >
                  <span>{icon}</span>
                  {label}
                  <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 opacity-60">
            <span className="w-8 h-px bg-border" />
            <span>Connecting markets worldwide</span>
            <span className="w-8 h-px bg-border" />
          </div>
          <p>
            Powered by{' '}
            <a 
              href="https://www.crossborderalex.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              crossborderalex.com
            </a>
            {' '}newsletter archive
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
