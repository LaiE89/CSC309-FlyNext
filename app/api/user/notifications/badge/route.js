import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

export async function GET(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token, true);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (decoded.role !== "USER" && decoded.role !== "HOTEL_OWNER") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    // Fetch fresh unread notifications count
    const count = await prisma.notification.count({
      where: {
        userId: decoded.id,
        isRead: false,
      },
    });

    return NextResponse.json(
      { unreadCount: count },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (err) {
    console.error("Unread Notifications Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}