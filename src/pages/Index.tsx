import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Sparkles, Database, Plane, Ship, ArrowRight } from 'lucide-react';
import bannerBg from '@/assets/banner-bg.png';
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
    const interval = setInterval(fetchArticleCount, 10000);
    const handleVisibility = () => {
      if (!document.hidden) fetchArticleCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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
                { label: 'consumer trends', icon: '📈' },
                { label: 'Thailand', icon: '🇹🇭' },
                { label: 'South Korea', icon: '🇰🇷' }
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

          {/* Archive banner with background image */}
          <div
            className="relative mt-12 sm:mt-16 w-full max-w-2xl rounded-xl overflow-hidden animate-fade-in-up"
            style={{ animationDelay: '450ms' }}
          >
            <img
              src={bannerBg}
              alt=""
              className="w-full h-32 sm:h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
            <a
              href="https://www.crossborderalex.com/archive"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-between gap-4 px-6 group"
            >
              <div>
                <p className="text-base sm:text-lg font-display font-medium text-white drop-shadow-md">Browse the full newsletter archive</p>
                <p className="text-xs sm:text-sm text-white/80 mt-1">Read all editions on crossborderalex.com</p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
            </a>
          </div>
        </main>

        {/* Reader profile / "what jobs fit Alex" — synthesized from the indexed archive */}
        <section className="mb-16 sm:mb-24 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="bg-card border border-border rounded-2xl shadow-soft p-6 sm:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium mb-2">
              <Sparkles className="w-3 h-3" />
              Synthesized from {articleCount} editions
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              AI-analyzed by reading every edition in the archive.
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">
              What this archive says about Alex Baar
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              After {articleCount} editions, the archive reads as distinctly global-first and Asia-deep — China,
              Korea, Japan, SEA, India, MENA and LATAM all show up weekly — paired with a strong
              <span className="text-foreground font-medium"> European commerce</span> backbone.
              That makes the profile especially valuable as an <span className="text-foreground font-medium">inbound-to-Europe</span> bridge:
              helping brands and governments outside the EU understand how to sell into, partner
              with, or expand into European markets. Cross-functional by instinct: performance
              marketing, SEO, UX, product discovery, retail, payments and AI tooling sit side by
              side. The tone is opinionated and practical — issues get framed, judged and
              prescribed rather than merely reported. AI is treated as a tool, not a trend. And
              culture is handled as a first-class variable in commerce, not an afterthought.
              Flexible on location and <span className="text-foreground font-medium">open to relocating abroad</span> for the right mandate.
            </p>


            <h3 className="font-display text-lg text-foreground mb-3">Roles that fit that profile</h3>
            <ul className="grid sm:grid-cols-2 gap-3 mb-6">
              {[
                { t: 'International Growth Lead / Strategic Operator', d: 'Hands-on in APAC, MENA, LATAM — effective in orgs with low politics and high autonomy.' },
                { t: 'Cross-border / Marketplace Strategy Lead', d: 'Amazon, Shopify, TikTok Shop, Mercado Libre — platform or brand side.' },
                { t: 'Director of Digital / Omnichannel', d: 'Retailers where online ↔ offline really matters.' },
                { t: 'Principal Product Manager, International', d: 'Discovery vocabulary plus global market sense — a rare combo.' },
                { t: 'AI-for-Commerce Advisor / Fractional CMO', d: 'The weekly synthesis reads like client-grade strategy work.' },
                { t: 'Subject Matter Expert — Cross-border Commerce', d: 'Go-to internal expert for global e-commerce, marketplaces and localization decisions.' },
                { t: 'Country / Regional Expert — APAC, MENA, LATAM & Europe', d: 'Deep on-the-ground reading of China, Korea, Japan, SEA, India, Gulf, LATAM and European markets.' },
                { t: 'Inbound-to-Europe Expansion Lead', d: 'Helping non-EU brands, marketplaces and trade bodies enter and scale across European markets.' },
                { t: 'Business Expert / Commercial Strategist', d: 'Translates market signals into pricing, channel mix and go-to-market calls. Open to relocating.' },
                { t: 'Editor / Analyst at a Commerce Research Outlet', d: 'The archive functions as a research portfolio.' },
              ].map((r) => (
                <li key={r.t} className="flex gap-3 p-4 bg-background rounded-lg border border-border">
                  <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{r.t}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.d}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-4">
              The honest read: a <span className="text-foreground font-medium">generalist</span> and <span className="text-foreground font-medium">connective operator</span> —
              someone who naturally sits between regions, between functions, and between AI and humans.
              A poor fit for single-market IC roles; a strong match for international scale-ups,
              marketplaces and advisory work.
            </p>
          </div>
        </section>

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
