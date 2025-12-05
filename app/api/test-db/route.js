import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

// Test endpoint to verify MongoDB connection
export async function GET() {
  try {
    const db = await connectDB();
    
    // Get database name and connection state
    const dbName = db.connection.db.databaseName;
    const readyState = db.connection.readyState;
    const readyStateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return NextResponse.json(
      {
        success: true,
        message: "MongoDB connection successful!",
        database: dbName,
        connectionState: readyStateMap[readyState] || "unknown",
        readyState: readyState,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to connect to MongoDB. Please check your connection string.",
      },
      { status: 500 }
    );
  }
}

