import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUBSTACK_ARCHIVE_URL = 'https://www.crossborderalex.com/archive';

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

    console.log('Fetching archive page...');
    
    // Fetch the archive page
    const archiveResponse = await fetch(SUBSTACK_ARCHIVE_URL);
    const archiveHtml = await archiveResponse.text();

    // Extract article URLs from the archive (exclude /comments pages)
    const articleUrlMatches = archiveHtml.matchAll(/href="(https:\/\/www\.crossborderalex\.com\/p\/[^"]+)"/g);
    const articleUrls = [...new Set([...articleUrlMatches].map(m => m[1]))]
      .filter(url => !url.endsWith('/comments'));
    
    // Clean up any existing comment URLs from database
    await supabase
      .from('articles')
      .delete()
      .like('url', '%/comments');

    console.log(`Found ${articleUrls.length} article URLs`);

    const articles: Article[] = [];
    
    // Fetch each article (limit to prevent timeout)
    const urlsToProcess = articleUrls.slice(0, 50);
    
    for (const url of urlsToProcess) {
      try {
        console.log(`Fetching: ${url}`);
        const articleResponse = await fetch(url);
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

        // Extract body content - get text from post body
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
          
          // Remove common greeting/intro patterns
          content = content
            .replace(/^(Goodmorning|Good morning|Hello|Hi|Hey|everyone)!?\s*/gi, '')
            .replace(/^!+\s*/g, '') // Remove leading exclamation marks
            .replace(/^my friends!?\s*/gi, '')
            .replace(/^another weekend[^:]*:\s*/gi, '')
            .replace(/^time for your weekly newsletter[^:]*:\s*/gi, '')
            .replace(/I wish you a great start of the day\.?\s*/gi, '')
            .replace(/I booked my ticket[^.!]*[.!]\s*/gi, '')
            .replace(/I hope to travel[^.!]*[.!]\s*/gi, '')
            .replace(/so stay tuned\.?\s*/gi, '')
            .replace(/Now let's get on with the newsletter:?\s*/gi, '')
            .replace(/Welcome back!?\s*/gi, '')
            .replace(/Thanks for reading[^!]*!?\s*/gi, '')
            .replace(/Subscribe for free[^.]*\.?\s*/gi, '')
            .replace(/Inspiration from across the world[^.]*\.?\s*/gi, '')
            .replace(/Here is your weekly newsletter[^.!]*[.!]\s*/gi, '')
            .replace(/All topics I like personally\.?\s*/gi, '')
            .replace(/I hope you enjoy reading[^.!]*[.!]\s*/gi, '')
            .replace(/I hope you all enjoyed[^.!]*[.!]\s*/gi, '')
            .replace(/On to the new year[^.!]*[.!]\s*/gi, '')
            .replace(/Looking forward!?\s*/gi, '')
            .replace(/Hope to make some nice[^.!]*[.!]\s*/gi, '')
            .replace(/Let's start:?\s*/gi, '')
            .replace(/I had a busy[^.!]*[.!]\s*/gi, '')
            .replace(/so a little delay[^.!]*[.!]\s*/gi, '')
            .replace(/But I managed to write[^.!]*[.!]\s*/gi, '')
            .replace(/Thank you!?\s*/gi, '')
            .replace(/so in March I will show you how it's there!?\s*/gi, '')
            .replace(/Subscribe\s*/g, '')
            .replace(/^everyone!\s*/gi, '')
            .trim();
        }

        // Extract H4 headings as topics (strip emojis at start)
        const h4Matches = articleHtml.matchAll(/<h4[^>]*>([^<]+)<\/h4>/gi);
        const topics = [...h4Matches]
          .map(m => m[1].trim())
          .filter(t => t.length > 3 && t.length < 200)
          .map(t => {
            let cleaned = t
              .replace(/&amp;/g, '&')
              .replace(/&nbsp;/g, ' ')
              .replace(/&#\d+;/g, '') // Remove HTML numeric entities
              // Remove unicode escape patterns like \uD83C or uD83C
              .replace(/\\?u[0-9A-Fa-f]{4}/g, '')
              // Remove any leading non-ASCII or non-letter chars  
              .replace(/^[^a-zA-Z0-9]+/, '')
              .trim();
            return cleaned;
          })
          .filter(t => t.length > 3 && !t.toLowerCase().includes('discussion about'));

        // Fallback: extract from meta description
        if (!content || content.length < 100) {
          const metaMatch = articleHtml.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
          if (metaMatch) {
            content = metaMatch[1];
          }
        }

        // Additional fallback: get og:description
        if (!content || content.length < 100) {
          const ogMatch = articleHtml.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
          if (ogMatch) {
            content = ogMatch[1];
          }
        }

        // Extract images from article (substack media URLs)
        const imgMatches = articleHtml.matchAll(/<img[^>]*src="(https:\/\/substackcdn\.com\/image\/fetch\/[^"]+)"/gi);
        const images = [...new Set([...imgMatches].map(m => m[1]))]
          .filter(img => !img.includes('avatar') && !img.includes('logo') && !img.includes('40,h_40'))
          .slice(0, 3); // Limit to 3 images per article

        if (title && content && content.length > 50) {
          articles.push({
            url,
            title,
            subtitle,
            content: content.slice(0, 5000), // Limit content size
            published_date,
            topics,
            images
          });
        }
      } catch (articleError) {
        console.error(`Error fetching ${url}:`, articleError);
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

    console.log(`Indexed ${indexed} articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        found: articleUrls.length,
        processed: articles.length,
        indexed 
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
