import { Calendar, ChevronDown, ChevronRight, ExternalLink, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildExcerpt, matchesQuery, queryPattern, topicExcerpt } from '../../supabase/functions/_shared/search-text';

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

const renderHighlighted = (text: string, query: string) => {
  const pattern = queryPattern(query);
  if (!pattern) return text;
  const parts = text.split(pattern);
  return parts.map((part, index) => index % 2 === 1 ? (
    <mark key={index} className="bg-accent/20 text-foreground font-semibold rounded px-0.5">{part}</mark>
  ) : <span key={index}>{part}</span>);
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
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  // Filter out generic "Discussion about this post" topic
  const filteredTopics = (topics?.filter(t => t.toLowerCase() !== 'discussion about this post') || [])
    .sort((a, b) => Number(matchesQuery(b, searchQuery || '')) - Number(matchesQuery(a, searchQuery || '')));
  const [showAllTopics, setShowAllTopics] = useState(false);
  const visibleTopics = showAllTopics ? filteredTopics : filteredTopics.slice(0, 8);

  const toggleTopic = (i: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <article className="group relative p-5 sm:p-6 bg-card rounded-lg border border-border transition-all duration-200 hover:shadow-soft hover:border-primary/30">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="font-display text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors leading-snug">
          {title}
        </h3>
        
        {/* Keyword-context excerpt from the edition body */}
        {searchQuery && snippet && (() => {
          const { text } = buildExcerpt(snippet, searchQuery);
          if (!text) return null;
          return (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {renderHighlighted(text, searchQuery)}
              </p>
            </div>
          );
        })()}

      </a>

        {/* Topics as scannable list with search highlighting */}
        {filteredTopics.length > 0 && (
          <div className="mt-3 space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">In this edition</span>
            <ul className="space-y-0.5">
              {visibleTopics.map((topic, index) => {
                const isMatch = searchQuery ? matchesQuery(topic, searchQuery) : false;
                const isOpen = expandedTopics.has(index);
                const excerpt = isOpen ? topicExcerpt(snippet, topic, filteredTopics) : '';
                return (
                  <li key={index} className="py-0.5">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleTopic(index);
                      }}
                      className={`flex h-auto whitespace-normal justify-start items-start gap-2 text-sm leading-snug text-left w-full rounded hover:bg-muted/40 px-1 -mx-1 transition-colors ${
                        isMatch ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <ChevronDown className={`w-3 h-3 mt-1 flex-shrink-0 ${isMatch ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      ) : (
                        <ChevronRight className={`w-3 h-3 mt-1 flex-shrink-0 ${isMatch ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      )}
                      <Hash className={`w-3 h-3 mt-1 flex-shrink-0 ${isMatch ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      <span className="flex-1">{topic}</span>
                    </Button>
                    {isOpen && (
                      <div className="mt-1 ml-7 pl-3 border-l-2 border-primary/20">
                        {excerpt ? (
                          <p className="text-sm text-foreground/80 leading-relaxed py-1">
                            {searchQuery ? renderHighlighted(excerpt, searchQuery) : excerpt}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/70 italic py-1">
                            No detailed excerpt found for this topic in the edition.
                          </p>
                        )}
                        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline py-1">
                          Read this edition <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
              {filteredTopics.length > 8 && (
                <li className="text-xs text-muted-foreground/60 pl-5">
                  <Button variant="link" size="sm" onClick={() => setShowAllTopics(value => !value)} className="h-auto px-0 py-1">
                    {showAllTopics ? 'Fewer topics' : `+${filteredTopics.length - 8} more topics`}
                  </Button>
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
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <ExternalLink className="w-4 h-4" />
            Read edition
          </a>
        </div>
    </article>
  );
};
