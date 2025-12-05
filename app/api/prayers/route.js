import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prayer from "@/models/Prayer";
import { verifyAuth, requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Fetch prayers (returns null if not authenticated)
export async function GET(request) {
  try {
    // Check authentication - if not authenticated, return null data instead of error
    const decoded = verifyAuth(request);
    if (!decoded || !decoded.email) {
      // User not authenticated - return null data gracefully
      return NextResponse.json(
        { success: true, data: null, message: "User not authenticated" },
        { status: 200 }
      );
    }

    const email = decoded.email;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let prayers;

    if (date) {
      // Fetch prayers for a specific date for the authenticated user
      prayers = await Prayer.findOne({ date, email });
      
      if (!prayers) {
        return NextResponse.json(
          { success: true, data: null, message: "No prayers found for this date" },
          { status: 200 }
        );
      }
    } else {
      // Fetch all prayers for the authenticated user
      prayers = await Prayer.find({ email }).sort({ date: -1 }).limit(100);
    }

    return NextResponse.json(
      { success: true, data: prayers },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching prayers:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update a prayer entry
// This endpoint handles both creation and updates
export async function POST(request) {
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

    const body = await request.json();
    const { date, prayers } = body;

    // Validate required fields
    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    // Prayers array is optional (can be empty if user unchecks all)
    if (prayers && !Array.isArray(prayers)) {
      return NextResponse.json(
        { success: false, error: "Prayers must be an array" },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Enforce that only today's data can be created/updated
    if (date !== todayStr) {
      return NextResponse.json(
        { success: false, error: "Cannot update prayer data for past or future dates. Only today's data can be modified." },
        { status: 403 } // Forbidden
      );
    }

    // Only allow updates for today's date
    const prayersArray = prayers || [];

    // Check if prayer entry already exists for this date and email
    const existingPrayer = await Prayer.findOne({ date, email });

    let result;

    if (existingPrayer) {
      // Update existing entry (only for today)
      existingPrayer.prayers = prayersArray;
      result = await existingPrayer.save();
      console.log(`✅ Updated prayer entry for email: ${email}, date: ${date}`);
    } else {
      // Create new entry for today (even if prayers array is empty)
      result = await Prayer.create({ email, date, prayers: prayersArray });
      console.log(`✅ Created new prayer entry for email: ${email}, date: ${date}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: existingPrayer ? "Prayer updated successfully" : "Prayer created successfully",
      },
      { status: existingPrayer ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating/updating prayer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

