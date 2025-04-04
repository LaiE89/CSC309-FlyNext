"use client";
import { useState } from "react";
import { fetchWithAuth } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { useTheme } from "../themecontext";

export default function AddHotelForm() {
    const router = useRouter();
    const { theme } = useTheme();
    const [hotelName, setHotelName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [starRating, setStarRating] = useState(1);
    const [images, setImages] = useState([]);
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [countrySuggestions, setCountrySuggestions] = useState([]);

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

    // Clear logo
    const clearLogo = () => {
        setLogo(null);
    };

    // Fetch City Suggestions
    const fetchCitySuggestions = async (query) => {
        try {
            const queryString = new URLSearchParams({ query }).toString();
            const response = await fetch(`/api/visitor/cities?${queryString}`);
            if (!response.ok) {
                throw new Error("Failed to fetch city suggestions");
            }
            const data = await response.json();
            setCitySuggestions(data.suggestions);
        } catch (err) {
            console.error(err.message);
        }
    };

    // Fetch Country Suggestions
    const fetchCountrySuggestions = async (query) => {
        try {
            const queryString = new URLSearchParams({ query }).toString();
            const response = await fetch(`/api/visitor/countries?${queryString}`);
            if (!response.ok) {
                throw new Error("Failed to fetch country suggestions");
            }
            const data = await response.json();
            setCountrySuggestions(data.suggestions);
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleCityChange = (e) => {
        const value = e.target.value;
        setCity(value);
        if (value != "") {
            fetchCitySuggestions(value);
        } else {
            setCitySuggestions([]);
        }
    };

    const handleCountryChange = (e) => {
        const value = e.target.value;
        setCountry(value);
        if (value != "") {
            fetchCountrySuggestions(value);
        } else {
            setCountrySuggestions([]);
        }
    };

    const selectCitySuggestion = (suggestion) => {
        setCity(suggestion);
        setCitySuggestions([]);
    };

    const selectCountrySuggestion = (suggestion) => {
        setCountry(suggestion);
        setCountrySuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            let logoUrl = null;
            let imageUrls = [];

            // Submit hotel details
            const hotelData = {
                name: hotelName,
                address,
                city,
                country,
                starRating,
                logo: logoUrl,
                images: imageUrls,
            };

            let res = await fetchWithAuth("/api/user/add-hotel", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(hotelData),
            });

            const updatedData = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(updatedData.error);
            }

            // Upload logo if selected
            if (logo) {
                const formData = new FormData();
                formData.append("file", logo);
                formData.append("upload-type", "hotel-image");
                formData.append("hotel-id", updatedData.hotel.id);
                
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

                logoUrl = uploadData.url;
            }

            // Upload each image
            for (const image of images) {
                const formData = new FormData();
                formData.append("file", image);
                formData.append("upload-type", "hotel-image");
                formData.append("hotel-id", updatedData.hotel.id);

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
            
            res = await fetchWithAuth(`/api/user/add-hotel`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({
                    id: updatedData.hotel.id,
                    images: imageUrls,
                    logo: logoUrl,
                }),
            });

            const addHotelData = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(addHotelData.error);
            }

            if (updatedData.isRoleChanged) {
                setSuccess("Hotel added successfully! Role has been changed so redirecting to login...");
                setTimeout(() => router.push("/ui/login"), 2000);
            }
            else {
                setSuccess("Hotel added successfully!");
            }
            setHotelName("");
            setAddress("");
            setCity("");
            setCountry("");
            setStarRating(1);
            setImages([]);
            setLogo(null);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`max-w-md mx-auto mt-10 shadow-md rounded-2xl p-6 text-center space-y-6 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Add a New Hotel</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Hotel Name</label>
                    <input
                        type="text"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        required
                        className={`w-full p-2 border rounded ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Address</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className={`w-full p-2 border rounded ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                </div>

                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>City</label>
                    <div className="relative w-full">
                        <input
                            type="text"
                            value={city}
                            onChange={handleCityChange}
                            required
                            className={`w-full p-2 border rounded ${
                                theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                            }`}
                        />
                        {citySuggestions.length > 0 && (
                            <ul className={`absolute top-full left-0 right-0 border overflow-y-auto z-10 list-none rounded shadow-md 
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`
                            }>
                                {citySuggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        onClick={() => selectCitySuggestion(suggestion)}
                                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Country</label>
                    <div className="relative w-full">
                        <input
                            type="text"
                            value={country}
                            onChange={handleCountryChange}
                            required
                            className={`w-full p-2 border rounded ${
                                theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                            }`}
                        />
                        {countrySuggestions.length > 0 && (
                            <ul className={`absolute top-full left-0 right-0 border overflow-y-auto z-10 list-none rounded shadow-md 
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`
                            }>
                                {countrySuggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        onClick={() => selectCountrySuggestion(suggestion)}
                                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Star Rating</label>
                    <select
                        value={starRating}
                        onChange={(e) => setStarRating(Number(e.target.value))}
                        className={`w-full p-2 border rounded ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    >
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <option key={rating} value={rating}>
                                {rating} Star{rating !== 1 ? 's' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Hotel Images (Optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, "images")}
                        className={`w-full p-2 border rounded ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                    {images.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {images.map((image, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <p className={`text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{image.name}</p>
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
                
                <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Hotel Logo (Optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "logo")}
                        className={`w-full p-2 border rounded ${
                            theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                        }`}
                    />
                    {logo && (
                        <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{logo.name}</p>
                            <button
                                type="button"
                                onClick={clearLogo}
                                className="text-red-500 text-sm hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    {loading ? "Submitting..." : "Add Hotel"}
                </button>
            </form>
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
        </div>
    );
}