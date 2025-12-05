"use client";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { SubPrayerCard } from "./SubPrayerCard";
import { TahajjudCheckboxes } from "./TahajjudCheckboxes";
import { prayerSubPrayers } from "./constants";
import { cn } from "@/lib/utils";

export function PrayerItem({
  prayer,
  isCurrentPrayer,
  completion,
  openAccordion,
  subPrayers,
  isFarzChecked,
  isBeforeFarz,
  onAccordionChange,
  onToggleSubPrayer,
  onToggleTahajjud,
}) {
  const isOpen = openAccordion === prayer.name;

  return (
    <AccordionItem
      value={prayer.name}
      className={cn(
        "border rounded-lg mb-4 last:mb-0 relative",
        isCurrentPrayer && "overflow-hidden"
      )}
    >
      {isCurrentPrayer && <ShineBorder />}
      <AccordionTrigger className="hover:no-underline px-4 py-4 relative z-10">
        <div className="flex items-center gap-4 w-full">
          <CircularProgress value={completion} size={50} />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-lg text-foreground">
                {prayer.name}
              </div>
              {isCurrentPrayer && (
                <div
                  className={cn(
                    "group rounded-full border border-black/5 text-white dark:border-white/5 dark:bg-neutral-900"
                  )}
                >
                  <AnimatedShinyText className="text-xs inline-flex items-center justify-center px-2 py-0.5 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                    <span>Current ✨</span>
                  </AnimatedShinyText>
                </div>
              )}
            </div>
            {prayer.time && (
              <div className="text-sm text-muted-foreground mt-0.5">
                {prayer.time}
              </div>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 relative z-10">
        <Separator />
        {prayer.name === "Tahajjud" ? (
          <TahajjudCheckboxes
            subPrayers={subPrayers[prayer.name]}
            onToggle={onToggleTahajjud}
          />
        ) : prayerSubPrayers[prayer.name].length > 0 ? (
          <div className="flex flex-col gap-3 pt-2">
            {prayerSubPrayers[prayer.name].map((subPrayer, index) => {
              const subPrayerKey = `${subPrayer}-${index}`;
              const isFarzCheckbox = subPrayerKey.includes("Farz");
              const isFarzCheckedForPrayer = isFarzChecked(prayer.name);
              const beforeFarz = isBeforeFarz(prayer.name, index);
              const isDisabled =
                !isFarzCheckbox && !beforeFarz && !isFarzCheckedForPrayer;
              const isChecked = subPrayers[prayer.name]?.[subPrayerKey] || false;

              return (
                <SubPrayerCard
                  key={subPrayerKey}
                  subPrayer={subPrayer}
                  index={index}
                  prayerName={prayer.name}
                  isChecked={isChecked}
                  isDisabled={isDisabled}
                  onToggle={() => {
                    onToggleSubPrayer(prayer.name, subPrayerKey, index);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-2">
            No sub-prayers for this prayer.
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

