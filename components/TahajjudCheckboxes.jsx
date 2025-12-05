"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export function TahajjudCheckboxes({ subPrayers, onToggle }) {
  // Calculate the highest checked index to determine total rakats offered
  const highestCheckedIndex = useMemo(() => {
    let highest = -1;
    for (let i = 0; i < 6; i++) {
      const tahajjudKey = `tahajjud-${i}`;
      if (subPrayers?.[tahajjudKey]) {
        highest = i;
      }
    }
    return highest;
  }, [subPrayers]);

  // Calculate total rakats offered (highest index + 1) * 2
  const totalRakats = highestCheckedIndex >= 0 ? (highestCheckedIndex + 1) * 2 : 0;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between gap-3 bg-muted/30 rounded-md px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-muted/70 text-muted-foreground">
            Nafl
          </span>
          <span className="text-sm text-foreground">
            {totalRakats > 0 ? `${totalRakats} Rakats offered` : "Upto 12 Rakats"}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, index) => {
            const tahajjudKey = `tahajjud-${index}`;
            const isChecked = subPrayers?.[tahajjudKey] || false;
            return (
              <Checkbox
                key={tahajjudKey}
                id={tahajjudKey}
                checked={isChecked}
                onCheckedChange={() => {
                  onToggle(index);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

