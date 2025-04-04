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
        const bookings = await prisma.booking.findMany({
            where: {
                userId: decoded.id,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                hotel: true,
                room: true,
                payment: true,
            },
        });
        return NextResponse.json(bookings, { status: 200 });

    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
