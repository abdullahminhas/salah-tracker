"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
            <label htmlFor="madhab-select" className="text-sm font-medium">
              Madhab:
            </label>
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
                    "border-primary bg-accent shadow-sm"
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
                  <Card className="ml-8 border-l-2 border-l-primary">
                    <CardContent className="flex flex-col gap-4 p-6">
                      {prayerSubPrayers[prayer.name].map((subPrayer, index) => {
                        const subPrayerKey = `${subPrayer}-${index}`;
                        const isFarzCheckbox = subPrayerKey.includes("Farz");
                        const isFarzCheckedForPrayer = isFarzChecked(
                          prayer.name
                        );
                        const isDisabled =
                          !isFarzCheckbox && !isFarzCheckedForPrayer;

                        return (
                          <div
                            key={subPrayerKey}
                            className="flex items-center gap-3"
                          >
                            <Checkbox
                              id={`${prayer.name}-${subPrayerKey}`}
                              checked={subPrayers[prayer.name][subPrayerKey]}
                              disabled={isDisabled}
                              onCheckedChange={() =>
                                toggleSubPrayer(prayer.name, subPrayerKey)
                              }
                            />
                            <label
                              htmlFor={`${prayer.name}-${subPrayerKey}`}
                              className={cn(
                                "text-sm font-medium leading-none",
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-pointer"
                              )}
                            >
                              {subPrayer}
                            </label>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
