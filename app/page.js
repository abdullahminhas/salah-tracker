"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Standalone radio button component that works independently
function StandaloneRadioButton({
  checked,
  onCheckedChange,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      onClick={onCheckedChange}
      {...props}
    >
      {checked && (
        <div
          data-slot="radio-group-indicator"
          className="relative flex items-center justify-center"
        >
          <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      )}
    </button>
  );
}

// Circular checkbox component that matches the radio button design
function CircularCheckbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

// Circular progress component
function CircularProgress({ value, size = 60, strokeWidth = 6, className }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
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
          className="text-primary transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-foreground">{value}%</span>
      </div>
    </div>
  );
}

// Define sub-prayers for each prayer based on the chart
const prayerSubPrayers = {
  Tahajjud: [],
  Fajr: ["2 Sunnat", "2 Farz"],
  Dhuhr: ["4 Sunnat", "4 Farz", "2 Sunnat", "2 Nafl"],
  Asr: ["4 Sunnat", "4 Farz"],
  Maghrib: ["3 Farz", "2 Sunnat", "2 Nafl"],
  Isha: ["4 Sunnat", "4 Farz", "2 Sunnat", "2 Nafl", "3 Witr", "2 Nafl"],
};

export default function Home() {
  const router = useRouter();

  const [selectedPrayers, setSelectedPrayers] = useState({
    Tahajjud: false,
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });

  // Initialize state for all sub-prayers using index-based keys to handle duplicates
  const [subPrayers, setSubPrayers] = useState(() => {
    const initialState = {};
    Object.keys(prayerSubPrayers).forEach((prayerName) => {
      initialState[prayerName] = {};
      prayerSubPrayers[prayerName].forEach((subPrayer, index) => {
        initialState[prayerName][`${subPrayer}-${index}`] = false;
      });
    });
    return initialState;
  });

  const [prayerTimes, setPrayerTimes] = useState({
    Fajr: "",
    Dhuhr: "",
    Asr: "",
    Maghrib: "",
    Isha: "",
  });

  const [madhab, setMadhab] = useState("Hanbali");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(
            "Unable to get your location. Using default coordinates."
          );
          // Fallback to default coordinates
          setLatitude("50.91406");
          setLongitude("-1.39783");
        }
      );
    } else {
      setLocationError(
        "Geolocation is not supported by your browser. Using default coordinates."
      );
      setLatitude("50.91406");
      setLongitude("-1.39783");
    }
  }, []);

  // Fetch prayer times from API
  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch(
          `https://www.ummahapi.com/api/prayer-times?lat=${latitude}&lng=${longitude}&madhab=${madhab}&method=MuslimWorldLeague`
        );
        const data = await response.json();

        if (data.success && data.data && data.data.prayer_times) {
          const times = data.data.prayer_times;

          // Convert 24-hour format (HH:MM) to 12-hour format with AM/PM
          const formatTime = (time24) => {
            const [hours, minutes] = time24.split(":");
            const hour = parseInt(hours, 10);
            const period = hour >= 12 ? "PM" : "AM";
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${period}`;
          };

          setPrayerTimes({
            Fajr: formatTime(times.fajr),
            Dhuhr: formatTime(times.dhuhr),
            Asr: formatTime(times.asr),
            Maghrib: formatTime(times.maghrib),
            Isha: formatTime(times.isha),
          });

          // Set current prayer from API response
          if (
            data.data.current_status &&
            data.data.current_status.current_prayer &&
            data.data.current_status.current_prayer !== "none"
          ) {
            const currentPrayerName = data.data.current_status.current_prayer;
            // Capitalize first letter
            setCurrentPrayer(
              currentPrayerName.charAt(0).toUpperCase() +
                currentPrayerName.slice(1)
            );
          } else {
            setCurrentPrayer(null);
          }
        }
      } catch (error) {
        console.error("Error fetching prayer times:", error);
        // Keep default empty times on error
      }
    };

    fetchPrayerTimes();
  }, [madhab, latitude, longitude]);

  const prayers = [
    { name: "Tahajjud", time: "" },
    { name: "Fajr", time: prayerTimes.Fajr },
    { name: "Dhuhr", time: prayerTimes.Dhuhr },
    { name: "Asr", time: prayerTimes.Asr },
    { name: "Maghrib", time: prayerTimes.Maghrib },
    { name: "Isha", time: prayerTimes.Isha },
  ];

  // Calculate progress: count selected prayers excluding Tahajjud (20% each)
  const mainPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const selectedMainPrayersCount = mainPrayers.filter(
    (prayer) => selectedPrayers[prayer]
  ).length;
  const progress = selectedMainPrayersCount * 20;

  // Calculate completion percentage for each prayer
  const getPrayerCompletion = (prayerName) => {
    const subPrayersList = prayerSubPrayers[prayerName];
    if (subPrayersList.length === 0) return 0;

    const checkedCount = Object.values(subPrayers[prayerName] || {}).filter(
      (checked) => checked
    ).length;
    return Math.round((checkedCount / subPrayersList.length) * 100);
  };

  // Calculate total completion across all prayers and sub-prayers
  const getTotalCompletion = () => {
    let totalSubPrayers = 0;
    let totalChecked = 0;

    mainPrayers.forEach((prayerName) => {
      const subPrayersList = prayerSubPrayers[prayerName];
      totalSubPrayers += subPrayersList.length;

      const checkedCount = Object.values(subPrayers[prayerName] || {}).filter(
        (checked) => checked
      ).length;
      totalChecked += checkedCount;
    });

    if (totalSubPrayers === 0) return 0;
    return Math.round((totalChecked / totalSubPrayers) * 100);
  };

  // Check if a prayer is fully completed (all sub-prayers checked)
  const isPrayerFullyCompleted = (prayerName) => {
    const subPrayersList = prayerSubPrayers[prayerName];
    if (subPrayersList.length === 0) return false;

    const allChecked = Object.values(subPrayers[prayerName] || {}).every(
      (checked) => checked
    );
    return allChecked;
  };

  // Get daily completion for the last 7 days (using same formula as main progress bar)
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // For today, use the same formula as main progress bar
      // Count selected prayers (radio button selected), each prayer = 20%
      let selectedCount = 0;
      let completion = 0;

      if (i === 0) {
        // Today - count selected prayers (same as main progress bar)
        selectedCount = mainPrayers.filter(
          (prayer) => selectedPrayers[prayer]
        ).length;
        completion = selectedCount * 20; // Same formula: each prayer = 20%
      } else {
        // Past days - use deterministic value based on date string
        // In a real app, this would come from localStorage/API
        // Using a simple hash of the date string for consistency
        const dateHash = dateStr
          .split("-")
          .reduce((acc, val) => acc + parseInt(val), 0);
        selectedCount = dateHash % 6; // Deterministic: 0-5 prayers
        completion = selectedCount * 20; // Same formula: each prayer = 20%
      }

      days.push({
        date: date,
        dateStr: dateStr,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: date.getDate(),
        completion: completion,
        selectedCount: selectedCount,
      });
    }

    return days;
  }, [selectedPrayers]);

  // Get progress for a specific date (using same formula: selected prayers * 20%)
  const getDateProgress = (date) => {
    // Ensure date is a Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 0;

    const dateStr = dateObj.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    if (dateStr === todayStr) {
      // Today - use current state
      const selectedCount = mainPrayers.filter(
        (prayer) => selectedPrayers[prayer]
      ).length;
      return selectedCount * 20;
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
    const size = 32; // Smaller size for calendar
    const strokeWidth = 3;
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
          "relative flex flex-col items-center justify-center aspect-square w-full min-w-(--cell-size) gap-2 p-3 text-center text-sm font-normal leading-none cursor-pointer",
          modifiers.selected && "bg-primary text-primary-foreground rounded-md",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "text-xs font-semibold z-10 leading-tight",
            isToday &&
              "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5"
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

  // Find Farz checkbox key for a prayer
  const findFarzKey = (prayerName) => {
    const subPrayers = prayerSubPrayers[prayerName];
    const farzIndex = subPrayers.findIndex((subPrayer) =>
      subPrayer.includes("Farz")
    );
    if (farzIndex !== -1) {
      return `${subPrayers[farzIndex]}-${farzIndex}`;
    }
    return null;
  };

  // Check if Farz is checked for a prayer
  const isFarzChecked = (prayerName) => {
    const farzKey = findFarzKey(prayerName);
    if (!farzKey) return false;
    return subPrayers[prayerName][farzKey] || false;
  };

  const handlePrayerSelect = (prayerName) => {
    const isCurrentlySelected = selectedPrayers[prayerName];

    setSelectedPrayers((prev) => ({
      ...prev,
      [prayerName]: !prev[prayerName],
    }));

    // Auto-select Farz checkbox when prayer is selected (not when deselected)
    if (!isCurrentlySelected && prayerName !== "Tahajjud") {
      const farzKey = findFarzKey(prayerName);
      if (farzKey) {
        setSubPrayers((prev) => ({
          ...prev,
          [prayerName]: {
            ...prev[prayerName],
            [farzKey]: true,
          },
        }));
      }
    }
  };

  const toggleSubPrayer = (prayerName, subPrayerKey) => {
    const isCurrentlyChecked = subPrayers[prayerName][subPrayerKey];
    const isFarzCheckbox = subPrayerKey.includes("Farz");

    // Prevent toggling non-Farz checkboxes if Farz is not checked
    if (!isFarzCheckbox && !isFarzChecked(prayerName)) {
      return;
    }

    // If unchecking Farz checkbox, uncheck all other checkboxes and the prayer radio card
    if (isFarzCheckbox && isCurrentlyChecked && prayerName !== "Tahajjud") {
      // Uncheck all checkboxes for this prayer (including Farz)
      setSubPrayers((prev) => {
        const updated = {};
        Object.keys(prev[prayerName]).forEach((key) => {
          updated[key] = false;
        });
        return {
          ...prev,
          [prayerName]: updated,
        };
      });

      // Uncheck the prayer radio card
      setSelectedPrayers((prev) => ({
        ...prev,
        [prayerName]: false,
      }));
    } else {
      // Normal toggle for non-Farz checkboxes or when checking Farz
      setSubPrayers((prev) => ({
        ...prev,
        [prayerName]: {
          ...prev[prayerName],
          [subPrayerKey]: !prev[prayerName][subPrayerKey],
        },
      }));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={madhab} onValueChange={setMadhab}>
              <SelectTrigger id="madhab-select" className="w-[140px]">
                <SelectValue placeholder="Select madhab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hanafi">Hanafi</SelectItem>
                <SelectItem value="Shafi">Shafi</SelectItem>
                <SelectItem value="Maliki">Maliki</SelectItem>
                <SelectItem value="Hanbali">Hanbali</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {currentPrayer && (
            <div className="text-sm text-muted-foreground">
              Current Prayer:{" "}
              <span className="font-medium text-foreground">
                {currentPrayer}
              </span>
            </div>
          )}
        </div>
        {locationError && (
          <div className="text-sm text-muted-foreground">{locationError}</div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-foreground">Prayers</h1>
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
        <div className="flex flex-col gap-4">
          {prayers.map((prayer) => (
            <div key={prayer.name} className="flex flex-col gap-4">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedPrayers[prayer.name] &&
                    "border-primary bg-accent shadow-md"
                )}
                onClick={() => handlePrayerSelect(prayer.name)}
              >
                <CardHeader>
                  <CardTitle>{prayer.name}</CardTitle>
                  <CardDescription>{prayer.time}</CardDescription>
                  <CardAction>
                    <StandaloneRadioButton
                      checked={selectedPrayers[prayer.name]}
                      onCheckedChange={(e) => {
                        e.stopPropagation();
                        handlePrayerSelect(prayer.name);
                      }}
                    />
                  </CardAction>
                </CardHeader>
              </Card>
              {selectedPrayers[prayer.name] &&
                prayerSubPrayers[prayer.name].length > 0 && (
                  <div className="mx-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {prayerSubPrayers[prayer.name].map((subPrayer, index) => {
                      const subPrayerKey = `${subPrayer}-${index}`;
                      const isFarzCheckbox = subPrayerKey.includes("Farz");
                      const isFarzCheckedForPrayer = isFarzChecked(prayer.name);
                      const isDisabled =
                        !isFarzCheckbox && !isFarzCheckedForPrayer;
                      const isChecked = subPrayers[prayer.name][subPrayerKey];

                      return (
                        <Card
                          key={subPrayerKey}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isChecked && "border-primary bg-accent shadow-sm",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (!isDisabled) {
                              toggleSubPrayer(prayer.name, subPrayerKey);
                            }
                          }}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">
                              {subPrayer}
                            </CardTitle>
                            <CardAction>
                              <CircularCheckbox
                                id={`${prayer.name}-${subPrayerKey}`}
                                checked={isChecked}
                                disabled={isDisabled}
                                onCheckedChange={(e) => {
                                  e.stopPropagation();
                                  if (!isDisabled) {
                                    toggleSubPrayer(prayer.name, subPrayerKey);
                                  }
                                }}
                              />
                            </CardAction>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                )}
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-foreground">
            Prayer Completion
          </h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {mainPrayers.map((prayerName) => {
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
        <Separator className="my-8" />
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
        <Separator className="my-8" />
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-foreground">
            Current Month Progress
          </h2>
          <div className="w-full">
            <Calendar
              mode="single"
              showOutsideDays={false}
              components={{
                DayButton: CustomDayButton,
              }}
              className="w-full rounded-md border"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
