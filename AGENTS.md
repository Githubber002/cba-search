# Architecture rules
- Share pure search-text helpers between the search function and results UI in `supabase/functions/_shared/search-text.ts` so passage selection and query matching stay consistent.
- Guard asynchronous search responses against query changes so older responses cannot replace the current results.