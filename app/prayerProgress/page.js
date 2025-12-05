"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Define main prayers
const mainPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function PrayerProgressPage() {
  const router = useRouter();

  // Get progress for a specific date (using same formula: selected prayers * 20%)
  const getDateProgress = (date) => {
    // Ensure date is a Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 0;

    const dateStr = dateObj.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    if (dateStr === todayStr) {
      // Today - for now, return 0 (in real app, load from state/storage)
      // You can pass selectedPrayers as props or load from localStorage
      return 0;
    } else {
      // Past/future dates - use deterministic value based on date
      // In a real app, this would come from localStorage/API
      const dateHash = dateStr
        .split("-")
        .reduce((acc, val) => acc + parseInt(val), 0);
      const selectedCount = dateHash % 6; // Deterministic: 0-5 prayers
      return selectedCount * 20;
    }
  };

  // Custom DayButton component with circular progress
  const CustomDayButton = ({ day, modifiers, className, ...props }) => {
    // Ensure day is a Date object (react-day-picker passes day.date or day)
    const dateObj = day instanceof Date ? day : day?.date || new Date(day);
    if (isNaN(dateObj.getTime())) return null;

    const progress = getDateProgress(dateObj);
    const dateStr = dateObj.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = dateStr === todayStr;
    // Use fixed smaller size for mobile compatibility
    const size = 28;
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const handleClick = () => {
      router.push(`/prayerProgress?date=${dateStr}`);
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center aspect-square w-full min-w-(--cell-size) gap-1.5 p-2 sm:gap-2 sm:p-3 text-center text-sm font-normal leading-none cursor-pointer",
          modifiers.selected && "bg-primary text-primary-foreground rounded-md",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "text-[10px] sm:text-xs font-semibold z-10 leading-tight",
            isToday &&
              "bg-primary text-primary-foreground rounded-full px-1 sm:px-1.5 py-0.5"
          )}
        >
          {dateObj.getDate()}
        </span>
        <div
          className="relative shrink-0 mt-0.5"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 absolute inset-0"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="opacity-20 text-muted-foreground"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-300 text-primary"
            />
          </svg>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold text-foreground">
              Current Month Progress
            </h1>
            <p className="text-base text-muted-foreground">
              View your prayer progress for the current month
            </p>
          </div>
          <div className="w-full overflow-x-auto">
            <div className="min-w-fit max-w-full">
              <Calendar
                mode="single"
                showOutsideDays={false}
                components={{
                  DayButton: CustomDayButton,
                }}
                className="w-full rounded-md border-0 p-0 sm:p-3 sm:border h-auto overflow-visible"
                classNames={{
                  root: "h-auto overflow-visible",
                  months: "h-auto overflow-visible",
                  month: "h-auto overflow-visible",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
