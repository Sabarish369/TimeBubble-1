import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-40 h-40", className)}>
      <div className="bubble-loader-bubble"></div>
      <div className="bubble-loader-bubble"></div>
      <div className="bubble-loader-bubble"></div>
      <div className="bubble-loader-bubble"></div>
      <div className="bubble-loader-bubble"></div>
    </div>
  );
}
