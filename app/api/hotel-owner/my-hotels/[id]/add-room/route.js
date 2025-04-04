import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function POST(request, { params }) {
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
        const body = await request.json();
        const { type = "Double", amenities, pricePerNight, images, available = "true" } = body;

        if (!type || !amenities || !pricePerNight || !images) {
            return NextResponse.json({ error: "type, amenities, pricePerNight, and images are required" },{
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;
        const parsedImages = typeof images === "string" ? JSON.parse(images) : images;
        const parsedPrice = parseFloat(pricePerNight);
        const parsedAvailable = typeof available === "boolean" ? available : available === "true";
        
        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(id, 10) },
        });
        
        if (hotel.ownerId != decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        const newRoom = await prisma.room.create({
            data: {
                type,
                amenities: parsedAmenities,
                pricePerNight: parsedPrice,
                images: parsedImages,
                available: parsedAvailable,
                hotel: { connect: { id: parseInt(id, 10) } },
            },
        });

        return NextResponse.json({ room: newRoom }, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" },{
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

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
        const { id } = await params;
        const body = await request.json();
        const { roomId, type, amenities, pricePerNight, images, available } = body;

        const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;
        const parsedImages = typeof images === "string" ? JSON.parse(images) : images;
        const parsedPrice = parseFloat(pricePerNight);
        const parsedAvailable = typeof available === "boolean" ? available : available === "true";
        
        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(id, 10) },
        });
        
        if (hotel.ownerId != decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        const updateData = {
            ...(type !== undefined && type !== null && { type }),
            ...(amenities !== undefined && { amenities: parsedAmenities }),
            ...(images !== undefined && { images: parsedImages }),
            ...(pricePerNight !== undefined && !isNaN(parsedPrice) && { pricePerNight: parsedPrice }),
            ...(available !== undefined && { available: parsedAvailable }),
        };

        const updatedRoom = await prisma.room.update({
            where: { id: roomId },
            data: updateData,
        });

        return NextResponse.json({ room: updatedRoom },{
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error updating hotel:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}