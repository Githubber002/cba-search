import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

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

    // If we have the AI API key, use semantic search
    if (lovableApiKey) {
      console.log('Using AI for semantic ranking...');
      
      // Create article summaries for AI ranking
      const articleSummaries = articles.map((a, i) => 
        `[${i}] "${a.title}"${a.subtitle ? ` - ${a.subtitle}` : ''}: ${a.content.slice(0, 200)}...`
      ).join('\n\n');

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
              content: `You are a search ranking assistant. Given a search query and a list of articles, return the indices of the most relevant articles in order of relevance. Consider synonyms, related concepts, and semantic meaning - not just exact keyword matches.

For example, if someone searches for "global expansion" also consider articles about "international growth", "entering new markets", "cross-border commerce", etc.

Return ONLY a JSON array of objects with "index" (the article number) and "score" (relevance from 0-1). Return the top 10 most relevant articles. Example response format:
[{"index": 3, "score": 0.95}, {"index": 7, "score": 0.82}]`
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
        
        // Parse the AI response
        try {
          // Extract JSON from the response
          const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const rankings = JSON.parse(jsonMatch[0]);
            
            const rankedResults = rankings
              .filter((r: any) => r.index >= 0 && r.index < articles.length)
              .map((r: any) => ({
                ...articles[r.index],
                relevance: r.score
              }));

            console.log(`AI ranked ${rankedResults.length} results`);
            
            return new Response(
              JSON.stringify({ success: true, results: rankedResults }),
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
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
    
    const scoredArticles = articles.map(article => {
      const searchText = `${article.title} ${article.subtitle || ''} ${article.content}`.toLowerCase();
      let score = 0;
      
      // Exact phrase match
      if (searchText.includes(queryLower)) {
        score += 0.5;
      }
      
      // Individual word matches
      for (const word of queryWords) {
        if (searchText.includes(word)) {
          score += 0.1;
        }
        // Title match is more important
        if (article.title.toLowerCase().includes(word)) {
          score += 0.2;
        }
      }
      
      return { ...article, relevance: Math.min(score, 1) };
    })
    .filter(a => a.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10);

    return new Response(
      JSON.stringify({ success: true, results: scoredArticles }),
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
