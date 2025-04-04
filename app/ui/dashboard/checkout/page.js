"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import { useTheme } from "../themecontext";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("bookingId");
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { theme } = useTheme();

    // Debug: Log the bookingId from the URL
    useEffect(() => {
        console.log("Checkout Page: Booking ID from URL:", bookingId);
    }, [bookingId]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage("");
        setInvoice(null);

        // Validate card number (must be exactly 16 digits)
        const trimmedCard = cardNumber.trim();
        if (!/^\d{16}$/.test(trimmedCard)) {
            setError("Incorrect card number");
            return;
        }

        setLoading(true);
        console.log("Checkout Page: Sending payload:", {
            bookingId,
            cardNumber,
            expiryDate,
        });

        try {
            const res = await fetchWithAuth("/api/user/booking/checkout/combined", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    bookingId: parseInt(bookingId),
                    cardNumber: trimmedCard,
                    expiryDate,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(data.error);
            }
            
            console.log("Checkout Page: API response data:", data);
            setMessage(data.message);
            setInvoice(data.invoice);
            localStorage.clear();
        } catch (error) {
            setError(error.message || "Checkout error");
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = () => {
        if (!invoice) return;
        const byteCharacters = atob(invoice);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "itinerary.pdf";
        link.click();
        URL.revokeObjectURL(blobUrl);
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

    return (
        <div className={`max-w-lg mx-auto p-5 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>
            <p className="mb-4">
                <strong>Booking ID:</strong> {bookingId || "Not found"}
            </p>

            {message ? (
                // Once confirmed, show the success message and Back to Home button.
                <div>
                    <p className="text-green-500 mb-4">{message}</p>
                    {invoice && (
                        <button
                            onClick={downloadInvoice}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-2"
                        >
                            Download Itinerary PDF
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/ui/dashboard/bookings")}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        View Bookings
                    </button>
                </div>
            ) : (
                // Show the checkout form only if booking hasn't been confirmed
                <form
                    onSubmit={handleCheckout}
                    className="flex flex-col gap-4"
                >
                    <label className="flex flex-col gap-1">
                        Credit Card Number:
                        <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="16-digit card number"
                            required
                            className={`p-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        Expiry Date (MM/YY):
                        <input
                            type="text"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            placeholder="MM/YY"
                            required
                            className={`p-2 rounded-md border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : "Pay and Confirm Booking"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
