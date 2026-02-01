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
    <article className="group relative p-6 bg-card rounded-xl border border-border transition-all duration-300 hover:shadow-soft hover:border-accent/30">
      {/* Relevance indicator */}
      {relevanceScore !== undefined && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <div 
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: `hsl(35 ${Math.min(relevanceScore * 100, 90)}% 55%)`
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
        <h3 className="font-serif text-xl font-normal text-foreground group-hover:text-accent transition-colors pr-24 leading-tight">
          {title}
        </h3>
        
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Topics from H4 headings */}
        {topics && topics.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {topics.slice(0, 6).map((topic, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Hash className="w-3 h-3 text-accent flex-shrink-0" />
                {topic}
              </span>
            ))}
            {topics.length > 6 && (
              <span className="text-xs text-muted-foreground/70 pl-4">
                +{topics.length - 6} more topics
              </span>
            )}
          </div>
        )}

        {/* Images */}
        {images && images.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-hidden">
            {images.slice(0, 3).map((img, index) => (
              <div 
                key={index}
                className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0"
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
        
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {publishedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(publishedDate), 'MMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
            Read article
          </span>
        </div>
      </a>
    </article>
  );
};
