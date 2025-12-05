"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function SubPrayerCard({
  subPrayer,
  index,
  prayerName,
  isChecked,
  isDisabled,
  onToggle,
}) {
  const isFarzCheckbox = subPrayer.includes("Farz");
  
  // Extract rakat count and type from subPrayer name
  const parts = subPrayer.split(" ");
  const rakatCount = parseInt(parts[0]);
  const rakatType = parts.slice(1).join(" ");

  return (
    <div
      onClick={() => {
        if (!isDisabled) {
          onToggle();
        }
      }}
      className={cn(
        "flex items-center justify-between gap-3 bg-muted/30 rounded-md px-3 py-2.5",
        !isDisabled &&
          "cursor-pointer hover:bg-muted/40 transition-colors"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs px-2.5 py-1 rounded-md font-medium",
            isFarzCheckbox
              ? "bg-muted text-foreground"
              : "bg-muted/70 text-muted-foreground"
          )}
        >
          {rakatType}
        </span>
        <span className="text-sm text-foreground">
          {rakatCount} Rakats
        </span>
      </div>
      <Checkbox
        id={`${subPrayer}-${index}`}
        checked={isChecked}
        disabled={isDisabled}
        onCheckedChange={(checked) => {
          if (!isDisabled) {
            onToggle();
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

