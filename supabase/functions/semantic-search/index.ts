import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function generateSummary(query: string, results: any[], lovableApiKey: string): Promise<string | null> {
  if (!lovableApiKey || results.length === 0) return null;
  
  try {
    const context = results.slice(0, 5).map((r, i) => 
      `Article ${i+1}: "${r.title}"\n${r.content.slice(0, 500)}`
    ).join('\n\n');

    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are an expert summarizer for a cross-border e-commerce newsletter archive. Given a search query and matching articles, write a concise 2-3 sentence synthesis that directly answers the query using insights from the articles. Be specific and actionable. Do not mention article numbers or titles.`
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nMatching articles:\n${context}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    }
  } catch (e) {
    console.error('Summary generation error:', e);
  }
  return null;
}

async function findRelatedArticles(results: any[], allArticles: any[]): Promise<any[]> {
  if (results.length === 0) return [];
  
  const resultIds = new Set(results.map(r => r.id));
  const resultTopics = new Set<string>();
  results.forEach(r => (r.topics || []).forEach((t: string) => resultTopics.add(t.toLowerCase())));
  
  if (resultTopics.size === 0) return [];
  
  const scored = allArticles
    .filter(a => !resultIds.has(a.id))
    .map(article => {
      const articleTopics = (article.topics || []).map((t: string) => t.toLowerCase());
      const overlap = articleTopics.filter((t: string) => resultTopics.has(t)).length;
      return { ...article, relevance: overlap / Math.max(resultTopics.size, 1) };
    })
    .filter(a => a.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4);
  
  return scored;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Searching for: ${query}`);

    // Fetch all articles
    const { data: articles, error: dbError } = await supabase
      .from('articles')
      .select('*')
      .order('published_date', { ascending: false });

    if (dbError) throw dbError;

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const queryLower = query.toLowerCase();

    // FIRST: Find all articles with direct keyword matches (these should always be included)
    const directMatches = articles.filter(article => {
      const searchText = `${article.title} ${article.subtitle || ''} ${article.content} ${(article.topics || []).join(' ')}`.toLowerCase();
      return searchText.includes(queryLower);
    });

    console.log(`Found ${directMatches.length} direct keyword matches for "${query}"`);

    // If we have direct matches, prioritize them
    if (directMatches.length > 0) {
      // Score direct matches based on frequency and position
      const scoredMatches = directMatches.map(article => {
        const searchText = `${article.title} ${article.subtitle || ''} ${article.content} ${(article.topics || []).join(' ')}`.toLowerCase();
        const titleText = article.title.toLowerCase();
        const topicsText = (article.topics || []).join(' ').toLowerCase();
        
        let score = 0.5; // Base score for having a match
        
        // Count occurrences
        const occurrences = (searchText.match(new RegExp(queryLower, 'g')) || []).length;
        score += Math.min(occurrences * 0.1, 0.3);
        
        // Title match bonus
        if (titleText.includes(queryLower)) {
          score += 0.3;
        }
        
        // Topics match bonus
        if (topicsText.includes(queryLower)) {
          score += 0.2;
        }
        
        return { ...article, relevance: Math.min(score, 1) };
      }).sort((a, b) => b.relevance - a.relevance);

      // If we have enough direct matches, generate summary + related and return
      if (scoredMatches.length >= 3) {
        const finalResults = scoredMatches.slice(0, 10);
        const [summary, related] = await Promise.all([
          generateSummary(query, finalResults, lovableApiKey || ''),
          findRelatedArticles(finalResults, articles)
        ]);
        return new Response(
          JSON.stringify({ success: true, results: finalResults, summary, related }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If we have the AI API key and need more results, use semantic search
    if (lovableApiKey) {
      console.log('Using AI for semantic ranking...');
      
      // Create article summaries for AI ranking - include topics and more content
      const articleSummaries = articles.map((a, i) => {
        const topics = a.topics && a.topics.length > 0 ? `Topics: ${a.topics.join(', ')}` : '';
        return `[${i}] "${a.title}"${a.subtitle ? ` - ${a.subtitle}` : ''}\n${topics}\nContent: ${a.content.slice(0, 400)}...`;
      }).join('\n\n');

      const aiResponse = await fetch(LOVABLE_AI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `You are a search ranking assistant. Given a search query and a list of articles, return the indices of the most relevant articles in order of relevance. 

IMPORTANT: 
- If the search query contains a specific term or name, prioritize articles that mention that exact term
- Also consider synonyms, related concepts, and semantic meaning
- Look at both the topics list AND the content for matches

Return ONLY a JSON array of objects with "index" (the article number) and "score" (relevance from 0-1). Return up to 10 most relevant articles. Example response format:
[{"index": 3, "score": 0.95}, {"index": 7, "score": 0.82}]

If no articles are relevant, return an empty array: []`
            },
            {
              role: 'user',
              content: `Search query: "${query}"\n\nArticles:\n${articleSummaries}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || '';
        
        try {
          const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const rankings = JSON.parse(jsonMatch[0]);
            
            let rankedResults = rankings
              .filter((r: any) => r.index >= 0 && r.index < articles.length)
              .map((r: any) => ({
                ...articles[r.index],
                relevance: r.score
              }));

            // Merge with direct matches (direct matches get priority)
            if (directMatches.length > 0) {
              const directMatchIds = new Set(directMatches.map(a => a.id));
              const aiOnlyResults = rankedResults.filter((r: any) => !directMatchIds.has(r.id));
              
              const scoredDirectMatches = directMatches.map(article => {
                const existingRank = rankedResults.find((r: any) => r.id === article.id);
                return { 
                  ...article, 
                  relevance: existingRank ? Math.max(existingRank.relevance, 0.9) : 0.9 
                };
              });
              
              rankedResults = [...scoredDirectMatches, ...aiOnlyResults].slice(0, 10);
            }

            console.log(`Returning ${rankedResults.length} results (${directMatches.length} direct matches)`);
            
            const [summary, related] = await Promise.all([
              generateSummary(query, rankedResults, lovableApiKey || ''),
              findRelatedArticles(rankedResults, articles)
            ]);
            return new Response(
              JSON.stringify({ success: true, results: rankedResults, summary, related }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
        }
      } else {
        console.error('AI request failed:', await aiResponse.text());
      }
    }

    // Fallback to basic text search
    console.log('Using fallback text search...');
    const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
    
    const scoredArticles = articles.map(article => {
      const searchText = `${article.title} ${article.subtitle || ''} ${article.content} ${(article.topics || []).join(' ')}`.toLowerCase();
      let score = 0;
      
      // Exact phrase match (high priority)
      if (searchText.includes(queryLower)) {
        score += 0.6;
      }
      
      // Individual word matches
      for (const word of queryWords) {
        if (searchText.includes(word)) {
          score += 0.15;
        }
        if (article.title.toLowerCase().includes(word)) {
          score += 0.2;
        }
        if ((article.topics || []).join(' ').toLowerCase().includes(word)) {
          score += 0.15;
        }
      }
      
      return { ...article, relevance: Math.min(score, 1) };
    })
    .filter(a => a.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10);

    const [summary, related] = await Promise.all([
      generateSummary(query, scoredArticles, lovableApiKey || ''),
      findRelatedArticles(scoredArticles, articles)
    ]);
    return new Response(
      JSON.stringify({ success: true, results: scoredArticles, summary, related }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
