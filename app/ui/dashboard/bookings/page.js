"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import { useTheme } from "../themecontext";

export default function BookingsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState(null);
    const [verifiedBookings, setVerifiedBookings] = useState([]);

    // Fetch all bookings for this user
    const getBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth("/api/user/booking/user", { method: "GET", credentials: "include", });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(data.error);
            }

            // Sort bookings with most recent first
            data.sort((a, b) => (a.id < b.id ? 1 : -1));
            setBookings(data);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        getBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handler for verifying flights
    const handleVerify = async (bookingId) => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(
                `/api/user/booking/verify?bookingId=${encodeURIComponent(bookingId)}`,
                { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
            );
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(data.error);
            }
            setVerificationResult(data.message || "Verification complete");

            // Mark this booking id as verified so that the ID cell displays in blue with "(Verified)"
            setVerifiedBookings((prev) => [...prev, Number(bookingId)]);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleModifyBooking = async (booking) => {
        if (booking.bookStatus !== "PENDING") return;
        localStorage.setItem("currentBookingId", booking.id);
        router.push("/ui/dashboard/booking");
    };

    // Cancel combined call
    const handleCancelCombined = async (bookingId, cancelType) => {
        setLoading(true);
        try {
            const res = await fetchWithAuth("/api/user/booking/cancel/combined", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ bookingId, cancelType }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(data.error || "Failed to cancel booking portion");
            }
            // Refetch the bookings once the cancellation is done
            await getBookings();
            // If flight portion is canceled, remove it from verified as well
            if (cancelType === "flight" || cancelType === "both") {
                setVerifiedBookings((prev) =>
                    prev.filter((id) => Number(id) !== Number(bookingId))
                );
            }
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Cancel flight, room, or entire booking
    const handleCancelFlight = (bookingId) => {
        handleCancelCombined(bookingId, "flight");
    };

    const handleCancelHotel = (bookingId) => {
        handleCancelCombined(bookingId, "room");
    };

    const handleCancelEntire = (bookingId) => {
        handleCancelCombined(bookingId, "both");
    };

    // Info display helpers
    const getFlightInfoDisplay = (booking) =>
        booking.flightBookingInfo ? "Flight Scheduled" : "No Flight Booked";

    const getHotelInfoDisplay = (booking) =>
        booking.hotelId ? "Hotel Booked" : "No Hotel Booked";

    const getDatesDisplay = (booking) => {
        let flightDates = "";
        if (booking.flightBookingInfo) {
            try {
                const flightInfo = JSON.parse(booking.flightBookingInfo);
                if (flightInfo.flights && flightInfo.flights.length > 0) {
                    const firstFlight = flightInfo.flights[0];
                    const lastFlight = flightInfo.flights[flightInfo.flights.length - 1];
                    flightDates = `${new Date(firstFlight.departureTime).toLocaleDateString()} - ${new Date(lastFlight.arrivalTime).toLocaleDateString()}`;
                }
            } catch (error) {
                flightDates = "Invalid flight data";
            }
        }
        let hotelDates = "";
        if (booking.checkIn && booking.checkOut) {
            hotelDates = `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`;
        }
        return (
            <>
                {flightDates && (
                    <div key={`flight-${booking.id}`}>
                        Flight Dates: {flightDates}
                    </div>
                )}
                {hotelDates && (
                    <div key={`hotel-${booking.id}`}>
                        Hotel Dates: {hotelDates}
                    </div>
                )}
                {!flightDates && !hotelDates && <div key={`none-${booking.id}`}>N/A</div>}
            </>
        );
    };

    if (loading) {
        return (
            <div className={`flex justify-center items-center h-64 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <div className="text-lg font-medium animate-pulse">
                    Loading Bookings...
                </div>
            </div>
        );
    }

    return (
        <div className={`max-w-4xl mx-auto p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
            {error && <p className="text-red-500">Error: {error}</p>}
            {verificationResult && (
                <p className="text-blue-500">{verificationResult}</p>
            )}
            {bookings.length === 0 ? (
                <p>No bookings found.</p>
            ) : (
                <div className="overflow-y-auto max-h-[700px]">
                    <table className="w-full border-collapse table-auto">
                        <thead>
                            <tr className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <th className="p-3 text-left min-w-[100px]">Booking ID</th>
                            <th className="p-3 text-left min-w-[100px]">Status</th>
                            <th className="p-3 text-left min-w-[100px]">Flight</th>
                            <th className="p-3 text-left min-w-[100px]">Hotel</th>
                            <th className="p-3 text-left min-w-[220px] whitespace-nowrap">Dates</th>
                            <th className="p-3 text-left min-w-[170px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => {
                                const { id, flightBookingInfo, hotelId, bookStatus } = booking;
                                const flightInfoDisplay = getFlightInfoDisplay(booking);
                                const hotelInfoDisplay = getHotelInfoDisplay(booking);
                                const infoDisplay = `${flightInfoDisplay} / ${hotelInfoDisplay}`;
                                const isCancelled = bookStatus === "CANCELLED";
                                const isPending = bookStatus === "PENDING";
                                const isVerified = verifiedBookings.includes(Number(id));

                                return (
                                    <tr 
                                        key={id} 
                                        className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                                    >
                                        <td className="p-2">
                                            {id}
                                            {isVerified && (
                                                <span className="text-blue-500 ml-1">(Verified)</span>
                                            )}
                                        </td>
                                        <td className="p-2">{bookStatus}</td>
                                        <td className="p-2">{flightInfoDisplay}</td>
                                        <td className="p-2">{hotelInfoDisplay}</td>
                                        <td className="p-2">{getDatesDisplay(booking)}</td>
                                        <td className="p-2">
                                            {isCancelled ? (
                                                <span className="text-gray-500">No actions available</span>
                                            ) : (
                                                <>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {flightBookingInfo && !isVerified && (
                                                            <button
                                                                onClick={() => handleVerify(id)}
                                                                className="w-48 min-w-[12rem] px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all text-center"
                                                            >
                                                                Verify Flights
                                                            </button>
                                                        )}

                                                        {isPending && (
                                                            <button
                                                                onClick={() => handleModifyBooking(booking)}
                                                                className="w-48 min-w-[12rem] px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all text-center"
                                                            >
                                                                Complete Booking
                                                            </button>
                                                        )}

                                                        {flightBookingInfo && (
                                                            <button
                                                                onClick={() => handleCancelFlight(id)}
                                                                className="w-48 min-w-[12rem] px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all text-center"
                                                            >
                                                                Cancel Flights
                                                            </button>
                                                        )}

                                                        {hotelId && (
                                                            <button
                                                                onClick={() => handleCancelHotel(id)}
                                                                className="w-48 min-w-[12rem] px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all text-center"
                                                            >
                                                                Cancel Hotels
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleCancelEntire(id)}
                                                            className="w-48 min-w-[12rem] px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all text-center"
                                                        >
                                                            Cancel Entire Booking
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
