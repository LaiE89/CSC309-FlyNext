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
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("bookingId");

        if (!bookingId) {
            return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
        }
        const booking = await prisma.booking.findUnique({
            where: { id: Number(bookingId) },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.userId !== decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        let hotel = null;
        let room = null;
        let flight = null;
        let price = 0;
        let nightsStayed = 0;
        let mainDestination = null;

        if (booking.hotelId) {
            hotel = await prisma.hotel.findUnique({
                where: { id: Number(booking.hotelId) },
            });
        }

        if (booking.roomId) {
            room = await prisma.room.findUnique({
                where: { id: Number(booking.roomId) },
            });

            if (booking.checkIn && booking.checkOut) {
                const checkInDate = new Date(booking.checkIn);
                const checkOutDate = new Date(booking.checkOut);
            
                const diffInMs = checkOutDate.getTime() - checkInDate.getTime();
                nightsStayed = diffInMs / (1000 * 60 * 60 * 24);
                price += room.pricePerNight * (nightsStayed);
            }
        }

        if (booking.flightBookingInfo) {
            const parsed = JSON.parse(booking.flightBookingInfo);
            flight = parsed;
            const lastFlight = parsed.flights[parsed.flights.length - 1];
            mainDestination = lastFlight?.mainDestination ?? null;
            price += parsed.flights.reduce((sum, curFlight) => sum + curFlight.price, 0);
        }

        return NextResponse.json({ booking: booking, hotel: hotel, room: room, flight: flight, price: Math.round(price * 100) / 100, nightsStayed: nightsStayed, mainDestination: mainDestination }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
