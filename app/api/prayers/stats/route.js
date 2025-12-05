import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prayer from "@/models/Prayer";
import { requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Get prayer statistics
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = { email }; // Filter by authenticated user's email

    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Get total prayer entries
    const totalEntries = await Prayer.countDocuments(query);

    // Get total prayers offered (count all prayers across all entries)
    const allPrayers = await Prayer.find(query);
    const totalPrayersOffered = allPrayers.reduce((total, entry) => {
      return total + entry.prayers.length;
    }, 0);

    // Get completion rate (prayers with all 5 main prayers)
    const mainPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const completedDays = allPrayers.filter((entry) => {
      const prayerNames = entry.prayers.map((p) => p.name);
      return mainPrayers.every((name) => prayerNames.includes(name));
    }).length;

    const completionRate =
      totalEntries > 0 ? (completedDays / totalEntries) * 100 : 0;

    // Get most prayed prayer
    const prayerCounts = {};
    allPrayers.forEach((entry) => {
      entry.prayers.forEach((prayer) => {
        prayerCounts[prayer.name] = (prayerCounts[prayer.name] || 0) + 1;
      });
    });

    const mostPrayedPrayer = Object.entries(prayerCounts).reduce(
      (a, b) => (prayerCounts[a[0]] > prayerCounts[b[0]] ? a : b),
      ["None", 0]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          totalEntries,
          totalPrayersOffered,
          completedDays,
          completionRate: Math.round(completionRate * 100) / 100,
          mostPrayedPrayer: {
            name: mostPrayedPrayer[0],
            count: mostPrayedPrayer[1],
          },
          prayerCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

