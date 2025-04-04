import { prisma } from "@/utils/db";
import { NextResponse } from 'next/server';
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
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { userId: decoded.id },
                    { hotelOwnerId: decoded.id }
                ]
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(notifications, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
