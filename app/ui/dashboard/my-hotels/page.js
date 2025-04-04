"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/utils/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../themecontext";

export default function MyHotels() {
    const router = useRouter();
    const { theme } = useTheme();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await fetchWithAuth("/api/hotel-owner/my-hotels", {
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

                setHotels(data.hotels);
            } catch (error) {
                setError(error.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchHotels();
    }, [router]);

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
            <h2 className="text-3xl font-bold mb-4">My Hotels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.isArray(hotels) && hotels.map((hotel) => (
                    <Link key={hotel.id} href={`/ui/dashboard/my-hotels/${hotel.id}`}>
                        <div className={`rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition flex flex-col items-center ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <Image 
                                src={hotel.logo || "/default-hotel-logo.png"} 
                                alt={`${hotel.name} Logo`} 
                                width={256}
                                height={256}
                                className="w-32 h-32 object-cover mb-3"
                            />
                            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'} truncate`}>{hotel.name}</h3>
                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{hotel.starRating} Star</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
