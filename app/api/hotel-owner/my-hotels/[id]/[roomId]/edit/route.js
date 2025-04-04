import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function PATCH(request, { params }) {
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
        const { roomId } = await params;
        const body = await request.json();
        const { type, available, amenities, pricePerNight, images } = body;

        if (!roomId) {
            return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
        }

        // Properly parse data
        const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;
        const parsedImages = typeof images === "string" ? JSON.parse(images) : images;
        const parsedPrice = parseFloat(pricePerNight);
        const parsedAvailable = typeof available === "boolean" ? available : available === "true";

        const data = {};
        if (type) data.type = type;
        if (Array.isArray(parsedAmenities)) data.amenities = parsedAmenities;
        if (Array.isArray(parsedImages)) data.images = parsedImages;
        if (!isNaN(parsedPrice)) data.pricePerNight = parsedPrice;
        if (typeof parsedAvailable === "boolean") data.available = parsedAvailable;

        // Find existing room
        const room = await prisma.room.findUnique({
            where: { id: parseInt(roomId, 10) },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(room.hotelId, 10) },
        });

        if (hotel.ownerId != decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        // Check if the room is being made unavailable
        const isBecomingUnavailable = parsedAvailable === false && room.available === true;

        // If making the room unavailable, delete all bookings today and in the future
        if (isBecomingUnavailable) {
            await prisma.booking.deleteMany({
                where: {
                    roomId: parseInt(roomId, 10),
                    checkIn: { gte: new Date() },
                },
            });
        }

        // Update room with new properties
        const updatedRoom = await prisma.room.update({
            where: { id: parseInt(roomId, 10) },
            data: data,
        });

        return NextResponse.json({ room: updatedRoom }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
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
        const { roomId } = await params;

        if (!roomId) {
            return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
        }

        // Find existing room
        const room = await prisma.room.delete({
            where: { id: parseInt(roomId, 10) },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(room.hotelId, 10) },
        });
        
        if (hotel.ownerId != decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        return NextResponse.json({ 
            room: room
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}