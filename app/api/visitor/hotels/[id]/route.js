import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request, { params }) { 
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const roomsParam = url.searchParams.get("rooms");
        if (!id) return NextResponse.json({ error: "Hotel ID is required" }, { 
            status: 400,
            headers: { "Content-Type": "application/json" }, 
        });

        const hotel = await prisma.hotel.findUnique({
            where: { id: parseInt(id, 10) },
        });

        let filteredRooms;
        if (roomsParam) {
            const roomIds = roomsParam.split(",").map(Number);
            filteredRooms = await prisma.room.findMany({
                where: {
                    hotelId: parseInt(id, 10),
                    id: { in: roomIds },
                },
            });
        } 
        const allRooms = await prisma.room.findMany({
            where: { hotelId: parseInt(id, 10) },
        });

        if (!hotel) return NextResponse.json({ error: "Hotel not found" }, { 
            status: 404,
            headers: { "Content-Type": "application/json" }, 
        });

        return NextResponse.json({ hotel, allRooms, filteredRooms }, { 
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