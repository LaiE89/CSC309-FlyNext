"use client";
import { useState } from "react";
import { fetchWithAuth } from "@/utils/auth";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../../themecontext";

export default function AddRoomForm() {
    const { id } = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [type, setType] = useState("Double");
    const [available, setAvailable] = useState(true);
    const [pricePerNight, setPricePerNight] = useState(100.0);
    const [amenity, setAmenity] = useState("");
    const [amenities, setAmenities] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleFileChange = (event, type) => {
        const files = event.target.files;
        if (!files) return;
        
        if (type === "images") {
            setImages([...images, ...Array.from(files)]);
        } else {
            setLogo(files[0]);
        }
    };

    // Remove a specific image
    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // Clear all images
    const clearAllImages = () => {
        setImages([]);
    };

    const addAmenity = () => {
        if (amenity.trim() !== "" && !amenities.includes(amenity)) {
            const updatedAmenities = [...amenities, amenity];
            setAmenities(updatedAmenities);
            setAmenity("");
        }
    };

    const removeAmenity = (index) => {
        const updatedAmenities = amenities.filter((_, i) => i !== index);
        setAmenities(updatedAmenities);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            let imageUrls = [];
            let amenitiesJson = [];

            // Upload each amenity
            for (const item of amenities) {
                amenitiesJson.push(item);
            }

            // Submit hotel details
            const roomData = {
                type: type,
                available: available,
                pricePerNight: pricePerNight,
                amenities: amenitiesJson,
                images: imageUrls,
            };

            let res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/add-room`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(roomData),
            });

            const updatedData = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(updatedData.error);
            }

            // Upload each image
            for (const image of images) {
                const formData = new FormData();
                formData.append("file", image);
                formData.append("upload-type", "hotel-room-image");
                formData.append("hotel-id", id);
                formData.append("room-id", updatedData.room.id);

                const uploadRes = await fetchWithAuth("/api/upload", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });

                const uploadData = await uploadRes.json();

                if (!uploadRes.ok) {
                    if (uploadRes.status === 440) {
                        router.push("/ui/error/session-expired");
                    }
                    throw new Error(uploadData.error);
                }

                imageUrls.push(uploadData.url);
            }

            res = await fetchWithAuth(`/api/hotel-owner/my-hotels/${id}/add-room`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    roomId: updatedData.room.id,
                    images: imageUrls,
                }),
            });

            const addRoomEditData = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(addRoomEditData.error);
            }

            setSuccess("Room added successfully!");
            setType("Double");
            setAvailable(true);
            setPricePerNight(100.0);
            setAmenities([]);
            setImages([]);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-w-3xl mx-auto p-6 rounded-2xl shadow-lg space-y-6 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Add a New Room</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Room Type
                    </label>
                    <input
                        type="text"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        required
                        className={`w-full border rounded-lg p-2 ${
                            theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-gray-300 text-black'
                        }`}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                        id="available"
                        className={`h-4 w-4 rounded ${
                            theme === 'dark' 
                                ? 'text-blue-400 border-gray-600' 
                                : 'text-blue-600 border-gray-300'
                        }`}
                    />
                    <label htmlFor="available" className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Available
                    </label>
                </div>

                {/* Price */}
                <div>
                    <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Price Per Night
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(e.target.value)}
                        required
                        className={`w-full border rounded-lg p-2 ${
                            theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-gray-300 text-black'
                        }`}
                    />
                </div>

                {/* Amenities */}
                <div>
                    <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                    }`}>
                        Amenities (Optional)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={amenity}
                            onChange={(e) => setAmenity(e.target.value)}
                            placeholder="e.g., Wi-Fi, Air Conditioning"
                            className={`flex-1 border rounded-lg p-2 ${
                                theme === 'dark' 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'border-gray-300 text-black'
                            }`}
                        />
                        <button
                            onClick={addAmenity}
                            type="button"
                            className={`px-4 py-2 rounded-lg transition ${
                                theme === 'dark' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                            >
                            Add
                        </button>
                    </div>

                    {amenities.length > 0 && (
                        <div className="mt-2 space-y-1">
                        {amenities.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <p className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                                }`}>{item}</p>
                                <button
                                    type="button"
                                    onClick={() => removeAmenity(index)}
                                    className="text-red-500 text-sm hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        </div>
                    )}
                </div>

                {/* Images */}
                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Room Images (Optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, "images")}
                        className={`w-full p-2 border rounded ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-black'
                        }`}
                    />
                    {images.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {images.map((image, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{image.name}</p>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="text-red-500 text-sm hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`py-2 px-5 rounded-lg transition ${
                            theme === 'dark' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        {loading ? "Adding..." : "Add Room"}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={`py-2 px-5 rounded-lg transition ${
                            theme === 'dark' 
                                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}