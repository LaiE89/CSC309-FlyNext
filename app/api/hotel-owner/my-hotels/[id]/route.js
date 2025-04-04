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

        if (!id) return NextResponse.json({ error: "Hotel ID is required" }, { 
            status: 400,
            headers: { "Content-Type": "application/json" }, 
        });

        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(id, 10) },
        });

        const rooms = await prisma.room.findMany({
            where: { hotelId: parseInt(id, 10) },
        });

        if (!hotel) return NextResponse.json({ error: "Hotel not found" }, { 
            status: 404,
            headers: { "Content-Type": "application/json" }, 
        });

        return NextResponse.json({ hotel, rooms }, { 
            status: 200,
            headers: { "Content-Type": "application/json" }, 
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { 
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}