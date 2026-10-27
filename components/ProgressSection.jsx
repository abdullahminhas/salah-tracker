"use client";

import { Separator } from "@/components/ui/separator";
import { PrayerCompletion } from "./PrayerCompletion";
import { Last7DaysProgress } from "./Last7DaysProgress";
import { BlurFade } from "@/components/ui/blur-fade";

export function ProgressSection({
  getPrayerCompletion,
  getTotalCompletion,
  last7Days,
  showJumma = false,
  isFriday = false,
  delay = 0.25,
}) {
  return (
    <div className="flex flex-col gap-8">
      <BlurFade delay={delay * 1.5} inView>
        <PrayerCompletion
          getPrayerCompletion={getPrayerCompletion}
          getTotalCompletion={getTotalCompletion}
          showJumma={showJumma}
          isFriday={isFriday}
        />
      </BlurFade>
      <Separator />
      <BlurFade delay={delay * 2} inView>
        <Last7DaysProgress last7Days={last7Days} />
      </BlurFade>
    </div>
  );
}
