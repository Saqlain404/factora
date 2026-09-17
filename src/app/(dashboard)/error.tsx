"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={
          <>
            An error occurred while loading the dashboard. Your data is safe — try again.
            {error.digest ? (
              <span className="mt-2 block text-xs text-muted-foreground">
                Error ID: <span className="num">{error.digest}</span>
              </span>
            ) : null}
          </>
        }
        action={
          <Button onClick={reset} variant="outline">
            <RotateCcw aria-hidden />
            Try Again
          </Button>
        }
      />
    </div>
  );
}