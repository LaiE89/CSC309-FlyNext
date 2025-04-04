import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

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
        const cacheKey = `badge:${decoded.id}`;
        const cached = cache.get(cacheKey);
        const now = Date.now();

        // Return cached value if it exists and is not expired
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            return NextResponse.json(
                { unreadCount: cached.count },
                { 
                    status: 200,
                    headers: {
                        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
                        'X-Cache': 'HIT'
                    }
                }
            );
        }

        // Fetch fresh count
        const count = await prisma.notification.count({
            where: {
                userId: decoded.id,
                isRead: false,
            },
        });

        // Update cache
        cache.set(cacheKey, {
            count,
            timestamp: now
        });

        return NextResponse.json(
            { unreadCount: count },
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
                    'X-Cache': 'MISS'
                }
            }
        );
    } catch (err) {
        console.error("Unread Notifications Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
