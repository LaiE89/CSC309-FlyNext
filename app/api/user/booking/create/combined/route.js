import { BookingStatus, FlightStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { verifyToken } from "@/utils/auth";
import { prisma } from "@/utils/db";

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

    try {
        // Parse the request body
        const body = await request.json();

        // Destructure payload fields. We expect:
        // - flightBookingInfo: a stringified JSON (if provided)
        // - roomBookingInfo: a stringified JSON containing room details
        const { flightBookingInfo, roomBookingInfo } = body;

        // Parse flightBookingInfo if provided
        let parsedFlightInfo = null;
        if (flightBookingInfo) {
            try {
                parsedFlightInfo = JSON.parse(flightBookingInfo);
            } catch (error) {
                return NextResponse.json({ error: "Invalid flight booking info" }, { status: 400 });
            }
        }

        // Parse roomBookingInfo if provided
        let parsedRoomBooking = null;
        if (roomBookingInfo) {
            try {
                parsedRoomBooking = JSON.parse(roomBookingInfo);
            } catch (error) {
                return NextResponse.json({ error: "Invalid room booking info" }, { status: 400 });
            }
        }

        // Extract and convert room booking details (if provided)
        let finalCheckIn = parsedRoomBooking && parsedRoomBooking.checkIn ? new Date(parsedRoomBooking.checkIn) : null;
        let finalCheckOut = parsedRoomBooking && parsedRoomBooking.checkOut ? new Date(parsedRoomBooking.checkOut) : null;
        let finalHotelId = parsedRoomBooking && parsedRoomBooking.hotelId ? parsedRoomBooking.hotelId : null;
        let finalRoomId = parsedRoomBooking && parsedRoomBooking.roomId ? parsedRoomBooking.roomId : null;

        // If room details are provided, ensure dates are present and check room availability.
        if (finalHotelId && finalRoomId) {
            if (!finalCheckIn || !finalCheckOut) {
                return NextResponse.json(
                    { error: "Missing checkIn or checkOut dates for room booking" },
                    { status: 400 }
                );
            }

            // Check for overlapping bookings for the same room (ignoring cancelled bookings)
            const overlappingBooking = await prisma.booking.findFirst({
                where: {
                    roomId: finalRoomId,
                    bookStatus: { not: BookingStatus.CANCELLED },
                    AND: [
                        { checkIn: { lte: finalCheckOut } },
                        { checkOut: { gte: finalCheckIn } },
                    ],
                },
            });

            if (overlappingBooking) {
                return NextResponse.json(
                    { error: "Room is already booked for the selected dates" },
                    { status: 400 }
                );
            }
        }

        // Build the combined booking data
        const bookingData = {
            user: { connect: { id: decoded.id } },
            flightBookingInfo: flightBookingInfo || null,
            checkIn: finalCheckIn,
            checkOut: finalCheckOut,
            bookStatus: BookingStatus.PENDING,
            flightStatus: FlightStatus.SCHEDULED,
        };

        // If room booking details are provided, connect the hotel and room.
        if (finalHotelId && finalRoomId) {
            bookingData.hotel = { connect: { id: finalHotelId } };
            bookingData.room = { connect: { id: finalRoomId } };
        }

        // Create the booking record
        const booking = await prisma.booking.create({
            data: bookingData,
        });
        return NextResponse.json(booking, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
