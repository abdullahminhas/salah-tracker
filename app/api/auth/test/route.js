import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  try {
    // Test MongoDB connection
    await connectDB();
    
    // Test User model
    const userCount = await User.countDocuments();
    
    // Test JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    
    return NextResponse.json({
      success: true,
      data: {
        mongodb: "Connected",
        userModel: "Loaded",
        userCount,
        jwtSecret: JWT_SECRET ? "Set" : "Not set",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

