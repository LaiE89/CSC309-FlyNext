import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const tripType = searchParams.get('tripType') || 'one-way';
    const returnDate = searchParams.get('returnDate');

    if (!origin || !destination || !date) {
        return NextResponse.json(
            { error: "Origin, destination, and date are required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (origin == destination) {
        return NextResponse.json(
            { error: "Origin and destination must be different" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (tripType === 'round-trip' && !returnDate) {
        return NextResponse.json(
            { error: "Return date is required for round-trip flights" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (tripType === 'round-trip' && returnDate < date) {
        return NextResponse.json(
            { error: "Return date cannot be earlier than departure date" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const afsApiKey = process.env.AFS_API_KEY;
    const baseUrl = `${process.env.AFS_URL}/api/flights`;
    try {
        // Fetch outbound flights
        let outboundParams = new URLSearchParams({
            origin,
            destination,
            date,
        });
        let outboundResponse = await fetch(`${baseUrl}?${outboundParams.toString()}`, {
            method: 'GET',
            headers: {
                'x-api-key': afsApiKey,
            },
        });
        let outboundData = await outboundResponse.json();

        // If it's a one-way search, just return outbound results
        if (tripType === 'one-way') {
            return NextResponse.json(
                outboundData,
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        } 
        else {
            // For round-trip, fetch inbound flights
            let inboundParams = new URLSearchParams({
                origin: destination, 
                destination: origin, 
                date: returnDate
            });
            let inboundResponse = await fetch(`${baseUrl}?${inboundParams.toString()}`, {
                method: 'GET',
                headers: {
                    'x-api-key': afsApiKey,
                },
            });
            let inboundData = await inboundResponse.json();

            return NextResponse.json({
                    outbound: outboundData,
                    inbound: inboundData
                },
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

