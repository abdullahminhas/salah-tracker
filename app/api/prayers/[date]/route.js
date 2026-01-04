import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prayer from "@/models/Prayer";
import { requireAuth, getAuthEmail } from "@/lib/auth";

// GET - Fetch prayers for a specific date
export async function GET(request, { params }) {
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

    const { date } = await params;
    console.log(`📅 GET /api/prayers/[date] - Fetching prayers for date: ${date}, email: ${email}`);

    const prayer = await Prayer.findOne({ date, email });
    console.log(`📅 GET /api/prayers/[date] - Found prayer:`, prayer ? "Yes" : "No");

    if (!prayer) {
      return NextResponse.json(
        { success: false, message: "Prayer not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: prayer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching prayer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update prayers for a specific date
export async function PUT(request, { params }) {
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

    const { date } = await params;
    const body = await request.json();
    const { prayers } = body;

    if (!prayers || !Array.isArray(prayers)) {
      return NextResponse.json(
        { success: false, error: "Prayers array is required" },
        { status: 400 }
      );
    }

    // Enforce that only today's data can be updated
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) {
      return NextResponse.json(
        { success: false, error: "Cannot update prayer data for past or future dates. Only today's data can be modified." },
        { status: 403 } // Forbidden
      );
    }

    const prayer = await Prayer.findOneAndUpdate(
      { date, email },
      { prayers },
      { new: true, runValidators: true }
    );

    if (!prayer) {
      return NextResponse.json(
        { success: false, message: "Prayer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: prayer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating prayer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete prayers for a specific date
export async function DELETE(request, { params }) {
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

    const { date } = await params;

    const prayer = await Prayer.findOneAndDelete({ date, email });

    if (!prayer) {
      return NextResponse.json(
        { success: false, message: "Prayer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Prayer deleted successfully", data: prayer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting prayer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

