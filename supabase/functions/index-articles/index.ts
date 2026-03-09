import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-ed';
const TOTAL_EDITIONS = 132;

// Known URL exceptions (edition number -> full URL)
const URL_EXCEPTIONS: Record<number, string> = {
  1: 'https://www.crossborderalex.com/p/global-digital-marketing-retail-ed1',
  2: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail',
  3: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-075',
  5: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-722',
  11: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-584',
  17: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-c3a',
  19: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-5b7',
  73: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-ed73',
  109: 'https://www.crossborderalex.com/p/global-digital-marketing-and-retail-ed109109',
};

// Editions that use ed-{n} pattern (with hyphen)
const HYPHENATED_EDITIONS = new Set([
  ...Array.from({ length: 21 }, (_, i) => 22 + i), // 22-42
  ...Array.from({ length: 5 }, (_, i) => 44 + i),  // 44-48
]);

interface Article {
  url: string;
  title: string;
  subtitle: string | null;
  content: string;
  published_date: string | null;
  topics: string[];
  images: string[];
}

// Generate all possible article URLs
function generateAllArticleUrls(): string[] {
  const urls: string[] = [];
  
  for (let i = 1; i <= TOTAL_EDITIONS; i++) {
    if (URL_EXCEPTIONS[i]) {
      urls.push(URL_EXCEPTIONS[i]);
    } else if (HYPHENATED_EDITIONS.has(i)) {
      urls.push(`${BASE_URL}-${i}`); // ed-22, ed-42, etc.
    } else {
      urls.push(`${BASE_URL}${i}`);
    }
  }
  
  console.log(`Generated ${urls.length} article URLs`);
  return urls;
}

// Parse a single article
async function parseArticle(url: string): Promise<Article | null> {
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`Skipping ${url} - status ${response.status}`);
      return null;
    }
    
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                      html.match(/<title>([^<|]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Extract subtitle
    const subtitleMatch = html.match(/<h3[^>]*class="[^"]*subtitle[^"]*"[^>]*>([^<]+)<\/h3>/i);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : null;

    // Extract date
    const dateMatch = html.match(/datetime="(\d{4}-\d{2}-\d{2})/);
    const published_date = dateMatch ? dateMatch[1] : null;

    // Extract body content
    const bodyMatch = html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<div/i);
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
      const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      if (metaMatch) content = metaMatch[1];
    }

    // Extract H4 headings as topics
    const h4Matches = html.matchAll(/<h4[^>]*>([^<]+)<\/h4>/gi);
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
    const imgMatches = html.matchAll(/<img[^>]*src="(https:\/\/substackcdn\.com\/image\/fetch\/[^"]+)"/gi);
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
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
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
    let startIndex = 0;
    let batchSize = 30;
    
    try {
      const body = await req.json();
      if (body.startIndex !== undefined) startIndex = body.startIndex;
      if (body.batchSize) batchSize = body.batchSize;
    } catch {
      // No body, use defaults
    }

    // Get all article URLs by generating them
    const allUrls = generateAllArticleUrls();
    const totalArticles = allUrls.length;
    
    if (totalArticles === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No article URLs generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const endIndex = Math.min(startIndex + batchSize, totalArticles);
    const batchUrls = allUrls.slice(startIndex, endIndex);
    
    console.log(`Processing batch ${startIndex}-${endIndex} of ${totalArticles} articles...`);

    const articles: Article[] = [];
    
    // Process articles in parallel batches of 5 for speed
    const parallelBatchSize = 5;
    for (let i = 0; i < batchUrls.length; i += parallelBatchSize) {
      const batch = batchUrls.slice(i, i + parallelBatchSize);
      const batchResults = await Promise.allSettled(
        batch.map((url: string) => parseArticle(url))
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

    const hasMore = endIndex < totalArticles;
    const nextStartIndex = hasMore ? endIndex : null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        batch: { start: startIndex, end: endIndex },
        processed: articles.length,
        indexed,
        hasMore,
        nextStartIndex,
        totalArticles
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
