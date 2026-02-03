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
}

export const SearchResult = ({
  title,
  subtitle,
  snippet,
  url,
  publishedDate,
  relevanceScore,
  topics,
  images
}: SearchResultProps) => {
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

        {/* Topics from H4 headings */}
        {topics && topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.slice(0, 4).map((topic, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-xs sm:text-sm text-secondary-foreground"
              >
                <Hash className="w-3 h-3 text-primary" />
                {topic}
              </span>
            ))}
            {topics.length > 4 && (
              <span className="px-3 py-1 text-xs sm:text-sm text-muted-foreground">
                +{topics.length - 4} more
              </span>
            )}
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
