"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../themecontext";
import { fetchWithAuth } from "@/utils/auth";

export default function BookingContent() {
    const router = useRouter();
    const { theme } = useTheme();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const storedBookingId = localStorage.getItem("currentBookingId");
    let bookingId = storedBookingId ? parseInt(storedBookingId, 10) : null;

    const handleCartError = () => {
        localStorage.clear();
        router.back();
    }

    const handleStopBooking = () => {
        localStorage.clear();
        bookingId = null;
        setBooking(null);
    }

    const handleCheckout = () => {
        router.push(`/ui/dashboard/checkout?bookingId=${bookingId}`);
    };

    const handleViewHotels = () => {
        if (booking.mainDestination) {
            const params = new URLSearchParams();
            params.append("city", booking.mainDestination);
            router.push(`/ui/dashboard/all-hotels?${params.toString()}`);
        }
        else {
            router.push(`/ui/dashboard/all-hotels`);
        }
    };
    
    const handleViewFlights = () => {
        if (booking.hotel) {
            router.push(`/ui/dashboard/flights?location=${encodeURIComponent(booking.hotel.city)}`);
        }
        else {
            router.push(`/ui/dashboard/flights`);
        }
    };
    
    const fetchCurrentBookingData = async () => {
        setLoading(true);
        if (bookingId == null) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetchWithAuth(`/api/user/booking/retrieve?bookingId=${bookingId}`, {
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
            setBooking(data);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCurrentBookingData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        onClick={handleCartError}
                        className="hover:underline cursor-pointer mt-2 text-red-500"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }
    
    if (!booking) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="text-lg font-medium">
                    No booking in progress
                </div>
            </div>
        );
    }

    return (
        <div className={`p-5 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h1 className="text-2xl font-bold mb-4">Current Booking: ID {bookingId || "N/A"}</h1>            
            <div className="space-y-6">
                {/* Flight Information */}
                {booking.flight && (
                    <div className="border-b pb-4">
                        <h2 className="text-2xl font-semibold mb-2">Flight Details</h2>
                        {Array.isArray(booking.flight.flights) ? (
                            booking.flight.flights.map((flight, index) => (
                                <div key={index} className="mb-4 p-4 rounded">
                                    <p><strong>Flight {index + 1}:</strong></p>
                                    <p><strong>Flight Number:</strong> {flight.flightNumber}</p>
                                    <p><strong>Airline:</strong> {flight.airline}</p>
                                    <p><strong>From:</strong> {flight.origin}</p>
                                    <p><strong>To:</strong> {flight.destination}</p>
                                    <p><strong>Departure:</strong> {new Date(flight.departureTime).toLocaleString()}</p>
                                    <p><strong>Arrival:</strong> {new Date(flight.arrivalTime).toLocaleString()}</p>
                                    <p><strong>Status:</strong> {flight.status}</p>
                                    <p><strong>Price:</strong> ${flight.price}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 rounded">
                                <p><strong>Flight Number:</strong> {booking.flight.flightNumber}</p>
                                <p><strong>Airline:</strong> {booking.flight.airline}</p>
                                <p><strong>From:</strong> {booking.flight.origin}</p>
                                <p><strong>To:</strong> {booking.flight.destination}</p>
                                <p><strong>Departure:</strong> {new Date(booking.flight.departureTime).toLocaleString()}</p>
                                <p><strong>Arrival:</strong> {new Date(booking.flight.arrivalTime).toLocaleString()}</p>
                                <p><strong>Status:</strong> {booking.flight.status}</p>
                                <p><strong>Price:</strong> ${booking.flight.price}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Hotel Information */}
                {booking.hotel && (
                    <div className="border-b pb-4">
                        <h2 className="text-2xl font-semibold mb-2">Hotel Details</h2>
                        <div className="p-4 rounded">
                            <p><strong>Hotel:</strong> {booking.hotel.name}</p>
                            <p><strong>Location:</strong> {booking.hotel.city}</p>
                            {booking.booking.checkIn && (
                                <p><strong>Check-in:</strong> {new Date(booking.booking.checkIn).toLocaleDateString()}</p>
                            )}
                            {booking.booking.checkOut && (
                                <p><strong>Check-out:</strong> {new Date(booking.booking.checkOut).toLocaleDateString()}</p>
                            )}
                            {booking.room.type && (
                                <p><strong>Room Type:</strong> {booking.room.type}</p>
                            )}
                            {booking.room.pricePerNight && (
                                <p><strong>Room Type:</strong> {booking.room.pricePerNight}</p>
                            )}
                            {booking.nightsStayed && (
                                <p><strong>Nights Stayed:</strong> {booking.nightsStayed}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Total Price */}
                <div className="pt-4 pb-4">
                    <div className="flex justify-between items-center">
                        <p className="text-2xl font-semibold">Total Amount</p>
                        <p className="text-xl font-bold">
                            ${booking.price ? booking.price : 0}
                        </p>
                    </div>
                </div>
            </div>
            
            {bookingId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
                    <button
                        onClick={handleViewFlights}
                        className="w-full h-14 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Flight Suggestions
                    </button>
                    <button
                        onClick={handleViewHotels}
                        className="w-full h-14 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors shadow-sm"
                    >
                        Hotel Suggestions
                    </button>
                    <button
                        onClick={handleStopBooking}
                        className="w-full h-14 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Stop Booking
                    </button>
                    <button
                        onClick={handleCheckout}
                        className="w-full h-14 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-md"
                    >
                        Checkout
                    </button>
                </div>            
            )}
        </div>
    );
}
