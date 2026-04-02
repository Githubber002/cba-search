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

async function findRelatedArticles(results: any[], supabase: any): Promise<any[]> {
  if (results.length === 0) return [];
  
  const resultIds = new Set(results.map(r => r.id));
  const resultTopics = new Set<string>();
  results.forEach(r => (r.topics || []).forEach((t: string) => resultTopics.add(t.toLowerCase())));
  
  if (resultTopics.size === 0) return [];

  // Fetch a small set of recent articles for topic matching (not all)
  const { data: candidates } = await supabase
    .from('articles')
    .select('id, title, subtitle, url, published_date, topics')
    .order('published_date', { ascending: false })
    .limit(50);

  if (!candidates) return [];

  const scored = candidates
    .filter((a: any) => !resultIds.has(a.id))
    .map((article: any) => {
      const articleTopics = (article.topics || []).map((t: string) => t.toLowerCase());
      const overlap = articleTopics.filter((t: string) => resultTopics.has(t)).length;
      return { ...article, relevance: overlap / Math.max(resultTopics.size, 1) };
    })
    .filter((a: any) => a.relevance > 0)
    .sort((a: any, b: any) => b.relevance - a.relevance)
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

    // STEP 1: Use Postgres full-text search (fast, indexed)
    const { data: ftsResults, error: ftsError } = await supabase
      .rpc('search_articles', { search_query: query, max_results: 10 });

    if (ftsError) {
      console.error('FTS error:', ftsError);
    }

    const directMatches = (ftsResults || []).map((r: any) => ({
      ...r,
      relevance: Math.min(0.5 + r.rank * 2, 1) // Normalize rank to 0.5-1.0
    }));

    console.log(`FTS found ${directMatches.length} results for "${query}"`);

    // If we have enough FTS results, generate summary + related and return
    if (directMatches.length >= 3) {
      const [summary, related] = await Promise.all([
        generateSummary(query, directMatches, lovableApiKey || ''),
        findRelatedArticles(directMatches, supabase)
      ]);
      return new Response(
        JSON.stringify({ success: true, results: directMatches, summary, related }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 2: If FTS didn't find enough, use AI semantic search on titles+topics only (not full content)
    if (lovableApiKey) {
      console.log('FTS insufficient, using AI semantic ranking on titles...');
      
      // Only fetch titles, topics, and IDs — NOT full content
      const { data: articles, error: dbError } = await supabase
        .from('articles')
        .select('id, title, subtitle, topics')
        .order('published_date', { ascending: false });

      if (dbError) throw dbError;
      if (!articles || articles.length === 0) {
        return new Response(
          JSON.stringify({ success: true, results: directMatches, summary: null, related: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const articleSummaries = articles.map((a: any, i: number) => {
        const topics = a.topics?.length > 0 ? ` [${a.topics.join(', ')}]` : '';
        return `[${i}] "${a.title}"${a.subtitle ? ` - ${a.subtitle}` : ''}${topics}`;
      }).join('\n');

      const aiResponse = await fetch(LOVABLE_AI_URL, {
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
              content: `You are a search ranking assistant. Given a search query and article titles with topics, return the indices of the most relevant articles. Return ONLY a JSON array of objects with "index" and "score" (0-1). Up to 10 results. Example: [{"index": 3, "score": 0.95}]`
            },
            {
              role: 'user',
              content: `Query: "${query}"\n\nArticles:\n${articleSummaries}`
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || '';
        
        try {
          const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const rankings = JSON.parse(jsonMatch[0]);
            const matchedIds = rankings
              .filter((r: any) => r.index >= 0 && r.index < articles.length && r.score > 0.3)
              .map((r: any) => ({ id: articles[r.index].id, score: r.score }));

            if (matchedIds.length > 0) {
              // Fetch full content only for matched articles
              const { data: fullArticles } = await supabase
                .from('articles')
                .select('id, title, subtitle, content, url, published_date, topics, images')
                .in('id', matchedIds.map((m: any) => m.id));

              if (fullArticles) {
                const scoreMap = new Map(matchedIds.map((m: any) => [m.id, m.score]));
                const directMatchIds = new Set(directMatches.map((d: any) => d.id));
                
                let rankedResults = fullArticles.map((a: any) => ({
                  ...a,
                  relevance: scoreMap.get(a.id) || 0.5
                }));

                // Merge: direct matches get priority
                const aiOnly = rankedResults.filter((r: any) => !directMatchIds.has(r.id));
                rankedResults = [...directMatches, ...aiOnly]
                  .sort((a: any, b: any) => b.relevance - a.relevance)
                  .slice(0, 10);

                console.log(`Returning ${rankedResults.length} results (${directMatches.length} FTS + ${aiOnly.length} AI)`);
                
                const [summary, related] = await Promise.all([
                  generateSummary(query, rankedResults, lovableApiKey),
                  findRelatedArticles(rankedResults, supabase)
                ]);
                return new Response(
                  JSON.stringify({ success: true, results: rankedResults, summary, related }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
        }
      }
    }

    // Fallback: return whatever FTS found
    const [summary, related] = await Promise.all([
      generateSummary(query, directMatches, lovableApiKey || ''),
      findRelatedArticles(directMatches, supabase)
    ]);
    return new Response(
      JSON.stringify({ success: true, results: directMatches, summary, related }),
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
