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
        // Parse request body
        const body = await request.json();
        const { bookingId, cancelType } = body;
        if (!bookingId) {
            return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
        }

        // Retrieve the booking (including hotel info for notifications)
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking || booking.userId !== decoded.id) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        let hotelOwnerId = null;
        if (booking.hotelId) {
            const hotelRecord = await prisma.hotel.findUnique({
                where: { id: booking.hotelId },
            });
            hotelOwnerId = hotelRecord?.ownerId;
        }
        const oldBookStatus = booking.bookStatus;

        // Build update data based on the cancelType
        let updateData = {};
        if (cancelType === "flight") {
            // Remove flight portion only.
            // If there is no hotel info, then cancel overall booking.
            if (!booking.hotelId) {
                updateData = {
                    flightBookingInfo: null,
                    bookStatus: "CANCELLED",
                };
            } else {
                updateData.flightBookingInfo = null;
            }
        } else if (cancelType === "room") {
            // Remove hotel/room portion only.
            // If there is no flight info, then cancel overall booking.
            if (!booking.flightBookingInfo) {
                updateData = {
                    hotelId: null,
                    roomId: null,
                    bookStatus: "CANCELLED",
                };
            } else {
                updateData.hotelId = null;
                updateData.roomId = null;
            }
        } else if (cancelType === "both") {
            // Cancel both portions and mark overall booking as CANCELLED.
            updateData = {
                flightBookingInfo: null,
                hotelId: null,
                roomId: null,
                bookStatus: "CANCELLED",
            };
        } else {
            return NextResponse.json({ error: "Invalid cancelType" }, { status: 400 });
        }

        // Update the booking record
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: updateData,
        });

        if ((cancelType === "room" || cancelType === "both") && booking.hotelId) {
            if (oldBookStatus == "CONFIRMED") {
                await prisma.notification.create({
                    data: {
                        userId: booking.userId,
                        message: `⚠️ Booking Update
                        \nThe room portion of your booking #${booking.id} has been cancelled.
                        ${booking.flightBookingInfo ? '\nYour flight booking remains active.' : ''}
                        \nPlease check your email for more details.`,
                    },
                });

                if (hotelOwnerId) {
                    await prisma.notification.create({
                        data: {
                            userId: hotelOwnerId,
                            message: `⚠️ Booking Cancellation
                            \nThe room portion of booking #${booking.id} has been cancelled by the guest.
                            ${booking.checkIn ? `\nOriginal check-in: ${new Date(booking.checkIn).toLocaleDateString()}` : ''}
                            ${booking.checkOut ? `\nOriginal check-out: ${new Date(booking.checkOut).toLocaleDateString()}` : ''}`,
                        },
                    });
                }
            }
        }

        return NextResponse.json(
            { message: "Booking updated", booking: updatedBooking },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
