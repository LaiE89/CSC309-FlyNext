import { NextResponse } from "next/server";
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
        const body = await request.json();
        const { name, logo, address, city, country, starRating = 1, images } = body;

        if (!name || !address || !city || !country || !images) {
            return NextResponse.json({ error: "The name, address, city, country, and images are required" },{
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const selectedCity = await prisma.city.findFirst({
            where: { city: city, country: country }
        })
        if (!selectedCity) {
            return NextResponse.json({ error: "Input city and country do not exist" },{
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        let isRoleChanged = false;
        if (decoded.role !== "HOTEL_OWNER") isRoleChanged = true;

        const updatedUser = await prisma.user.update({
            where: { email: decoded.email },
            data: {
                role: "HOTEL_OWNER",
            }
        });

        const newHotel = await prisma.hotel.create({
            data: {
                name,
                logo,
                address,
                starRating,
                images,
                owner: { connect: { id: decoded.id } },
                cityRelation: { connect: { city_country: { city, country } } },
            },
        });

        return NextResponse.json({ user: updatedUser, isRoleChanged: isRoleChanged, hotel: newHotel }, {
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
        const { id, name, logo, address, city, country, starRating, images } = body;

        if (!id) {
            return NextResponse.json({ error: "Hotel id is missing" }, { status: 400 });
        }

        const updateData = {
            ...(name !== undefined && name !== null && { name }),
            ...(logo !== undefined && logo !== null && { logo }),
            ...(address !== undefined && address !== null && { address }),
            ...(city !== undefined && city !== null && { city }),
            ...(country !== undefined && country !== null && { country }),
            ...(starRating !== undefined && starRating !== null && { starRating }),
            ...(images !== undefined && images !== null && { images }),
        };
        
        const updatedHotel = await prisma.hotel.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            name: updatedHotel.name,
            logo: updatedHotel.logo,
            address: updatedHotel.address,
            city: updatedHotel.city,
            country: updatedHotel.country,
            starRating: updatedHotel.starRating,
            images: updatedHotel.images
        },{
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error updating hotel:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}