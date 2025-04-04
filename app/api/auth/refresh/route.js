import { NextResponse } from "next/server";
import { verifyToken, generateToken, getTokenExpiry } from "@/utils/auth";

export async function POST(request) {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    const token = verifyToken(refreshToken, false);

    if (!token) {
        return NextResponse.json({ error: "Refresh Token Expired" },{
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Generate a new access token with the same payload
    const payload = {
        id: token.id,
        email: token.email,
        role: token.role,
        expiresAt: Math.floor(Date.now() / 1000) + getTokenExpiry(true),
    };
    const accessToken = generateToken(payload, true);

    const response = NextResponse.json({
        status: 200,
        headers: { "Content-Type": "application/json" },
    });

    response.headers.set(
        "Set-Cookie",
        `token=${accessToken}; HttpOnly; Path=/; Max-Age=${getTokenExpiry(false)}; Secure`
    );

    return response;
}