# Architecture rules
- Share pure search-text helpers between the search function and results UI in `supabase/functions/_shared/search-text.ts` so passage selection and query matching stay consistent.
- Guard asynchronous search responses against query changes so older responses cannot replace the current results.
- Run full-text search on the keyword form of a query (conversational filler stripped), falling back to editions covering most keywords before AI ranking, so natural-language questions still hit the right editions.
- Read publish dates from Substack structured data (datePublished), since the legacy datetime attribute is missing on most pages.
