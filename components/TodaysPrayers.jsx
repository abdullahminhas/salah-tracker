"use client";

import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PrayerAccordion } from "./PrayerAccordion";

export function TodaysPrayers({
  madhab,
  setMadhab,
  cityName,
  locationError,
  progress,
  prayers,
  currentPrayer,
  openAccordion,
  subPrayers,
  getPrayerCompletion,
  isFarzChecked,
  isBeforeFarz,
  onAccordionChange,
  onToggleSubPrayer,
  onToggleTahajjud,
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            <b suppressHydrationWarning>{madhab ?? "Hanbali"}</b> madhhab prayer times
          </p>
        </div>
        {cityName && (
          <div className="text-sm text-muted-foreground">
            City:{" "}
            <span className="font-medium text-foreground">{cityName}</span>
          </div>
        )}
      </div>
      {locationError && (
        <div className="text-sm text-muted-foreground">{locationError}</div>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-foreground">Today's Prayers</h1>
        <p className="text-base text-muted-foreground">
          Select the prayers that you have prayed yet.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
      <Separator />
      <PrayerAccordion
        prayers={prayers}
        currentPrayer={currentPrayer}
        openAccordion={openAccordion}
        subPrayers={subPrayers}
        getPrayerCompletion={getPrayerCompletion}
        isFarzChecked={isFarzChecked}
        isBeforeFarz={isBeforeFarz}
        onAccordionChange={onAccordionChange}
        onToggleSubPrayer={onToggleSubPrayer}
        onToggleTahajjud={onToggleTahajjud}
      />
    </div>
  );
}

