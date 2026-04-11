import { Calendar, ExternalLink, Hash } from 'lucide-react';
import { format } from 'date-fns';

interface SearchResultProps {
  title: string;
  subtitle?: string;
  snippet: string;
  url: string;
  publishedDate?: string;
  relevanceScore?: number;
  topics?: string[];
  images?: string[];
  searchQuery?: string;
}

const highlightMatch = (text: string, query: string): boolean => {
  if (!query) return false;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  const lowerText = text.toLowerCase();
  return words.some(word => lowerText.includes(word));
};

export const SearchResult = ({
  title,
  subtitle,
  snippet,
  url,
  publishedDate,
  relevanceScore,
  topics,
  images,
  searchQuery
}: SearchResultProps) => {
  // Filter out generic "Discussion about this post" topic
  const filteredTopics = topics?.filter(t => t.toLowerCase() !== 'discussion about this post') || [];

  return (
    <article className="group relative p-5 sm:p-6 bg-card rounded-xl border border-border transition-all duration-200 hover:shadow-soft hover:border-primary/30">
      {/* Relevance indicator */}
      {relevanceScore !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 sm:mb-0 sm:absolute sm:top-5 sm:right-5">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: `hsl(${120 + (1 - relevanceScore) * 30} ${Math.min(relevanceScore * 80, 60)}% 50%)`
            }}
          />
          <span>{Math.round(relevanceScore * 100)}% match</span>
        </div>
      )}
      
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="font-display text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors sm:pr-28 leading-snug">
          {title}
        </h3>
        
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base text-muted-foreground line-clamp-2">
            {subtitle}
          </p>
        )}

        {/* Topics as scannable list with search highlighting */}
        {filteredTopics.length > 0 && (
          <div className="mt-3 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">In this edition:</span>
            <ul className="space-y-0.5">
              {filteredTopics.slice(0, 8).map((topic, index) => {
                const isMatch = searchQuery ? highlightMatch(topic, searchQuery) : false;
                return (
                  <li 
                    key={index}
                    className={`flex items-start gap-2 text-sm leading-snug py-0.5 ${
                      isMatch 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Hash className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isMatch ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    <span>{topic}</span>
                  </li>
                );
              })}
              {filteredTopics.length > 8 && (
                <li className="text-xs text-muted-foreground/60 pl-5">
                  +{filteredTopics.length - 8} more topics
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Images */}
        {images && images.length > 0 && (
          <div className="mt-4 flex gap-2 sm:gap-3 overflow-hidden">
            {images.slice(0, 3).map((img, index) => (
              <div 
                key={index}
                className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden bg-muted rounded-lg flex-shrink-0"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
          {publishedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(publishedDate), 'MMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-primary sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
            Read article
          </span>
        </div>
      </a>
    </article>
  );
};
