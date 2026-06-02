import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Card className="max-w-md">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium">Failed to load</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
          <Button onClick={onRetry} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
