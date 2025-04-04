"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "../themecontext";

function AllHotels() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme } = useTheme();
    const initialCheckIn = searchParams.get("checkIn") || "";
    const initialCheckOut = searchParams.get("checkOut") || "";
    const initialCity = searchParams.get("city") || "";
    const initialName = searchParams.get("name") || "";
    const initialStarRating = searchParams.get("starRating") || "";
    const initialMinPrice = searchParams.get("minPrice") || "";
    const initialMaxPrice = searchParams.get("maxPrice") || "";
    const initialAscending = searchParams.get("priceAscending") === "true";
    const initialPage = searchParams.get("page") || 0;

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter form state
    const [city, setCity] = useState(initialCity);
    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [checkOut, setCheckOut] = useState(initialCheckOut);
    const [name, setName] = useState(initialName);
    const [starRating, setStarRating] = useState(initialStarRating);
    const [minPrice, setMinPrice] = useState(initialMinPrice);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
    const [isAscending, setIsAscending] = useState(initialAscending);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const itemsPerPage = 9;

    const fetchHotels = async () => {
        setLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (checkIn) params.append("checkIn", checkIn);
            if (checkOut) params.append("checkOut", checkOut);
            if (city) params.append("city", city);
            if (name) params.append("name", name);
            if (starRating) params.append("starRating", starRating);
            if (minPrice) params.append("minPrice", minPrice);
            if (maxPrice) params.append("maxPrice", maxPrice);
            if (isAscending) params.append("priceAscending", isAscending);

            const res = await fetch(`/api/visitor/hotels?${params.toString()}`, {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error("Failed to fetch hotels.");
            }
            const data = await res.json();
            setHotels(data.hotels || []);
            setCurrentPage(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on component mount using query params
    useEffect(() => {
        fetchHotels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle filter form submission
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchHotels();
        const params = new URLSearchParams(searchParams);
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        if (city) params.set("city", city);
        if (name) params.set("name", name);
        if (starRating) params.set("starRating", starRating);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (typeof isAscending === 'boolean') {
            params.set("priceAscending", isAscending.toString());
        }
        if (currentPage) params.set("page", currentPage);
        router.push(`?${params.toString()}`, { scroll: false });
    };
    
    // Navigation for pagination
    const indexOfLastHotel = (currentPage + 1) * itemsPerPage;
    const indexOfFirstHotel = currentPage * itemsPerPage;
    const currentHotels = hotels?.slice(indexOfFirstHotel, indexOfLastHotel);

    const nextPage = () => {
        if (indexOfLastHotel < hotels?.length) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Update the URL query parameters when any pagination state changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        params.set("page", currentPage);
        if (params.get("page") !== searchParams.get("page")) {
            router.push(`?${params.toString()}`, { shallow: true, scroll: false });
        }
    }, [currentPage, searchParams, router]);

    if (loading) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="text-lg font-medium animate-pulse">
                    Loading hotels...
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="px-6 py-4 rounded-md shadow-md bg-white">
                    <p className="font-semibold text-red-500">Error:</p>
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="hover:underline cursor-pointer mt-2 text-red-500"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`max-w-7xl mx-auto p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h2 className="text-3xl font-bold mb-4">Available Hotels</h2>

            <form
                className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                onSubmit={handleFilterSubmit}
            >
                <div>
                    <label htmlFor="checkIn" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Check-In
                    </label>
                    <input
                        type="date"
                        id="checkIn"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label htmlFor="checkOut" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Check-Out
                    </label>
                    <input
                        type="date"
                        id="checkOut"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label htmlFor="city" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        City
                    </label>
                    <input
                        type="text"
                        id="city"
                        placeholder="Enter city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label htmlFor="name" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Hotel Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        placeholder="Enter hotel name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label htmlFor="starRating" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Star Rating
                    </label>
                    <input
                        type="number"
                        id="starRating"
                        placeholder="e.g., 5"
                        value={starRating}
                        onChange={(e) => setStarRating(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                        min="1"
                        max="5"
                    />
                </div>

                <div>
                    <label htmlFor="minPrice" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Min Price
                    </label>
                    <input
                        type="number"
                        id="minPrice"
                        placeholder="Min price per night"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label htmlFor="maxPrice" className={`block font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Max Price
                    </label>
                    <input
                        type="number"
                        id="maxPrice"
                        placeholder="Max price per night"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className={`mt-1 w-full border rounded-lg p-2 ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div className="flex items-center space-x-2 mt-6">
                    <input
                        type="checkbox"
                        id="isAscending"
                        checked={isAscending}
                        onChange={(e) => setIsAscending(e.target.checked)}
                        className={`h-4 w-4 rounded ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}
                    />
                    <label htmlFor="isAscending" className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Starting Price Ascending
                    </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        className={`px-6 py-2 rounded-lg transition ${
                            theme === 'dark' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        Search
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentHotels.map((hotel) => (
                    <Link key={hotel.id} href={`/ui/dashboard/all-hotels/${hotel.id}?rooms=${hotel.filteredRooms.join(",")}`}>
                        <div className={`rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition flex flex-col items-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                            <Image
                                src={hotel.logo || "/default-hotel-logo.png"}
                                alt={`${hotel.name} Logo`}
                                width={256}
                                height={256}
                                className="w-32 h-32 object-cover mb-3"
                            />
                            <h3 className={`text-lg font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{hotel.name}</h3>
                            <p className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>{hotel.starRating} Star</p>
                            <p className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                Starting at ${hotel.startingPrice || "N/A"}
                            </p>
                            <p className={`truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                {hotel.mapLocation || "N/A"}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="flex justify-center mt-6 space-x-4">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className={`py-2 px-4 rounded ${currentPage === 0 ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    Previous
                </button>
                <button
                    onClick={nextPage}
                    disabled={indexOfLastHotel >= hotels?.length}
                    className={`py-2 px-4 rounded ${indexOfLastHotel >= hotels?.length ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default function AllHotelsPage() {
    return (
        <Suspense>
            <AllHotels />
        </Suspense>
    )
}