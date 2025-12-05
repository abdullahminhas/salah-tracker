"use client";

import { CircularProgress } from "@/components/ui/circular-progress";
import { mainPrayers } from "./constants";
import { useMemo } from "react";

export function PrayerCompletion({
  getPrayerCompletion,
  getTotalCompletion,
  showJumma = false,
  isFriday = false,
}) {
  // Get effective main prayers list (Jumma instead of Dhuhr if enabled AND it's Friday)
  const effectiveMainPrayers = useMemo(() => {
    const shouldShowJumma = showJumma && isFriday;
    if (shouldShowJumma) {
      return mainPrayers.filter((p) => p !== "Dhuhr");
    }
    return mainPrayers.filter((p) => p !== "Jumma");
  }, [showJumma, isFriday]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-foreground">Prayer Completion</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        {effectiveMainPrayers.map((prayerName) => {
          const completion = getPrayerCompletion(prayerName);
          return (
            <div
              key={prayerName}
              className="flex flex-col items-center gap-3"
            >
              <CircularProgress value={completion} />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {prayerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completion}% Complete
                </p>
              </div>
            </div>
          );
        })}
        <div className="flex flex-col items-center gap-3">
          <CircularProgress value={getTotalCompletion()} />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Total</p>
            <p className="text-xs text-muted-foreground">
              {getTotalCompletion()}% Complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

