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
        const { roomId } = await params;

        if (!roomId) return NextResponse.json({ error: "Room ID is required" }, { 
            status: 400,
            headers: { "Content-Type": "application/json" }, 
        });

        const room = await prisma.room.findUnique({
            where: { id: parseInt(roomId, 10) },
        });

        if (!room) return NextResponse.json({ error: "Room not found" }, { 
            status: 404,
            headers: { "Content-Type": "application/json" }, 
        });

        return NextResponse.json({ room }, { 
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