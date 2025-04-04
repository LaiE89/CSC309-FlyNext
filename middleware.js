import { NextResponse } from "next/server";

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;
    if (pathname.startsWith("/api/visitor")) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/api/visitor/:path*", "/api/user/:path*", "/api/hotel-owner/:path*"],
};
