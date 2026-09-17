"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
          <div className="text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-heading text-xl font-semibold tracking-tight text-foreground">
              Something went wrong
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              An unexpected error occurred. Please try again — your data is safe.
            </p>
            {error.digest ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Error ID: <span className="num">{error.digest}</span>
              </p>
            ) : null}
            <Button className="mt-6" onClick={reset} variant="outline">
              <RotateCcw aria-hidden />
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}