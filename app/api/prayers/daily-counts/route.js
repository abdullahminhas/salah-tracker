import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prayer from "@/models/Prayer";
import { requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Get daily prayer counts for a specific month
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
    const month = parseInt(searchParams.get("month")); // 1-12

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: "Year and month (1-12) are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate start and end dates for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(
      year,
      month,
      0
    ).getDate()}`;

    // Fetch all prayers for this month
    const prayers = await Prayer.find({
      email,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Create a map for quick lookup
    const prayerMap = {};
    prayers.forEach((prayer) => {
      prayerMap[prayer.date] = prayer;
    });

    // Get all dates in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyCounts = [];

    // Main prayers to count
    const mainPrayers = ["Fajr", "Dhuhr", "Jumma", "Asr", "Maghrib", "Isha"];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const prayer = prayerMap[dateStr];

      let count = 0;
      if (prayer && prayer.prayers && prayer.prayers.length > 0) {
        // Count only main prayers that are offered
        count = prayer.prayers.filter(
          (p) => p.offered && mainPrayers.includes(p.name)
        ).length;
      }

      dailyCounts.push({
        day: day,
        date: dateStr,
        prayers: count,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: dailyCounts,
        month: month,
        year: year,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching daily prayer counts:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

