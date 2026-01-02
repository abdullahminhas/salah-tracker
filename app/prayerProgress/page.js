"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getMonthPrayers } from "@/lib/prayer-api";
import { useAuth } from "@/contexts/AuthContext";

// Define main prayers
const mainPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function PrayerProgressPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Track the current month being displayed
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Store month data from API
  const [monthData, setMonthData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch month data when month changes
  useEffect(() => {
    const fetchMonthData = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated || !user) {
        setMonthData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1; // getMonth() returns 0-11, API expects 1-12

        const data = await getMonthPrayers(year, month);
        setMonthData(data || []);
      } catch (err) {
        console.error("Error fetching month data:", err);
        setError(err.message);
        setMonthData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [currentMonth, isAuthenticated, user]);

  // Create a map for quick lookup of date progress
  const progressMap = useMemo(() => {
    const map = {};
    monthData.forEach((day) => {
      map[day.dateStr] = day.completion;
    });
    return map;
  }, [monthData]);

  // Get progress for a specific date from API data
  const getDateProgress = (date) => {
    // Ensure date is a Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 0;

    const dateStr = dateObj.toISOString().split("T")[0];

    // Look up progress from API data
    if (progressMap[dateStr] !== undefined) {
      return progressMap[dateStr];
    }

    // If no data found, return 0
    return 0;
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
          <div className="w-full flex justify-center">
            <div className="w-full max-w-fit">
              <Calendar
                mode="single"
                selected={undefined}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
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
              {loading && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Loading prayer data...
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive text-center mt-4">
                  Error loading data: {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
