"use client";

import { Accordion } from "@/components/ui/accordion";
import { PrayerItem } from "./PrayerItem";

export function PrayerAccordion({
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
    <Accordion
      type="single"
      collapsible
      value={openAccordion}
      onValueChange={onAccordionChange}
      className="w-full space-y-0"
    >
      {prayers.map((prayer) => {
        const completion = getPrayerCompletion(prayer.name);
        const isCurrentPrayer =
          currentPrayer &&
          currentPrayer.toLowerCase() === prayer.name.toLowerCase();

        return (
          <PrayerItem
            key={prayer.name}
            prayer={prayer}
            isCurrentPrayer={isCurrentPrayer}
            completion={completion}
            openAccordion={openAccordion}
            subPrayers={subPrayers}
            isFarzChecked={isFarzChecked}
            isBeforeFarz={isBeforeFarz}
            onAccordionChange={onAccordionChange}
            onToggleSubPrayer={onToggleSubPrayer}
            onToggleTahajjud={onToggleTahajjud}
          />
        );
      })}
    </Accordion>
  );
}

