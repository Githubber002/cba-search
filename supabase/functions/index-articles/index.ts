import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-ed';
const TOTAL_EDITIONS = 127;

interface Article {
  url: string;
  title: string;
  subtitle: string | null;
  content: string;
  published_date: string | null;
  topics: string[];
  images: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for batch processing
    let startEdition = 1;
    let batchSize = 30; // Process 30 at a time to avoid timeout
    
    try {
      const body = await req.json();
      if (body.startEdition) startEdition = body.startEdition;
      if (body.batchSize) batchSize = body.batchSize;
    } catch {
      // No body, use defaults
    }

    const endEdition = Math.min(startEdition + batchSize - 1, TOTAL_EDITIONS);
    
    console.log(`Indexing editions ${startEdition} to ${endEdition}...`);

    // Generate URLs for this batch
    const articleUrls: string[] = [];
    for (let i = startEdition; i <= endEdition; i++) {
      articleUrls.push(`${BASE_URL}${i}`);
    }

    console.log(`Processing ${articleUrls.length} article URLs`);

    const articles: Article[] = [];
    
    // Process articles in parallel batches of 5 for speed
    const parallelBatchSize = 5;
    for (let i = 0; i < articleUrls.length; i += parallelBatchSize) {
      const batch = articleUrls.slice(i, i + parallelBatchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (url) => {
          try {
            console.log(`Fetching: ${url}`);
            const articleResponse = await fetch(url);
            
            if (!articleResponse.ok) {
              console.log(`Skipping ${url} - status ${articleResponse.status}`);
              return null;
            }
            
            const articleHtml = await articleResponse.text();

            // Extract title
            const titleMatch = articleHtml.match(/<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                              articleHtml.match(/<title>([^<|]+)/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

            // Extract subtitle
            const subtitleMatch = articleHtml.match(/<h3[^>]*class="[^"]*subtitle[^"]*"[^>]*>([^<]+)<\/h3>/i);
            const subtitle = subtitleMatch ? subtitleMatch[1].trim() : null;

            // Extract date
            const dateMatch = articleHtml.match(/datetime="(\d{4}-\d{2}-\d{2})/);
            const published_date = dateMatch ? dateMatch[1] : null;

            // Extract body content
            const bodyMatch = articleHtml.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<div/i);
            let content = '';
            
            if (bodyMatch) {
              content = bodyMatch[1]
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim();
              
              // Clean up common patterns
              content = content
                .replace(/^(Goodmorning|Good morning|Hello|Hi|Hey|everyone)!?\s*/gi, '')
                .replace(/^!+\s*/g, '')
                .replace(/^my friends!?\s*/gi, '')
                .replace(/Thanks for reading[^!]*!?\s*/gi, '')
                .replace(/Subscribe for free[^.]*\.?\s*/gi, '')
                .replace(/Subscribe\s*/g, '')
                .trim();
            }

            // Fallback: meta description
            if (!content || content.length < 100) {
              const metaMatch = articleHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
              if (metaMatch) content = metaMatch[1];
            }

            // Extract H4 headings as topics
            const h4Matches = articleHtml.matchAll(/<h4[^>]*>([^<]+)<\/h4>/gi);
            const topics = [...h4Matches]
              .map(m => m[1].trim())
              .filter(t => t.length > 3 && t.length < 200)
              .map(t => t
                .replace(/&amp;/g, '&')
                .replace(/&nbsp;/g, ' ')
                .replace(/&#\d+;/g, '')
                .replace(/\\?u[0-9A-Fa-f]{4}/g, '')
                .replace(/^[^a-zA-Z0-9]+/, '')
                .trim()
              )
              .filter(t => t.length > 3);

            // Extract images
            const imgMatches = articleHtml.matchAll(/<img[^>]*src="(https:\/\/substackcdn\.com\/image\/fetch\/[^"]+)"/gi);
            const images = [...new Set([...imgMatches].map(m => m[1]))]
              .filter(img => !img.includes('avatar') && !img.includes('logo') && !img.includes('40,h_40'))
              .slice(0, 3);

            if (title && content && content.length > 50) {
              return {
                url,
                title,
                subtitle,
                content: content.slice(0, 5000),
                published_date,
                topics,
                images
              };
            }
            return null;
          } catch (articleError) {
            console.error(`Error fetching ${url}:`, articleError);
            return null;
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          articles.push(result.value);
        }
      }
    }

    console.log(`Successfully parsed ${articles.length} articles`);

    // Upsert articles to database
    let indexed = 0;
    for (const article of articles) {
      const { error } = await supabase
        .from('articles')
        .upsert(article, { onConflict: 'url' });
      
      if (!error) {
        indexed++;
      } else {
        console.error(`Error upserting article:`, error);
      }
    }

    console.log(`Indexed ${indexed} articles in this batch`);

    const hasMore = endEdition < TOTAL_EDITIONS;
    const nextStartEdition = hasMore ? endEdition + 1 : null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        batch: { start: startEdition, end: endEdition },
        processed: articles.length,
        indexed,
        hasMore,
        nextStartEdition,
        totalEditions: TOTAL_EDITIONS
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Indexing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
