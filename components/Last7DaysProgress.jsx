"use client";

import { CircularProgress } from "@/components/ui/circular-progress";

export function Last7DaysProgress({ last7Days }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-foreground">
        Last 7 Days Progress
      </h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
        {last7Days.map((day) => {
          const isToday =
            day.dateStr === new Date().toISOString().split("T")[0];
          return (
            <div
              key={day.dateStr}
              className="flex flex-col items-center gap-3"
            >
              <CircularProgress value={day.completion} />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {day.dayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {day.dayNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {day.selectedCount}/5 prayers
                </p>
                {isToday && (
                  <p className="text-xs text-primary font-medium mt-1">
                    Today
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

