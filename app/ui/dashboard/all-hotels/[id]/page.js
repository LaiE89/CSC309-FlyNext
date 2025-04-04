"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Image from "next/image";
import { useTheme } from "../../themecontext";

function VisitorHotel() {
    const { id } = useParams();
    const { theme } = useTheme();
    const searchParams = useSearchParams();
    const roomsParam = searchParams.get('rooms');
    const router = useRouter();
    const [hotel, setHotel] = useState(null);
    const [allRooms, setAllRooms] = useState(null);
    const [filteredRooms, setFilteredRooms] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toggleFiltered, setToggleFiltered] = useState(true);

    useEffect(() => {
        const fetchHotel = async () => {
            try {
                const res = await fetch(`/api/visitor/hotels/${id}?rooms=${roomsParam}`, {
                    method: "GET",
                    credentials: "include",
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error);
                }

                setHotel(data.hotel);
                setAllRooms(data.allRooms || []);
                setFilteredRooms(data.filteredRooms || []);
            } catch (error) {
                setError(error.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchHotel();
    }, [id, roomsParam]);

    if (loading) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="text-lg font-medium animate-pulse">
                    Loading...
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

    if (!hotel) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="text-lg font-medium">
                    Hotel not found
                </div>
            </div>
        );
    }

    return (
        <div className={`max-w-5xl mx-auto p-6 rounded-2xl shadow-lg space-y-6 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{hotel.name}</h2>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{hotel.starRating} Star</p>
                </div>

                {hotel.logo && (
                    <Image 
                        src={hotel.logo} 
                        alt="Hotel Logo"
                        width={128}
                        height={128}
                        className={`w-32 h-32 object-cover rounded-xl border shadow-md ${
                            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                        }`}
                    />
                )}
            </div>

            <div>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Location</h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>{hotel.address}</p>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>{hotel.city}, {hotel.country}</p>
            </div>

            {hotel.images?.length > 0 && (
                <div>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Photos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {hotel.images.map((image, index) => (
                            <Image 
                                key={index} 
                                src={image} 
                                alt={`Hotel Image ${index + 1}`} 
                                width={2880} 
                                height={1624} 
                                className="w-full h-full object-cover rounded-lg shadow-sm"
                            />
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'} mb-2`}>
                    {toggleFiltered ? "Filtered Available Rooms" : "All Rooms"}
                </h3>

                {(toggleFiltered ? filteredRooms : allRooms).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(toggleFiltered ? filteredRooms : allRooms).map((room) => (
                            <div 
                                key={room.id} 
                                className={`p-4 border rounded-lg shadow cursor-pointer ${
                                    theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                                onClick={() => router.push(`/ui/dashboard/all-hotels/${id}/${room.id}`)}
                            >
                                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{room.type}</h3>
                                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>Price: ${room.pricePerNight} per night</p>
                                <p className={room.available ? "text-green-500" : "text-red-500"}>
                                    {room.available ? "Available" : "Not Available"}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>None</p>}
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
                <button
                    onClick={() => setToggleFiltered(!toggleFiltered)}
                    className={`py-2 px-5 rounded-lg transition ${
                        theme === 'dark' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                    {toggleFiltered ? "View All Rooms" : "View Filtered Rooms"}
                </button>
                <button
                    onClick={() => router.back()}
                    className={`py-2 px-5 rounded-lg transition ${
                        theme === 'dark' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

export default function VisitorHotelDetails() {
    return (
      <Suspense>
        <VisitorHotel />
      </Suspense>
    )
}