import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string | null;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium">Failed to load license</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <Button onClick={onRetry} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
