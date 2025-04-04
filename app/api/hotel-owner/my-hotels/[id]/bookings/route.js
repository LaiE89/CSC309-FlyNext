import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function GET(request, { params }) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token, true);
    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    if (decoded.role !== "HOTEL_OWNER") {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")) : null;
        const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")) : null;
        const roomType = searchParams.get("roomType");

        // Validate date filters
        if (startDate && isNaN(startDate)) {
            return NextResponse.json({ error: "Invalid startDate format" }, { status: 400 });
        }
        if (endDate && isNaN(endDate)) {
            return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
        }

        // Fetch booked rooms within the given date range
        let bookingFilters = { hotelId: parseInt(id, 10) };
        if (startDate && endDate) {
            bookingFilters.checkIn = { gte: startDate };
            bookingFilters.checkOut = { lte: endDate };
        } else if (startDate) {
            bookingFilters.checkIn = { gte: startDate };
        } else if (endDate) {
            bookingFilters.checkOut = { lte: endDate };
        }

        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(id, 10) },
        });
        
        if (hotel.ownerId != decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }
        
        // Find bookings that fit the filters
        const bookings = await prisma.booking.findMany({
            where: bookingFilters,
            include: {
                room: true,
            },
        });

        if (!bookings) {
            return NextResponse.json({ error: "Bookings not found" }, { status: 404 });
        }

        // If roomType is specified, filter bookings further
        const filteredBookings = roomType
            ? bookings.filter((booking) => booking.room?.type === roomType)
            : bookings;

        // Find available rooms (filtering out those with overlapping bookings)
        const roomTypeFilter = roomType ? { type: roomType } : {};
        const overlappedBookingsFilter = startDate && endDate ? { none: { AND: [
            { checkIn: { lt: endDate } },
            { checkOut: { gt: startDate } },
        ]}} : {};
        
        const availableRoomsGrouped = await prisma.room.groupBy({
            by: ['type'],
            where: {
                hotelId: parseInt(id, 10),
                available: true,
                ...roomTypeFilter,
                bookings: overlappedBookingsFilter,
            },
            _count: {
                id: true,
            },
        });

        const roomAvailability = availableRoomsGrouped.map((room) => ({
            type: room.type,
            available: room._count.id,
        }));

        console.log(roomAvailability);
        return NextResponse.json({ 
            bookings: filteredBookings, 
            roomAvailability: roomAvailability 
        }, { 
            status: 200,
            headers: { "Content-Type": "application/json" }, 
        });
    } catch (error) {
        console.error("Error fetching bookings and availability:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
