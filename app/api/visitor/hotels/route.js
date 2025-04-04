import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const checkInParam = searchParams.get("checkIn");
        const checkOutParam = searchParams.get("checkOut");
        const city = searchParams.get("city");
        const name = searchParams.get("name");
        const starRating = searchParams.get("starRating");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const priceAscending = searchParams.get("priceAscending");

        // Parse dates
        const checkInDate = checkInParam ? new Date(checkInParam) : null;
        const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;
        const parsedPriceAsc = typeof priceAscending === "boolean" ? priceAscending : priceAscending === "true";

        // Build hotel filters
        const hotelFilters = {};
        if (city) hotelFilters.city = { contains: city };
        if (name) hotelFilters.name = { contains: name };
        if (starRating) hotelFilters.starRating = parseInt(starRating, 10);

        // Making sure the hotel has at least one room that is available, within price range, no current bookings that overlap the input dates
        hotelFilters.rooms = {
            some: {
                available: true,
                ...(minPrice || maxPrice
                    ? {
                          pricePerNight: {
                              ...(minPrice ? { gte: Number(minPrice) } : {}),
                              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
                          },
                      }
                    : {}),
                ...(checkInDate && checkOutDate
                    ? {
                          bookings: {
                              none: {
                                  AND: [
                                      { checkIn: { lt: checkOutDate } },
                                      { checkOut: { gt: checkInDate } },
                                  ],
                              },
                          },
                      }
                    : {}
                ),
            },
        };

        // Fetch hotels with their available rooms (filtered and ordered by price)
        const hotels = await prisma.hotel.findMany({
            where: hotelFilters,
            include: {
                rooms: {
                    where: {
                        available: true,
                        ...(minPrice || maxPrice
                            ? {
                                  pricePerNight: {
                                      ...(minPrice ? { gte: Number(minPrice) } : {}),
                                      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
                                  },
                              }
                            : {}),
                        ...(checkInDate && checkOutDate
                            ? {
                                  bookings: {
                                      none: {
                                          AND: [
                                              { checkIn: { lt: checkOutDate } },
                                              { checkOut: { gt: checkInDate } },
                                          ],
                                      },
                                  },
                              }
                            : {}),
                    },
                    orderBy: { pricePerNight: 'asc' },
                },
            },
        });

        const hotelsOnlyAvailable = await prisma.hotel.findMany({
            where: hotelFilters,
            include: {
                rooms: {
                    where: {
                        available: true,
                    },
                    orderBy: { pricePerNight: 'asc' },
                },
            },
        });

        const results = hotels.map((hotel) => {
            const matchedHotel = hotelsOnlyAvailable.find(h => h.id === hotel.id);
            const startingPrice =
                matchedHotel && matchedHotel.rooms.length > 0
                    ? matchedHotel.rooms[0].pricePerNight
                    : null;
            return {
                ...hotel,
                startingPrice,
                mapLocation: hotel.city.concat(", ", hotel.country),
                filteredRooms: hotel.rooms.map((room) => room.id),
            };
        });
        let sortedResults;
        if (parsedPriceAsc) {
            sortedResults = results.sort((a, b) => {
                const priceA = a.startingPrice !== null ? a.startingPrice : Infinity;
                const priceB = b.startingPrice !== null ? b.startingPrice : Infinity;
                return priceA - priceB;
            });
        }
        else {
            sortedResults = results.sort((a, b) => {
                const priceA = a.startingPrice !== null ? a.startingPrice : Infinity;
                const priceB = b.startingPrice !== null ? b.startingPrice : Infinity;
                return priceB - priceA;
            });
        }

        return NextResponse.json(
            { hotels: sortedResults }, {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" }, {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
