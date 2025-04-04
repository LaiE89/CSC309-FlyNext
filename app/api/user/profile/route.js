import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { prisma } from "@/utils/db";

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
        const user = await prisma.user.findUnique({
            where: { email: decoded.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User does not exist" },{
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        return NextResponse.json({ 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email, 
            role: user.role, 
            profilePicture: user.profilePicture, 
            phone: user.phone 
        },{
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
        const { firstName, lastName, profilePicture, phone } = body;

        const updatedUser = await prisma.user.update({
            where: { email: decoded.email },
            data: { firstName, lastName, profilePicture, phone },
        });

        return NextResponse.json({
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            profilePicture: updatedUser.profilePicture,
            phone: updatedUser.phone,
        },{
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}