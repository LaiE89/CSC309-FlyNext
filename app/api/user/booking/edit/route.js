import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

export async function PATCH(request) {
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
        const body = await request.json();
        const { bookingId, checkIn, checkOut, hotelId, roomId, flightBookingInfo } = body;
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.userId !== decoded.id) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                checkIn: checkIn ? new Date(checkIn) : booking.checkIn,
                checkOut: checkOut ? new Date(checkOut) : booking.checkOut,
                hotelId: hotelId !== undefined ? hotelId : booking.hotelId,
                roomId: roomId !== undefined ? roomId : booking.roomId,
                flightBookingInfo:
                    flightBookingInfo !== undefined ? flightBookingInfo : booking.flightBookingInfo,
            },
        });
        return NextResponse.json(updatedBooking, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
