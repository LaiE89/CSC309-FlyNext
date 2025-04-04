"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import Image from "next/image";
import { useTheme } from "../../../themecontext";

export default function RoomDetails() {
    const { id, roomId } = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deleted, setDeleted] = useState(false);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/${roomId}`, {
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

                setRoom(data.room);
            } catch (error) {
                setError(error.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [id, roomId, router]);

    const handleEdit = async (e) => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/${roomId}/edit`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    available: !room.available
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(data.error);
            }

            setRoom(data.room);
            if (data.room.available) {
                setSuccess("Availability Successfully Edited!");
            }
            else {
                setSuccess("Availability Successfully Edited! Bookings related to this room have been deleted.");
            }
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e) => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/${roomId}/edit`, {
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

            setRoom(data.room);
            setDeleted(true);
            setSuccess("Room has been deleted! Bookings related to this room have been deleted.");
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{room.type}</h2>
                    <p
                        className={`text-lg font-medium ${
                            room.available ? "text-green-500" : "text-red-500"
                        }`}
                    >
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
                    <h3 className={`text-xl font-semibold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>Photos</h3>
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

            <div className="flex flex-wrap gap-3 mt-4">
                <button
                    onClick={handleEdit}
                    disabled={deleted}
                    className={`py-2 px-5 rounded-lg transition ${
                        deleted ? ('bg-yellow-400 cursor-not-allowed') : (theme === 'dark' 
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white')
                    }`}
                >
                    Change Availability
                </button>

                <button
                    onClick={handleDelete}
                    disabled={deleted}
                    className={`py-2 px-5 rounded-lg transition ${
                        deleted ? ('bg-red-400 cursor-not-allowed') : (theme === 'dark' 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white')
                    }`}
                >
                    Delete
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
            {success && (
                <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                    <p className="text-green-500">{success}</p>
                </div>
            )}
        </div>
    );
}