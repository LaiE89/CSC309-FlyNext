import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { generateToken, comparePassword, getTokenExpiry } from "@/utils/auth";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, isVisitor } = body;
        const parseIsVisitor = typeof isVisitor === "boolean" ? isVisitor : isVisitor === "true";

        if (parseIsVisitor) {
            const response = NextResponse.json({
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

            // Clear cookies
            response.headers.set(
                "Set-Cookie",
                `token=; HttpOnly; Path=/; Max-Age=0; Secure`
            );
            response.headers.append(
                "Set-Cookie",
                `refresh_token=; HttpOnly; Path=/; Max-Age=0; Secure`
            );
            return response;
        }

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            return NextResponse.json({ error: "User with this email does not exist" },{
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const isPasswordValid = comparePassword(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Password is invalid" },{
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            expiresAt: Math.floor(Date.now() / 1000) + getTokenExpiry(true),
        };
        
        const accessToken = generateToken(payload, true);
        const refreshToken = generateToken(payload, false);
        
        const response = NextResponse.json({
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
        response.headers.set(
            "Set-Cookie",
            `token=${accessToken}; HttpOnly; Path=/; Max-Age=${getTokenExpiry(true)}; Secure`
        );

        response.headers.append(
            "Set-Cookie",
            `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=${getTokenExpiry(false)}; Secure`
        );

        return response;

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" },{
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}