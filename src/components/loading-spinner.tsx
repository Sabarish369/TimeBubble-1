
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div className="bubble-loader-dot" />
      <div className="bubble-loader-dot" />
      <div className="bubble-loader-dot" />
    </div>
  );
}
