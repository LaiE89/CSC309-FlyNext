import { prisma } from "@/utils/db";
import { NextResponse } from 'next/server';
import { verifyToken } from "@/utils/auth";

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
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("bookingId");
        if (!bookingId) {
            return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
        });
        if (!booking || booking.userId !== decoded.id) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Ensure flightBookingInfo exists
        if (!booking.flightBookingInfo) {
            return NextResponse.json(
                { verified: false, message: "No flight booking info available" },
                { status: 200 }
            );
        }
        // Parse the stored flight information
        let flightData;
        try {
            flightData = JSON.parse(booking.flightBookingInfo);
        } catch (parseError) {
            return NextResponse.json(
                { verified: false, message: "Invalid flight booking info" },
                { status: 400 }
            );
        }

        if (!flightData.flights || !Array.isArray(flightData.flights) || flightData.flights.length === 0) {
            return NextResponse.json(
                { verified: false, message: "No flights found in booking info" },
                { status: 400 }
            );
        }

        const afsBaseUrl = process.env.AFS_URL;
        const afsApiKey = process.env.AFS_API_KEY;
        if (!afsApiKey) {
            return NextResponse.json({ error: "AFS API Key not configured" }, { status: 500 });
        }

        const verificationPromises = flightData.flights.map(async (flight) => {
            if (!flight.flightid) {
                throw new Error("Flight id missing in one of the flights");
            }
            const flightUrl = `${afsBaseUrl}/api/flights/${encodeURIComponent(flight.flightid)}`;
            const response = await fetch(flightUrl, {
                headers: {
                    "x-api-key": afsApiKey,
                },
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`AFS API error for flight ${flight.flightid}: ${errText}`);
            }
            const data = await response.json();
            return data;
        });

        let afsDataArray;
        try {
            afsDataArray = await Promise.all(verificationPromises);
        } catch (error) {
            return NextResponse.json({ error: "Error verifying flights" }, { status: 500 });
        }

        const allConfirmed = afsDataArray.every((data) => data.status === "SCHEDULED");
        if (!allConfirmed) {
            const notConfirmedFlight = afsDataArray.find((data) => data.status !== "SCHEDULED");
            return NextResponse.json(
                { verified: false, message: `Flight ${notConfirmedFlight.flightNumber} is not confirmed: ${notConfirmedFlight.status}` },
                { status: 200 }
            );
        }

        return NextResponse.json({ verified: true }, { status: 200 });
        
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}