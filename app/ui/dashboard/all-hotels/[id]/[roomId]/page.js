"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "../../../usercontext";
import { useTheme } from "../../../themecontext";
import Image from "next/image";
import { fetchWithAuth } from "@/utils/auth";

export default function VisitorRoomDetails() {
    const { id, roomId } = useParams();
    const { theme } = useTheme();
    const { userRole } = useUser(); 
    const router = useRouter();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");

    const storedBookingId = localStorage.getItem("currentBookingId");
    const bookingId = storedBookingId ? parseInt(storedBookingId, 10) : null;

    // Fetch room details
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await fetch(`/api/visitor/hotels/${id}/${roomId}`, {
                    method: "GET",
                    credentials: "include",
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch room details.");
                }
                setRoom(data.room);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [id, roomId]);

    // Scroll to top on error so the user sees the message
    useEffect(() => {
        if (error) {
            window.scrollTo(0, 0);
        }
    }, [error]);

    // Booking logic: update existing booking if bookingId exists; otherwise, create one.
    const handleBookRoom = async () => {
        if (!checkIn || !checkOut) {
            setError("Please select both check-in and check-out dates.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                roomBookingInfo: JSON.stringify({
                    roomId: room.id,
                    type: room.type,
                    pricePerNight: room.pricePerNight,
                    amenities: room.amenities,
                    checkIn,
                    checkOut,
                    hotelId: room.hotelId,
                }),
            };

            let res;
            let bookingData;
            if (bookingId) {
                // Update (patch) the existing booking if a bookingId exists.
                res = await fetchWithAuth("/api/user/booking/edit", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        bookingId: parseInt(bookingId),
                        ...payload,
                        checkIn,
                        checkOut,
                        hotelId: room.hotelId,
                        roomId: room.id,
                    }),
                });
                bookingData = await res.json();
            } else {
                // Otherwise, create a new room booking.
                res = await fetchWithAuth("/api/user/booking/create/combined", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                bookingData = await res.json();
                localStorage.setItem("currentBookingId", bookingData.id);
            }
            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(bookingData.error || "Failed to book room.");
            }
            router.push("/ui/dashboard/booking");
        } catch (error) {
            setError(error.message || "Failed to create booking. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

    if (!room) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="text-lg font-medium">
                    Room not found
                </div>
            </div>
        );
    }

    return (
        <div className={`max-w-5xl mx-auto p-6 rounded-2xl shadow-lg space-y-6 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
            {/* Display any error message at the top */}
            {error && <div className="text-red-500">{error}</div>}
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{room.type}</h2>
                    <p className={`text-lg font-medium ${
                        room.available ? "text-green-500" : "text-red-500"
                    }`}>
                        {room.available ? "Available" : "Not Available"}
                    </p>
                    <p className={`text-lg mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                        <span className="font-semibold">${room.pricePerNight}</span> / night
                    </p>
                </div>
            </div>

            <div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Amenities</h3>
                <ul className={`grid grid-cols-1 gap-2 text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                }`}>
                    {room.amenities.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <span>•</span> {item}
                        </li>
                    ))}
                </ul>
            </div>

            {room.images?.length > 0 && (
                <div>
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Photos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {room.images.map((image, index) => (
                            <Image
                                key={index}
                                src={image}
                                alt={`Room Image ${index + 1}`}
                                width={2880}
                                height={1624}
                                className="w-full h-full object-cover rounded-lg shadow-sm"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Date Inputs for booking */}
            {(userRole === "USER" || userRole === "HOTEL_OWNER") && room.available && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="checkIn" className={`block font-semibold mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                            Check-In Date
                        </label>
                        <input
                            type="date"
                            id="checkIn"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className={`w-full border rounded-lg p-2 ${
                                theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                            }`}
                        />
                    </div>

                    <div>
                        <label htmlFor="checkOut" className={`block font-semibold mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                            Check-Out Date
                        </label>
                        <input
                            type="date"
                            id="checkOut"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className={`w-full border rounded-lg p-2 ${
                                theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                            }`}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
                {(userRole === "USER" || userRole === "HOTEL_OWNER") && room.available && (
                    <button
                        onClick={handleBookRoom}
                        className={`py-2 px-5 rounded-lg transition ${
                            theme === 'dark' 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                    >
                        Book Room
                    </button>
                )}
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
