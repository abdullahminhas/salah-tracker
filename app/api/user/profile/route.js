import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth, getAuthEmail } from "@/lib/auth";

/* =========================
   GET: Fetch user profile
========================= */
export async function GET(request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const email = getAuthEmail(request);
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Unable to identify user" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          name: user.name,
          email: user.email,
          dateOfBirth: user.dateOfBirth
            ? user.dateOfBirth.toISOString().split("T")[0]
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT: Update user profile
========================= */
export async function PUT(request) {
  try {
    // 🔹 Authenticate user
    const authError = requireAuth(request);
    if (authError) return authError;

    const email = getAuthEmail(request);
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Unable to identify user" },
        { status: 401 }
      );
    }

    // 🔹 Get JSON body from frontend
    const updateData = await request.json();

    await connectDB();

    // 🔹 Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // 🔹 Assign all fields from frontend JSON
    Object.assign(user, updateData);

    // 🔹 Save the user (Mongoose converts date strings to Date automatically)
    await user.save();

    // 🔹 Return updated user
    return NextResponse.json(
      {
        success: true,
        data: {
          name: user.name,
          email: user.email,
          dateOfBirth: user.dateOfBirth
            ? user.dateOfBirth.toISOString().split("T")[0]
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
