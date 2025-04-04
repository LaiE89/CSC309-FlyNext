"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import Image from "next/image";
import { useTheme } from "../../themecontext";

export default function HotelDetails({ params }) {
    const { id } = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHotel = async () => {
            try {
                const res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}`, {
                    method: "GET",
                    credentials: "include",
                });

                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 440) {
                        router.push("/ui/error/session-expired");
                    }
                    throw new Error(data.error);
                }

                setHotel(data.hotel);
                setRooms(data.rooms);
            } catch (error) {
                setError(error.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchHotel();
    }, [id, router]);

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
                <div className={`px-6 py-4 rounded-md shadow-md ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                    <p className="font-semibold text-red-500">Error:</p>
                    <p>{error}</p>
                    <button
                        onClick={() => router.back()}
                        className={`hover:underline cursor-pointer mt-2 ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}
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
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    Rooms
                </h3>

                {rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rooms.map((room) => (
                            <div 
                                key={room.id} 
                                className={`p-4 border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer ${
                                    theme === 'dark' 
                                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                                        : 'bg-gray-50 border-gray-200 hover:bg-white'
                                }`}
                                onClick={() => router.push(`/ui/dashboard/my-hotels/${id}/${room.id}`)}
                            >
                                <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ID {room.id} - {room.type}</h4>
                                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>
                                    Price: <span className="font-medium">${room.pricePerNight}</span> / night
                                </p>
                                <p className={room.available ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                                    {room.available ? "Available" : "Not Available"}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={theme === 'dark' ? 'text-gray-400 italic' : 'text-gray-600 italic'}>No rooms available.</p>
                )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
                <button
                    onClick={() => router.push(`/ui/dashboard/my-hotels/${id}/bookings`)}
                    className={`py-2 px-5 rounded-lg transition ${
                        theme === 'dark' 
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                >
                    Bookings
                </button>
                <button
                    onClick={() => router.push(`/ui/dashboard/my-hotels/${id}/add-room`)}
                    className={`py-2 px-5 rounded-lg transition ${
                        theme === 'dark' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                    Add Room
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