import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prayer from "@/models/Prayer";
import { requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Get prayer data for a specific month
// Query params: year (required), month (required, 1-12)
// Example: /api/prayers/month?year=2024&month=1
export async function GET(request) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) {
      return authError;
    }

    const email = getAuthEmail(request);
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Unable to identify user" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year"));
    const month = parseInt(searchParams.get("month"));

    // Validate year and month
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid year or month. Year and month (1-12) are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1); // First day of month
    const endDate = new Date(year, month, 0); // Last day of month
    const daysInMonth = endDate.getDate();

    // Generate all dates in the month
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split("T")[0];
      dates.push(dateStr);
    }

    // Fetch prayer data for these dates
    const prayers = await Prayer.find({
      email,
      date: { $in: dates },
    }).sort({ date: 1 });

    // Create a map for quick lookup
    const prayerMap = {};
    prayers.forEach((prayer) => {
      prayerMap[prayer.date] = prayer;
    });

    // Build response with all days in the month
    const monthData = dates.map((dateStr) => {
      const prayer = prayerMap[dateStr];
      // Create date object from date string (YYYY-MM-DD)
      const [yearNum, monthNum, day] = dateStr.split("-").map(Number);
      const date = new Date(yearNum, monthNum - 1, day);

      // Calculate completion based on main prayers (same formula as frontend)
      const mainPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      let selectedCount = 0;
      let completion = 0;

      if (prayer && prayer.prayers && prayer.prayers.length > 0) {
        const prayerNames = prayer.prayers.map((p) => p.name);
        selectedCount = mainPrayers.filter((name) =>
          prayerNames.includes(name)
        ).length;
        completion = selectedCount * 20; // Each prayer = 20%
      }

      return {
        date: date, // Date object
        dateStr: dateStr, // String in YYYY-MM-DD format
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: date.getDate(),
        completion,
        selectedCount,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: monthData,
        month: month,
        year: year,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching month prayers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

