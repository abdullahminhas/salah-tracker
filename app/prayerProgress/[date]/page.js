"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPrayerByDate } from "@/lib/prayer-api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Check,
  X,
  Clock,
  ClockCheck,
} from "lucide-react";
import { format } from "date-fns";
import { mainPrayers, prayerSubPrayers } from "@/components/constants";

export default function PrayerDateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const date = params?.date;

  const [prayerData, setPrayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrayerData = async () => {
      if (!date || !isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`📅 Fetching prayer data for date: ${date}`);
        const data = await getPrayerByDate(date);
        console.log("📥 Fetched prayer data from /api/prayers/[date]:", data);
        if (data === null) {
          console.log(
            "ℹ️ No prayer data found for this date (404 is expected)"
          );
        }
        setPrayerData(data);
      } catch (err) {
        console.error("❌ Error fetching prayer data:", err);
        setError(err.message || "Failed to load prayer data");
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerData();
  }, [date, isAuthenticated, user]);

  // Format date for display
  const formattedDate = date
    ? format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  // Helper function to format time to AM/PM format
  const formatTimeToAMPM = (timeString) => {
    if (!timeString) return "";

    // Check if already in AM/PM format
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }

    // Try to parse as 24-hour format (HH:MM or HH:MM:SS)
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    }

    // Return as-is if can't parse
    return timeString;
  };

  // Calculate completion percentage using the same logic as TodaysPrayers
  // Always 5 main prayers (Fajr, Dhuhr/Jumma, Asr, Maghrib, Isha), each worth 20%
  const completionPercentage = useMemo(() => {
    if (!prayerData?.prayers) return 0;

    // Get the date to check if it's Friday
    const dateObj = date ? new Date(date + "T00:00:00") : new Date();
    const isFriday = dateObj.getDay() === 5; // 5 = Friday

    // Determine which main prayers to count (Dhuhr or Jumma based on day)
    const effectiveMainPrayers = isFriday
      ? mainPrayers.filter((p) => p !== "Dhuhr") // On Friday, exclude Dhuhr, count Jumma
      : mainPrayers.filter((p) => p !== "Jumma"); // On other days, exclude Jumma, count Dhuhr

    // Count how many of the 5 main prayers were offered
    const offeredMainPrayersCount = effectiveMainPrayers.filter(
      (prayerName) => {
        return prayerData.prayers.some(
          (p) => p.name === prayerName && p.offered
        );
      }
    ).length;

    // Each prayer is worth 20% (5 prayers * 20% = 100%)
    return offeredMainPrayersCount * 20;
  }, [prayerData, date]);

  // Calculate completion percentage for individual prayer based on sub-prayers
  const getPrayerCompletion = (prayer) => {
    if (!prayer.offered) return 0;

    if (prayer.name === "Tahajjud") {
      // Tahajjud: 100% if any sub-prayer is present
      return prayer.subPrayers && prayer.subPrayers.length > 0 ? 100 : 0;
    }

    const expectedSubPrayers = prayerSubPrayers[prayer.name] || [];
    if (expectedSubPrayers.length === 0) return 0;

    // Count how many sub-prayers were offered
    const offeredCount = prayer.subPrayers ? prayer.subPrayers.length : 0;

    return Math.round((offeredCount / expectedSubPrayers.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/prayerProgress")}
              className="w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Button>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold text-foreground">
                Prayer Details
              </h1>
              <p className="text-base text-muted-foreground">
                {formattedDate || date}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Loading prayer data...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-destructive">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* No Data State */}
          {!loading && !error && !prayerData && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No prayer data found for this date.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Prayer Data */}
          {!loading && !error && prayerData && (
            <>
              {/* Completion Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Completion Summary</CardTitle>
                  <CardDescription>
                    {Math.round(completionPercentage / 20)} of 5 prayers offered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={completionPercentage} />
                    </div>
                    <span className="text-sm font-semibold">
                      {completionPercentage}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Prayer List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prayerData.prayers.map((prayer, index) => (
                  <Card key={index} className="flex flex-col">
                    <CardHeader>
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl">{prayer.name}</CardTitle>
                        {prayer.offered && prayer.offeredAtTime && (
                          <CardDescription className="flex flex-row justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {prayer.time && formatTimeToAMPM(prayer.time)}
                            </span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                              <ClockCheck className="h-3.5 w-3.5" />
                              {formatTimeToAMPM(prayer.offeredAtTime)}
                            </span>
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                    {prayer.offered && (
                      <CardContent className="flex flex-col h-full gap-4">
                        <div className="flex-1">
                          {(() => {
                            const expectedSubPrayers =
                              prayerSubPrayers[prayer.name] || [];
                            if (expectedSubPrayers.length === 0) return null;

                            const offeredSubPrayers = prayer.subPrayers || [];

                            // Sort sub-prayers: offered ones first, then unoffered ones
                            const sortedSubPrayers = expectedSubPrayers
                              .map((expectedSubPrayer) => {
                                // Parse expected sub-prayer (e.g., "2 Sunnat" -> rakat: "2", type: "Sunnat")
                                const parts = expectedSubPrayer.split(" ");
                                const expectedRakatCount = parts[0];
                                const expectedType = parts.slice(1).join(" ");

                                // Check if this sub-prayer was offered by matching rakat and type
                                const isOffered = offeredSubPrayers.some(
                                  (subPrayer) =>
                                    subPrayer.rakat.includes(
                                      expectedRakatCount
                                    ) && subPrayer.type === expectedType
                                );

                                return {
                                  expectedSubPrayer,
                                  isOffered,
                                  expectedRakatCount,
                                  expectedType,
                                };
                              })
                              .sort((a, b) => {
                                // Sort: offered first (true comes before false)
                                if (a.isOffered && !b.isOffered) return -1;
                                if (!a.isOffered && b.isOffered) return 1;
                                return 0; // Keep original order for same status
                              });

                            return (
                              <div className="flex flex-col gap-2">
                                {sortedSubPrayers.map((item, index) => {
                                  const { expectedSubPrayer, isOffered } = item;
                                  const [rakat, ...typeParts] =
                                    expectedSubPrayer.split(" ");
                                  const type = typeParts.join(" ");

                                  return (
                                    <div
                                      key={index}
                                      className="px-3 py-1.5 bg-muted rounded-md text-sm flex items-center gap-2"
                                    >
                                      {isOffered ? (
                                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      )}
                                      <span
                                        className={
                                          isOffered ? "" : "line-through"
                                        }
                                      >
                                        {rakat} {type}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex flex-col gap-2 mt-auto">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Fulfilled
                            </span>
                            <span className="font-medium text-foreground">
                              {getPrayerCompletion(prayer)}%
                            </span>
                          </div>
                          <Progress value={getPrayerCompletion(prayer)} />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
