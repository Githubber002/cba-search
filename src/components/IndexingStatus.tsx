import { useState } from 'react';
import { RefreshCw, Database, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IndexingStatusProps {
  articleCount: number;
  onIndexComplete: () => void;
}

export const IndexingStatus = ({ articleCount, onIndexComplete }: IndexingStatusProps) => {
  const [isIndexing, setIsIndexing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'indexing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const handleIndex = async () => {
    setIsIndexing(true);
    setStatus('indexing');
    
    let startEdition = 1;
    let totalIndexed = 0;
    const batchSize = 30;

    try {
      // Keep fetching batches until done
      while (true) {
        setProgress(`Editions ${startEdition}-${Math.min(startEdition + batchSize - 1, 127)}...`);
        
        const { data, error } = await supabase.functions.invoke('index-articles', {
          body: { startEdition, batchSize }
        });

        if (error) throw error;

        totalIndexed += data.indexed;
        
        if (!data.hasMore) {
          break;
        }
        
        startEdition = data.nextStartEdition;
      }

      setStatus('success');
      setProgress('');
      toast({
        title: 'Indexing complete',
        description: `Successfully indexed ${totalIndexed} articles across all editions`,
      });
      onIndexComplete();
    } catch (error) {
      console.error('Indexing error:', error);
      setStatus('error');
      setProgress('');
      toast({
        title: 'Indexing failed',
        description: 'Could not index articles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-card border-2 border-border">
      <div className="flex items-center gap-1.5 sm:gap-2 font-body text-sm sm:text-lg text-muted-foreground uppercase">
        <Database className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>{articleCount} indexed</span>
      </div>
      
      <button
        onClick={handleIndex}
        disabled={isIndexing}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 font-body text-sm sm:text-lg uppercase bg-secondary text-secondary-foreground border-2 border-border transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {status === 'indexing' ? (
          <>
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            <span className="hidden sm:inline">{progress || 'Indexing...'}</span>
            <span className="sm:hidden">...</span>
          </>
        ) : status === 'success' ? (
          <>
            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
            <span className="hidden sm:inline">Updated</span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
            Retry
          </>
        ) : (
          <>
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Re-index</span>
            <span className="sm:hidden">Index</span>
          </>
        )}
      </button>
    </div>
  );
};
