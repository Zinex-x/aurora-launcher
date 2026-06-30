import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassPanel({
  className,
  strong,
  ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cn(
        strong ? "glass-panel-strong" : "glass-panel",
        "rounded-2xl",
        className,
      )}
      {...props}
    />
  );
}
