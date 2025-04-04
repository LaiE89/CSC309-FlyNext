"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from "../themecontext";
import { fetchWithAuth } from "@/utils/auth";
import { useUser } from "../usercontext";

function FlightSearch() {
    const router = useRouter();
    const { theme } = useTheme();
    const { userRole } = useUser();

    const searchParams = useSearchParams();
    const locationParam = searchParams.get("location");

    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [origin, setOrigin] = useState('Toronto');
    const [destination, setDestination] = useState(locationParam || "Zurich");
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [tripType, setTripType] = useState('one-way');
    const [returnDate, setReturnDate] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    // New state variables to store selected routes.
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedOutboundRoute, setSelectedOutboundRoute] = useState(null);
    const [selectedInboundRoute, setSelectedInboundRoute] = useState(null);

    const storedBookingId = localStorage.getItem("currentBookingId");
    const bookingId = storedBookingId ? parseInt(storedBookingId, 10) : null;
    
    const fetchFlights = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSelectedRoute(null);
        setSelectedOutboundRoute(null);
        setSelectedInboundRoute(null);
        try {
            const params = { origin, destination, date, tripType };
            if (tripType === "round-trip") {
                params.returnDate = returnDate;
            }
            const queryString = new URLSearchParams(params).toString();
            const res = await fetch(`/api/visitor/flights?${queryString}`, {
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
            setSearchResults(data);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }, [origin, destination, date, tripType, returnDate, router]);

    // Functions to fetch suggestions for the search bars
    const fetchOriginSuggestions = async (query) => {
        try {
            const queryString = new URLSearchParams({ query }).toString();
            const res = await fetch(`/api/visitor/flights/search?${queryString}`);
            if (!res.ok) {
                throw new Error("Failed to fetch origin suggestions");
            }
            const data = await res.json();
            setOriginSuggestions(data.suggestions);
        } catch (err) {
            console.error("Error fetching origin suggestions:", err);
        }
    };

    const fetchDestinationSuggestions = async (query) => {
        try {
            const queryString = new URLSearchParams({ query }).toString();
            const res = await fetch(`/api/visitor/flights/search?${queryString}`);
            if (!res.ok) {
                throw new Error("Failed to fetch destination suggestions");
            }
            const data = await res.json();
            setDestinationSuggestions(data.suggestions);
        } catch (err) {
            console.error("Error fetching destination suggestions:", err);
        }
    };

    const handleOriginChange = (e) => {
        const value = e.target.value;
        setOrigin(value);
        if (value != "") {
            fetchOriginSuggestions(value);
        } else {
            setOriginSuggestions([]);
        }
    };

    const handleDestinationChange = (e) => {
        const value = e.target.value;
        setDestination(value);
        if (value != "") {
            fetchDestinationSuggestions(value);
        } else {
            setDestinationSuggestions([]);
        }
    };

    const selectOriginSuggestion = (suggestion) => {
        setOrigin(suggestion);
        setOriginSuggestions([]);
    };

    const selectDestinationSuggestion = (suggestion) => {
        setDestination(suggestion);
        setDestinationSuggestions([]);
    };

    useEffect(() => {
        fetchFlights();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const createOrUpdateBooking = async (flights) => {
        try {
            const flightBookingInfo = JSON.stringify({
                flights: flights.map((flight) => ({
                    flightid: flight.id,
                    flightNumber: flight.flightNumber,
                    origin: flight.origin.name,
                    destination: flight.destination.name,
                    mainDestination: destination,
                    airline: flight.airline.name,
                    departureTime: flight.departureTime,
                    arrivalTime: flight.arrivalTime,
                    price: flight.price,
                    status: flight.status,
                })),
            });
            const payload = { flightBookingInfo };
            let res;
            let bookingData;
            if (bookingId) {
                res = await fetchWithAuth("/api/user/booking/edit", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        bookingId: parseInt(bookingId),
                        flightBookingInfo,
                    }),
                });
                if (!res.ok) {
                    if (res.status === 440) {
                        router.push("/ui/error/session-expired");
                    }
                }
            } else {
                res = await fetchWithAuth("/api/user/booking/create/combined", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    if (res.status === 440) {
                        router.push("/ui/error/session-expired");
                    }
                }
                bookingData = await res.json();
                localStorage.setItem("currentBookingId", bookingData.id);
            }
            return;
        } catch (err) {
            throw err;
        }
    };

    const handleBookFlight = async () => {
        try {
            if (!selectedRoute) {
                setError("Please select a route first.");
                return;
            }
            await createOrUpdateBooking(selectedRoute.flights);
            router.push("/ui/dashboard/booking");
        } catch (error) {
            setError(error.message || "Failed to create booking. Please try again.");
        }
    };

    const handleBookCombinedFlight = async () => {
        try {
            if (!selectedOutboundRoute || !selectedInboundRoute) {
                setError("Please select both an outbound and an inbound route.");
                return;
            }
            const combinedFlights = [
                ...selectedOutboundRoute.flights,
                ...selectedInboundRoute.flights,
            ];
            await createOrUpdateBooking(combinedFlights);
            router.push("/ui/dashboard/booking");
        } catch (error) {
            setError(error.message || "Failed to create booking. Please try again.");
        }
    };

    const handleSelectRoute = (route, flightType) => {
        if (flightType === 'outbound') {
            setSelectedOutboundRoute(prev => prev === route ? null : route);
        } else if (flightType === 'inbound') {
            setSelectedInboundRoute(prev => prev === route ? null : route);
        } else {
            setSelectedRoute(prev => prev === route ? null : route);
        }
    };

    const renderFlights = (results, flightType = 'one-way') => {
        if (!results || (Array.isArray(results) && results.length == 0)) {
            return <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>No flights found</div>;
        }
        const flightsToRender = Array.isArray(results) ? results : results.results || [];
        
        return flightsToRender.map((route, routeIndex) => {
            let isSelected = false;
            if (flightType === 'outbound') {
                isSelected = selectedOutboundRoute === route;
            } else if (flightType === 'inbound') {
                isSelected = selectedInboundRoute === route;
            } else {
                isSelected = selectedRoute === route;
            }
            return (
                <div
                    key={routeIndex}
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "15px",
                        marginBottom: "15px",
                        backgroundColor: isSelected ? (theme === 'dark' ? 'dimgrey' : 'gainsboro') : "transparent",
                    }}
                >
                    <h3>{route.legs} Leg(s)</h3>
                    <ul style={{ listStyleType: "none", padding: 0 }}>
                        {route.flights.map((flight, flightIndex) => (
                            <li
                                key={flightIndex}
                                style={{
                                    marginBottom: "10px",
                                    paddingBottom: "10px",
                                    borderBottom: "1px solid #eee",
                                }}
                            >
                                <p>
                                    <strong>Flight Number:</strong> {flight.flightNumber}
                                </p>
                                <p>
                                    <strong>Airline:</strong> {flight.airline.name} ({flight.airline.code})
                                </p>
                                <p>
                                    <strong>Departure:</strong> {flight.origin.name} ({flight.origin.code}) at{" "}
                                    {new Date(flight.departureTime).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Arrival:</strong> {flight.destination.name} ({flight.destination.code}) at{" "}
                                    {new Date(flight.arrivalTime).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Duration:</strong> {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                                </p>
                                <p>
                                    <strong>Price:</strong> {flight.price} {flight.currency}
                                </p>
                                <p>
                                    <strong>Available Seats:</strong> {flight.availableSeats}
                                </p>
                                <p>
                                    <strong>Status:</strong> {flight.status}
                                </p>
                            </li>
                        ))}
                    </ul>
                    {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                        <button
                            onClick={() => handleSelectRoute(route, flightType)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: "#0070f3",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            {isSelected ? "Unselect" : "Select"}
                        </button>
                    )}
                </div>
            );
        });
    };

    return (
        <div className={`max-w-4xl mx-auto p-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h1 className="text-2xl font-bold mb-6">Flight Search</h1>
            
            <div
                className={`p-6 rounded-2xl mb-6 transition-all duration-300 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-lg'
            }`}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Origin Input */}
                    <div className="relative w-full">
                        <label className="block text-sm font-semibold mb-2">Origin</label>
                        <input
                            type="text"
                            value={origin}
                            onChange={handleOriginChange}
                            placeholder="Enter origin city or airport"
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                            theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                : 'bg-white border-gray-300 focus:ring-blue-400'
                            }`}
                        />
                        {originSuggestions.length > 0 && (
                            <ul
                                className={`absolute top-full left-0 right-0 border overflow-y-auto z-10 list-none rounded shadow-md ${
                                    theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 divide-gray-600'
                                    : 'bg-white border-gray-300 divide-gray-200'
                                }`}
                            >
                            {originSuggestions.map((suggestion, index) => (
                                <li
                                key={index}
                                onClick={() => selectOriginSuggestion(suggestion)}
                                className={`p-3 cursor-pointer transition-colors ${
                                    theme === 'dark'
                                    ? 'hover:bg-gray-600'
                                    : 'hover:bg-gray-100'
                                }`}
                                >
                                {suggestion}
                                </li>
                            ))}
                            </ul>
                        )}
                    </div>

                    {/* Destination Input */}
                    <div className="relative w-full">
                        <label className="block text-sm font-semibold mb-2">Destination</label>
                        <input
                            type="text"
                            value={destination}
                            onChange={handleDestinationChange}
                            placeholder="Enter destination city or airport"
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                            theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                : 'bg-white border-gray-300 focus:ring-blue-400'
                            }`}
                        />
                        {destinationSuggestions.length > 0 && (
                            <ul
                                className={`absolute top-full left-0 right-0 border overflow-y-auto z-10 list-none rounded shadow-md ${
                                    theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 divide-gray-600'
                                    : 'bg-white border-gray-300 divide-gray-200'
                                }`}
                            >
                            {destinationSuggestions.map((suggestion, index) => (
                                <li
                                key={index}
                                onClick={() => selectDestinationSuggestion(suggestion)}
                                className={`p-3 cursor-pointer transition-colors ${
                                    theme === 'dark'
                                    ? 'hover:bg-gray-600'
                                    : 'hover:bg-gray-100'
                                }`}
                                >
                                {suggestion}
                                </li>
                            ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Trip Type */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Trip Type</label>
                        <select
                            value={tripType}
                            onChange={(e) => setTripType(e.target.value)}
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                            theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                : 'bg-white border-gray-300 focus:ring-blue-400'
                            }`}
                        >
                            <option value="one-way">One Way</option>
                            <option value="round-trip">Round Trip</option>
                        </select>
                    </div>

                    {/* Departure Date */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Departure Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                            theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                : 'bg-white border-gray-300 focus:ring-blue-400'
                            }`}
                        />
                    </div>

                    {/* Return Date (if round-trip) */}
                    {tripType === 'round-trip' && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">Return Date</label>
                            <input
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                                theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                                : 'bg-white border-gray-300 focus:ring-blue-400'
                            }`}
                            />
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <button
                    onClick={fetchFlights}
                    disabled={loading}
                    className={`w-full md:w-auto px-6 py-3 font-semibold rounded-lg transition-colors ${
                        loading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                    >
                    {loading ? 'Searching...' : 'Search Flights'}
                    </button>
                </div>
            </div>

            {searchResults && (
                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h2 className="text-xl font-semibold mb-4">Available Flights</h2>
                    
                    {tripType === 'one-way' ? (
                        <div>
                            {renderFlights(searchResults)}
                            {selectedRoute && (userRole === "USER" || userRole === "HOTEL_OWNER") && (
                                <button
                                    onClick={handleBookFlight}
                                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Book Selected Flight
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium mb-3">Outbound Flights</h3>
                                {renderFlights(searchResults.outbound?.results || [], 'outbound')}
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-3">Inbound Flights</h3>
                                {renderFlights(searchResults.inbound?.results || [], 'inbound')}
                            </div>
                            {selectedOutboundRoute && selectedInboundRoute && (userRole === "USER" || userRole === "HOTEL_OWNER") && (
                                <div className="col-span-2">
                                    <button
                                        onClick={handleBookCombinedFlight}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Book Selected Flights
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        </div>
    );
}

export default function FlightsPage() {
    return (
        <Suspense>
            <FlightSearch />
        </Suspense>
    )
}