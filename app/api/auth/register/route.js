import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, role = "USER" } = body;

        if (!email || !password || !firstName || !lastName || !role) {
            return NextResponse.json({ error: "email, password, firstName, lastName, and role are required" },{
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const emailExists = await prisma.user.findUnique({
            where: { email: email },
        });

        if (emailExists) {
            return NextResponse.json({ error: "Email already exists" },{
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        const hashedPassword = hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                firstName: firstName,
                lastName: lastName,
                role: role
            },
        });
        
        return NextResponse.json({ user: user },{
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