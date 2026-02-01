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
    <article className="group relative p-6 bg-card border-2 border-border transition-all duration-300 hover:shadow-soft hover:border-accent">
      {/* Relevance indicator */}
      {relevanceScore !== undefined && (
        <div className="absolute top-4 right-4 flex items-center gap-2 font-body text-lg text-muted-foreground uppercase">
          <div 
            className="w-3 h-3"
            style={{
              backgroundColor: `hsl(120 ${Math.min(relevanceScore * 100, 60)}% 50%)`
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
        <h3 className="font-display text-sm text-foreground group-hover:text-accent transition-colors pr-28 leading-relaxed retro-glow">
          {title}
        </h3>
        
        {subtitle && (
          <p className="mt-2 font-body text-lg text-muted-foreground line-clamp-1 uppercase">
            {subtitle}
          </p>
        )}

        {/* Topics from H4 headings */}
        {topics && topics.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {topics.slice(0, 6).map((topic, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-2 font-body text-lg text-muted-foreground"
              >
                <Hash className="w-4 h-4 text-accent flex-shrink-0" />
                {topic}
              </span>
            ))}
            {topics.length > 6 && (
              <span className="font-body text-base text-muted-foreground/70 pl-6 uppercase">
                +{topics.length - 6} more topics
              </span>
            )}
          </div>
        )}

        {/* Images */}
        {images && images.length > 0 && (
          <div className="mt-4 flex gap-3 overflow-hidden">
            {images.slice(0, 3).map((img, index) => (
              <div 
                key={index}
                className="relative w-20 h-20 overflow-hidden bg-muted flex-shrink-0 border-2 border-border"
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
        
        <div className="mt-4 flex items-center gap-6 font-body text-lg text-muted-foreground uppercase">
          {publishedDate && (
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(publishedDate), 'MMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
            Read article
          </span>
        </div>
      </a>
    </article>
  );
};
