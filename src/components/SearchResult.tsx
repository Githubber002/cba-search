import { Calendar, ChevronDown, ChevronRight, ExternalLink, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

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

const getQueryWords = (query: string): string[] =>
  query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);

const highlightMatch = (text: string, query: string): boolean => {
  if (!query) return false;
  const lowerText = text.toLowerCase();
  return getQueryWords(query).some(word => lowerText.includes(word));
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Find a ~window-char excerpt around the first match of any query word in content. */
const buildExcerpt = (content: string, query: string, window = 320): { text: string; matched: boolean } => {
  if (!content) return { text: '', matched: false };
  const clean = content.replace(/\s+/g, ' ').trim();
  const words = getQueryWords(query);
  const lower = clean.toLowerCase();
  let idx = -1;
  let matchLen = 0;
  for (const w of words) {
    const i = lower.indexOf(w);
    if (i !== -1 && (idx === -1 || i < idx)) {
      idx = i;
      matchLen = w.length;
    }
  }
  if (idx === -1) {
    return { text: clean.slice(0, window).trim() + (clean.length > window ? '…' : ''), matched: false };
  }
  const half = Math.floor((window - matchLen) / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(clean.length, idx + matchLen + half);
  let excerpt = clean.slice(start, end).trim();
  if (start > 0) excerpt = '…' + excerpt;
  if (end < clean.length) excerpt = excerpt + '…';
  return { text: excerpt, matched: true };
};

const renderHighlighted = (text: string, query: string) => {
  const words = getQueryWords(query);
  if (words.length === 0) return text;
  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-accent/20 text-foreground font-semibold rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
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
  const filteredTopics = topics?.filter(t => t.toLowerCase() !== 'discussion about this post') || [];

  const toggleTopic = (i: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  /** Build an excerpt around the topic's first occurrence in the content. */
  const buildTopicExcerpt = (topic: string, window = 360): string => {
    if (!snippet) return '';
    const clean = snippet.replace(/\s+/g, ' ').trim();
    const lower = clean.toLowerCase();
    // Try the full topic, then progressively shorter prefixes / key words.
    const candidates = [topic, ...topic.split(/[,:;–-]/).map(s => s.trim()).filter(Boolean)];
    let idx = -1;
    let matchLen = 0;
    for (const c of candidates) {
      const lc = c.toLowerCase();
      if (lc.length < 4) continue;
      const i = lower.indexOf(lc);
      if (i !== -1) { idx = i; matchLen = lc.length; break; }
    }
    if (idx === -1) {
      // Fallback: longest word from topic ≥5 chars
      const words = topic.split(/\s+/).filter(w => w.length >= 5).sort((a, b) => b.length - a.length);
      for (const w of words) {
        const i = lower.indexOf(w.toLowerCase());
        if (i !== -1) { idx = i; matchLen = w.length; break; }
      }
    }
    if (idx === -1) return '';
    const half = Math.floor((window - matchLen) / 2);
    const start = Math.max(0, idx - half);
    const end = Math.min(clean.length, idx + matchLen + half);
    let excerpt = clean.slice(start, end).trim();
    if (start > 0) excerpt = '…' + excerpt;
    if (end < clean.length) excerpt = excerpt + '…';
    return excerpt;
  };

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
        
        {/* Keyword-context excerpt from the edition body */}
        {searchQuery && snippet && (() => {
          const { text, matched } = buildExcerpt(snippet, searchQuery);
          if (!text) return null;
          return (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {renderHighlighted(text, searchQuery)}
              </p>
            </div>
          );
        })()}

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
