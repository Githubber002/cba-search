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
  const { toast } = useToast();

  const handleIndex = async () => {
    setIsIndexing(true);
    setStatus('indexing');

    try {
      const { data, error } = await supabase.functions.invoke('index-articles');

      if (error) throw error;

      setStatus('success');
      toast({
        title: 'Indexing complete',
        description: `Successfully indexed ${data.indexed} articles`,
      });
      onIndexComplete();
    } catch (error) {
      console.error('Indexing error:', error);
      setStatus('error');
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
    <div className="flex items-center gap-4 px-4 py-3 bg-card border-2 border-border">
      <div className="flex items-center gap-2 font-body text-lg text-muted-foreground uppercase">
        <Database className="w-4 h-4" />
        <span>{articleCount} articles</span>
      </div>
      
      <button
        onClick={handleIndex}
        disabled={isIndexing}
        className="flex items-center gap-2 px-3 py-1.5 font-body text-lg uppercase bg-secondary text-secondary-foreground border-2 border-border transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {status === 'indexing' ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Indexing...
          </>
        ) : status === 'success' ? (
          <>
            <Check className="w-4 h-4 text-accent" />
            Updated
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4 text-destructive" />
            Retry
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Re-index
          </>
        )}
      </button>
    </div>
  );
};
