"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  getMonthPrayers,
  getTotalExpectedPrayers,
  getDailyPrayerCounts,
} from "@/lib/prayer-api";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardHeader,
  CardAction,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

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
  // Store daily prayer counts for chart
  const [dailyCounts, setDailyCounts] = useState([]);
  // Store total expected prayers, total offered prayers, and total days
  const [totalExpectedPrayers, setTotalExpectedPrayers] = useState(null);
  const [totalPrayersOffered, setTotalPrayersOffered] = useState(null);
  const [totalDays, setTotalDays] = useState(null);

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

        const [monthDataResult, dailyCountsResult] = await Promise.all([
          getMonthPrayers(year, month),
          getDailyPrayerCounts(year, month),
        ]);

        setMonthData(monthDataResult || []);
        setDailyCounts(dailyCountsResult || []);
      } catch (err) {
        console.error("Error fetching month data:", err);
        setError(err.message);
        setMonthData([]);
        setDailyCounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [currentMonth, isAuthenticated, user]);

  // Fetch total expected prayers
  useEffect(() => {
    const fetchTotalExpected = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated || !user) {
        setTotalExpectedPrayers(null);
        setTotalPrayersOffered(null);
        setTotalDays(null);
        return;
      }

      try {
        const data = await getTotalExpectedPrayers();
        setTotalExpectedPrayers(data?.totalExpectedPrayers || null);
        setTotalPrayersOffered(data?.totalPrayersOffered || null);
        setTotalDays(data?.totalDays || null);
      } catch (err) {
        console.error("Error fetching total expected prayers:", err);
        setTotalExpectedPrayers(null);
        setTotalPrayersOffered(null);
        setTotalDays(null);
      }
    };

    fetchTotalExpected();
  }, [isAuthenticated, user]);

  // Create a map for quick lookup of date progress
  const progressMap = useMemo(() => {
    const map = {};
    monthData.forEach((day) => {
      map[day.dateStr] = day.completion;
    });
    return map;
  }, [monthData]);

  // Calculate total prayers offered this month
  const totalPrayersThisMonth = useMemo(() => {
    if (!monthData || monthData.length === 0) return 0;
    return monthData.reduce((total, day) => {
      return total + (day.selectedCount || 0);
    }, 0);
  }, [monthData]);

  // Calculate total expected prayers for the current month till today
  const totalExpectedPrayersThisMonth = useMemo(() => {
    const today = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();

    // Check if we're viewing the current month
    if (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonthNum
    ) {
      // Count days from the 1st of the month up to today (inclusive)
      const daysInMonthTillToday = today.getDate();
      return daysInMonthTillToday * 5; // 5 prayers per day
    } else {
      // If viewing a past or future month, count all days in that month
      const daysInMonth = new Date(
        currentYear,
        currentMonthNum + 1,
        0
      ).getDate();
      return daysInMonth * 5; // 5 prayers per day
    }
  }, [currentMonth]);

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

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/prayerProgress/${dateStr}`);
    };

    const { onClick: _onClick, ...restProps } = props;

    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center aspect-square w-full min-w-(--cell-size) gap-1.5 p-2 sm:gap-2 sm:p-3 text-center text-sm font-normal leading-none cursor-pointer",
          modifiers.selected && "bg-primary text-primary-foreground rounded-md",
          className
        )}
        {...restProps}
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

  const description = "An area chart with gradient fill";

  // Chart data from daily counts API (only show data till current date)
  const chartData = useMemo(() => {
    if (!dailyCounts || dailyCounts.length === 0) {
      return [];
    }

    const today = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();
    const isCurrentMonth =
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonthNum;

    const todayDate = today.getDate();

    return dailyCounts
      .filter((item) => {
        // If viewing current month, only show data up to today
        if (isCurrentMonth) {
          return item.day <= todayDate;
        }
        // If viewing past or future month, show all data
        return true;
      })
      .map((item) => ({
        day: item.day,
        prayers: item.prayers,
      }));
  }, [dailyCounts, currentMonth]);

  const chartConfig = {
    prayers: {
      label: "Prayers",
      color: "var(--primary)",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold text-foreground">
              Prayer Progress
            </h1>
            <div className="flex flex-col gap-0.5">
              <p className="text-base text-muted-foreground">
                View your prayer progress
              </p>
              {/* {totalDays !== null && totalExpectedPrayers !== null && (
                <p className="text-xs text-muted-foreground">
                  You have been registered for {totalDays}{" "}
                  {totalDays === 1 ? "day" : "days"}. In that time, the total
                  expected prayers since joining are{" "}
                  <span className="font-semibold text-foreground">
                    {totalExpectedPrayers}
                  </span>
                  {totalPrayersOffered !== null && (
                    <>
                      , but you have offered{" "}
                      <span className="font-semibold text-foreground">
                        {totalPrayersOffered}
                      </span>{" "}
                      {totalPrayersOffered === 1 ? "prayer" : "prayers"}.
                    </>
                  )}
                </p>
              )} */}
            </div>
          </div>
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 sm:grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Prayers Offered</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {totalPrayersOffered !== null
                    ? totalPrayersOffered.toLocaleString()
                    : "—"}
                </CardTitle>
                {/* <CardAction>
                  <Badge variant="outline">
                    <IconTrendingUp />
                    +12.5%
                  </Badge>
                </CardAction> */}
              </CardHeader>
              {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Trending up this month
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Visitors for the last 6 months
                </div>
              </CardFooter> */}
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Prayers Offered this month</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {totalPrayersThisMonth.toLocaleString()}
                </CardTitle>
                {/* <CardAction>
                  <Badge variant="outline">
                    <IconTrendingDown />
                    -20%
                  </Badge>
                </CardAction> */}
              </CardHeader>
              {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Down 20% this period
                  <IconTrendingDown className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Acquisition needs attention
                </div>
              </CardFooter> */}
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Prayers this month</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {totalExpectedPrayersThisMonth.toLocaleString()}
                </CardTitle>
                {/* <CardAction>
                  <Badge variant="outline">
                    <IconTrendingUp />
                    +12.5%
                  </Badge>
                </CardAction> */}
              </CardHeader>
              {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Strong user retention
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Engagement exceed targets
                </div>
              </CardFooter> */}
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total prayers since joining</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {totalExpectedPrayers !== null
                    ? totalExpectedPrayers.toLocaleString()
                    : "—"}
                </CardTitle>
                {/* <CardAction>
                  <Badge variant="outline">
                    <IconTrendingUp />
                    +4.5%
                  </Badge>
                </CardAction> */}
              </CardHeader>
              {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Steady performance increase{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Meets growth projections
                </div>
              </CardFooter> */}
            </Card>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 md:col-span-8">
              <CardHeader>
                <CardTitle>Current Month Progress</CardTitle>
                <CardDescription>
                  Showing your prayer progress for the current month
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />

                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />

                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />

                    <defs>
                      <linearGradient
                        id="fillPrayers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>

                    <Area
                      dataKey="prayers"
                      type="natural"
                      fill="url(#fillPrayers)"
                      fillOpacity={0.4}
                      stroke="var(--primary)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>

              {/* <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 leading-none font-medium">
                      Trending up by 5.2% this month
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 leading-none">
                      January - June 2024
                    </div>
                  </div>
                </div>
              </CardFooter> */}
            </Card>
            <div className="col-span-12 md:col-span-4 w-full">
              <Card className="w-full h-full">
                <CardContent className="w-full h-full sm:p-3 flex flex-col relative">
                  <div className="w-full flex-1 min-w-0">
                    <Calendar
                      mode="single"
                      selected={undefined}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      showOutsideDays={false}
                      components={{
                        DayButton: CustomDayButton,
                      }}
                      className="w-full rounded-md border-0 p-0"
                      classNames={{
                        root: "w-full",
                        months: "w-full",
                        month: "w-full",
                      }}
                    />
                  </div>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
