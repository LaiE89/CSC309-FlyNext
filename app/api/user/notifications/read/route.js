import { prisma } from "@/utils/db";
import { NextResponse } from 'next/server';
import { verifyToken } from "@/utils/auth";

export async function POST(request) {
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

    const body = await request.json();
    const { notificationIds } = body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json({ error: "notificationIds must be provided as an array" }, { status: 400 });
    }

    try {
        // First check if any of these notifications are actually unread
        const unreadNotifications = await prisma.notification.findMany({
            where: {
                id: { in: notificationIds },
                isRead: false,
                OR: [
                    { userId: decoded.id },
                    { hotelOwnerId: decoded.id }
                ]
            },
            select: { id: true }
        });

        if (unreadNotifications.length === 0) {
            // If no unread notifications, return early
            return NextResponse.json({ 
                message: "No unread notifications to mark as read" 
            }, { 
                status: 200,
                headers: {
                    'Cache-Control': 'no-store'
                }
            });
        }

        // Only update notifications that are actually unread
        await prisma.notification.updateMany({
            where: {
                id: { in: unreadNotifications.map(n => n.id) },
                OR: [
                    { userId: decoded.id },
                    { hotelOwnerId: decoded.id }
                ]
            },
            data: { isRead: true },
        });

        return NextResponse.json({ 
            message: "Notifications marked as read",
            updatedCount: unreadNotifications.length
        }, { 
            status: 200,
            headers: {
                'Cache-Control': 'no-store'
            }
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
