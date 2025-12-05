import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prayer from "@/models/Prayer";
import { requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Get last 7 days of prayer data (including today)
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

    await connectDB();

    // Calculate date range for last 7 days (including today)
    const today = new Date();
    const dates = [];
    
    // Get last 7 days including today (6 days ago to today = 7 days)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
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

    // Build response with all 7 days
    const last7DaysData = dates.map((dateStr) => {
      const prayer = prayerMap[dateStr];
      // Create date object from date string (YYYY-MM-DD)
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      
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
        data: last7DaysData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching last 7 days prayers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

