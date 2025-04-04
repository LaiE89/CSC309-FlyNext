import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json(
            { error: "Missing query parameter" },
            { status: 400 }
        );
    }

    // Execute both queries concurrently
    try {
        const [cityResults, airportResults] = await Promise.all([
            prisma.city.findMany({
                where: {
                    city: {
                        startsWith: query,
                    },
                },
                take: 5,
            }),
            prisma.airport.findMany({
            where: {
                code: {
                    startsWith: query,
                },
            },
                take: 5,
            }),
        ]);
        const cityNames = cityResults.map(item => item.city);
        const airportCodes = airportResults.map(item => item.code);
        const suggestions = [...cityNames, ...airportCodes].slice(0, 5);
      
        return NextResponse.json({ suggestions }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
