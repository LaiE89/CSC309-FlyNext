"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import { useTheme } from "../../../themecontext";

export default function HotelBookings() {
    const { id } = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [bookings, setBookings] = useState([]);
    const [roomAvailability, setRoomAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        roomType: "",
    });

    useEffect(() => {
        fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters);
            const res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/bookings?${queryParams}`, {
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

            setBookings(data.bookings);
            setRoomAvailability(data.roomAvailability || []);
        } catch (error) {
            setError(error.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeleteBooking = async (bookingId, roomType) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;

        try {
            const res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/bookings/${bookingId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(data.error);
            }

            setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
            setRoomAvailability((prev) =>
                prev.map((room) =>
                    room.type === roomType ? { ...room, available: room.available + 1 } : room
                )
            );
            setSuccess("Booking deleted successfully!");
        } catch (error) {
            setError(error.message || "An error occurred.");
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

    return (
        <div className={`max-w-5xl mx-auto p-6 rounded-2xl shadow-lg space-y-6 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Hotel Bookings</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                    <label htmlFor="startDate" className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Check-in Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className={`border rounded-lg p-2 ${
                            theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-gray-300 text-black'
                        }`}
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="endDate" className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Check-out date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className={`border rounded-lg p-2 ${
                            theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-gray-300 text-black'
                        }`}
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="roomType" className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Room Type
                    </label>
                    <input
                        type="text"
                        id="roomType"
                        name="roomType"
                        value={filters.roomType}
                        onChange={handleFilterChange}
                        placeholder="Room Type"
                        className={`border rounded-lg p-2 ${
                            theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-gray-300 text-black'
                        }`}
                    />
                </div>

                <div className="flex items-end">
                    <button
                    onClick={fetchBookings}
                    className={`w-full px-4 py-2 rounded-lg transition ${
                        theme === 'dark' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    >
                    Apply Filters
                    </button>
                </div>
            </div>

            {/* Room Availability */}
            <div>
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Room Availability</h3>
                <div className={`overflow-x-auto rounded-lg border ${
                    theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`}>
                    <table className={`table-fixed w-full text-sm text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                        <tr>
                            <th className={`w-1/2 px-4 py-2 text-left font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-black'
                            }`}>Room Type</th>
                            <th className={`w-1/2 px-4 py-2 text-left font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-black'
                            }`}>Number of Available Rooms</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {roomAvailability.length > 0 ? (
                            roomAvailability.map((room) => (
                            <tr key={room.type} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>{room.type}</td>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>{room.available}</td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className={`px-4 py-2 text-center ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-black'
                                }`}>
                                    No available rooms found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bookings Table */}
            <div>
                <h3 className={`text-xl font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>Bookings</h3>

                {bookings.length === 0 ? (
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No bookings found.</p>
                ) : (
                    <div className={`overflow-x-auto rounded-lg border ${
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                        <table className={`min-w-full text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-black'
                        }`}>
                        <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                            <tr>
                                <th className={`px-4 py-2 text-left font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                }`}>Guest ID</th>
                                <th className={`px-4 py-2 text-left font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                }`}>Room ID</th>
                                <th className={`px-4 py-2 text-left font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                }`}>Room Type</th>
                                <th className={`px-4 py-2 text-left font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                }`}>Check-in</th>
                                <th className={`px-4 py-2 text-left font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                }`}>Check-out</th>
                                <th className={`px-4 py-2 text-left font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-black'
                                }`}>Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bookings.map((booking) => (
                            <tr key={booking.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>{booking.userId}</td>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>{booking.roomId}</td>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>{booking.room?.type || "N/A"}</td>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                                    {new Date(booking.checkIn).toLocaleDateString()}
                                </td>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                                    {new Date(booking.checkOut).toLocaleDateString()}
                                </td>
                                <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-black'}`}>
                                    <button
                                        onClick={() => handleDeleteBooking(booking.id, booking.room?.type)}
                                        className={`px-3 py-1.5 rounded transition text-sm ${
                                            theme === 'dark' 
                                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                : 'bg-red-500 hover:bg-red-600 text-white'
                                        }`}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-red-900/50' : 'bg-red-100'
                }`}>
                    <p className="text-red-500">{error}</p>
                </div>
            )}
            {success && (
                <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                    <p className="text-green-500">{success}</p>
                </div>
            )}

            <button
                onClick={() => router.back()}
                className={`mt-4 py-2 px-4 rounded-lg transition ${
                    theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
                }`}
            >
                Go Back
            </button>
        </div>
    );
}
