import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Sparkles, Database, Plane, Ship, Package, MapPin } from 'lucide-react';
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
      {/* Floating commerce icons background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <Plane className="absolute top-[10%] left-[5%] w-16 h-16 sm:w-24 sm:h-24 text-foreground animate-pulse" style={{ animationDuration: '4s' }} />
        <Ship className="absolute top-[60%] right-[8%] w-20 h-20 sm:w-32 sm:h-32 text-foreground animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <Package className="absolute bottom-[20%] left-[12%] w-12 h-12 sm:w-20 sm:h-20 text-foreground animate-pulse" style={{ animationDuration: '3s', animationDelay: '2s' }} />
        <Globe className="absolute top-[30%] right-[15%] w-24 h-24 sm:w-40 sm:h-40 text-foreground animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.5s' }} />
        <MapPin className="absolute bottom-[40%] left-[70%] w-10 h-10 sm:w-16 sm:h-16 text-foreground animate-pulse" style={{ animationDuration: '4s', animationDelay: '1.5s' }} />
      </div>

      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 sm:mb-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
            </div>
            <span className="font-body text-base sm:text-lg text-muted-foreground uppercase tracking-wider">
              Crossborder Alex Search
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card border-2 border-border">
            <Database className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <span className="font-body text-sm sm:text-lg text-muted-foreground uppercase">
              {articleCount} articles indexed
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center text-center pt-8 sm:pt-12 pb-16 sm:pb-24">
          {/* Region tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in-up">
            {['🇺🇸', '🇨🇳', '🇪🇺', '🇯🇵', '🇰🇷', '🇧🇷', '🇮🇳', '🇬🇧'].map((flag, i) => (
              <span 
                key={flag} 
                className="text-lg sm:text-xl opacity-60 hover:opacity-100 transition-opacity cursor-default"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {flag}
              </span>
            ))}
          </div>

          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/20 text-accent border-2 border-accent text-xs sm:text-sm font-body uppercase tracking-wide mb-6 sm:mb-8">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              AI-Powered Semantic Search
            </div>
          </div>

          <h1 className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl text-foreground leading-relaxed mb-4 sm:mb-6 text-balance animate-fade-in-up retro-glow px-2" style={{ animationDelay: '100ms' }}>
            Your Gateway to
            <span className="text-accent block mt-2">Global E-Commerce Intelligence</span>
          </h1>

          <p className="font-body text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 sm:mb-12 animate-fade-in-up leading-relaxed px-2" style={{ animationDelay: '200ms' }}>
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
          <div className="mt-8 sm:mt-12 animate-fade-in-up px-2" style={{ animationDelay: '400ms' }}>
            <p className="font-body text-base sm:text-lg text-muted-foreground mb-4 uppercase flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Popular Topics
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                { label: 'international expansion', icon: '🌍' },
                { label: 'AI in retail', icon: '🤖' },
                { label: 'cross-cultural marketing', icon: '🎯' },
                { label: 'e-commerce Asia', icon: '🏮' },
                { label: 'localization', icon: '🌐' },
                { label: 'social commerce', icon: '📱' },
                { label: 'logistics China', icon: '📦' },
                { label: 'consumer trends', icon: '📈' }
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => handleSearch(label)}
                  className="group px-3 py-1.5 sm:px-4 sm:py-2 font-body text-base sm:text-lg bg-card border-2 border-border text-muted-foreground hover:text-accent hover:border-accent transition-all uppercase tracking-wide flex items-center gap-2"
                >
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-60">
            <Plane className="w-3 h-3" />
            <span>Connecting markets worldwide</span>
            <Ship className="w-3 h-3" />
          </div>
          <p>
            Powered by{' '}
            <a 
              href="https://www.crossborderalex.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline"
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
