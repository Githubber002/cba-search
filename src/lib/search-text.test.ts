import { describe, expect, it } from 'vitest';
import { buildExcerpt, hasValidCitations, matchesQuery, queryTerms, topicExcerpt } from '../../supabase/functions/_shared/search-text';

describe('query-focused search passages', () => {
  it('ignores question filler while retaining short domain acronyms', () => {
    expect(queryTerms('How can AI help brands in Vietnam?')).toEqual(['ai', 'help', 'brands', 'vietnam']);
  });
  it('does not match AI inside unrelated words', () => {
    expect(matchesQuery('Retail supply chains', 'AI')).toBe(false);
    expect(matchesQuery('AI for retailers', 'AI')).toBe(true);
  });
  it('prefers a passage covering multiple query concepts over an early single mention', () => {
    const content = 'Vietnam. ' + 'Other market news. '.repeat(40) + 'Vietnam retailers use TikTok Shop to reach new customers. ';
    const excerpt = buildExcerpt(content, 'How do Vietnam retailers use TikTok Shop?', 150);
    expect(excerpt.matched).toBe(true);
    expect(excerpt.text).toContain('Vietnam retailers use TikTok Shop');
    expect(excerpt.text.length).toBeLessThanOrEqual(152);
  });
  it('shows a topic’s prose without the following topic', () => {
    expect(topicExcerpt('Vietnam retail Vietnam shops offer same-day delivery. China payments Alipay grows.', 'Vietnam retail', ['Vietnam retail', 'China payments'])).toBe('Vietnam shops offer same-day delivery.');
  });
  it('requires citations that reference the supplied sources', () => {
    expect(hasValidCitations('Vietnam stores grow [1][2].', 2)).toBe(true);
    expect(hasValidCitations('Vietnam stores grow [3].', 2)).toBe(false);
    expect(hasValidCitations('Vietnam stores grow.', 2)).toBe(false);
    expect(hasValidCitations('Vietnam stores grow [0].', 2)).toBe(false);
  });
});