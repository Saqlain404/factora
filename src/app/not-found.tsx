import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="text-center">
        <p className="num font-heading text-6xl font-bold tracking-tight text-primary/80">404</p>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          Page not found
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button className="mt-6" render={<Link href="/dashboard" />}>
          <ArrowLeft aria-hidden />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}