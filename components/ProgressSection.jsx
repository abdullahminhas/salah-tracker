"use client";

import { Separator } from "@/components/ui/separator";
import { PrayerCompletion } from "./PrayerCompletion";
import { Last7DaysProgress } from "./Last7DaysProgress";

export function ProgressSection({
  getPrayerCompletion,
  getTotalCompletion,
  last7Days,
  showJumma = false,
  isFriday = false,
}) {
  return (
    <div className="flex flex-col gap-8">
      <PrayerCompletion
        getPrayerCompletion={getPrayerCompletion}
        getTotalCompletion={getTotalCompletion}
        showJumma={showJumma}
        isFriday={isFriday}
      />
      <Separator />
      <Last7DaysProgress last7Days={last7Days} />
    </div>
  );
}

