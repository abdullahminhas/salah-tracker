import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Prayer from "@/models/Prayer";
import { requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Calculate total expected prayers since user registration
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

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's registration date (createdAt field from mongoose timestamps)
    const registrationDate = user.createdAt;

    if (!registrationDate) {
      return NextResponse.json(
        { success: false, error: "Registration date not found" },
        { status: 404 }
      );
    }

    // Calculate days since registration
    // Use date strings to avoid timezone issues
    const registrationDateStr = new Date(registrationDate)
      .toISOString()
      .split("T")[0];
    const todayDateStr = new Date().toISOString().split("T")[0];

    // Parse dates as UTC midnight
    const registrationUTC = new Date(registrationDateStr + "T00:00:00.000Z");
    const todayUTC = new Date(todayDateStr + "T00:00:00.000Z");

    // Calculate difference in milliseconds, then convert to days
    const diffTime = todayUTC - registrationUTC;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Add 1 to include today (if registered today, that's 1 day)
    const totalDays = diffDays + 1;

    // Calculate total expected prayers (5 prayers per day)
    const totalExpectedPrayers = totalDays * 5;

    // Calculate total prayers offered since registration
    // Query all prayer entries from registration date onwards
    const allPrayers = await Prayer.find({
      email,
      date: { $gte: registrationDateStr }, // Only count prayers from registration date onwards
    });

    // Main prayers to count (Fajr, Dhuhr/Jumma, Asr, Maghrib, Isha)
    const mainPrayers = ["Fajr", "Dhuhr", "Jumma", "Asr", "Maghrib", "Isha"];

    // Count total prayers offered
    let totalPrayersOffered = 0;

    allPrayers.forEach((prayerEntry) => {
      if (prayerEntry.prayers && prayerEntry.prayers.length > 0) {
        // Count only main prayers that are offered
        prayerEntry.prayers.forEach((prayer) => {
          if (prayer.offered && mainPrayers.includes(prayer.name)) {
            totalPrayersOffered++;
          }
        });
      }
    });

    console.log(`📊 Total Expected Prayers Calculation:
      Registration Date: ${registrationDateStr}
      Today: ${todayDateStr}
      Days difference: ${diffDays}
      Total days (including today): ${totalDays}
      Total expected prayers: ${totalExpectedPrayers}
      Total prayers offered: ${totalPrayersOffered}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalExpectedPrayers,
          totalPrayersOffered,
          totalDays,
          registrationDate: registrationDateStr,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error calculating total expected prayers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
