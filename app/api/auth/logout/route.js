import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({
        status: 200,
        headers: { "Content-Type": "application/json" },
    });

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