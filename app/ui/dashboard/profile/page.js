"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import { useUser } from "../usercontext";
import { useTheme } from "../themecontext";
import Image from "next/image";

export default function ProfilePage() {
    const router = useRouter();
    const { user, setUser } = useUser();
    const { theme } = useTheme();
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewSrc, setPreviewSrc] = useState(null);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        profilePicture: "",
        phone: "",
    });

    useEffect(() => {
        setForm({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            profilePicture: user?.profilePicture || "",
            phone: user?.phone || "",
        });
    }, [user]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewSrc(URL.createObjectURL(file));
        }
        else {
            setSelectedFile(null);
            setPreviewSrc(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let profilePictureUrl = user.profilePicture;

        // Upload new profile picture if selected
        if (selectedFile) {
            try {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("upload-type", "profile-picture");

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

                profilePictureUrl = uploadData.url;
            } catch (uploadError) {
                setError(uploadError.message || "An unexpected error occurred.");
                return;
            }
        }

        // Update profile with new data
        try {
            const res = await fetchWithAuth("/api/user/profile", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    profilePicture: profilePictureUrl, // Update profile picture
                }),
            });

            const updatedData = await res.json();

            if (!res.ok) {
                if (res.status === 440) {
                    router.push("/ui/error/session-expired");
                }
                throw new Error(updatedData.error);
            }

            setUser(updatedData);
            setEditMode(false);
            setSelectedFile(null);
            setPreviewSrc(null);
        } catch (error) {
            setError(error.message || "An unexpected error occurred.");
        }
    };

    return (
        <div className={`max-w-md mx-auto mt-10 shadow-md rounded-2xl p-6 text-center space-y-6 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>My Profile</h1>

            {error && <p className="text-red-500 font-medium">{error}</p>}

            {user ? (
                <div className="space-y-4">
                    {editMode ? (
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-4 text-left"
                        >
                            <div className="flex flex-col gap-1">
                                <label className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className={`border rounded px-3 py-2 ${
                                        theme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-black'
                                    }`}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className={`border rounded px-3 py-2 ${
                                        theme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-black'
                                    }`}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={`border rounded px-3 py-2 ${
                                        theme === 'dark' 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-black'
                                    }`}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>Profile Picture</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={`text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                                    }`}
                                />
                            </div>

                            <div className="flex justify-center">
                                {previewSrc ? (
                                    <Image
                                        src={previewSrc}
                                        alt="Preview"
                                        width={256}
                                        height={256}
                                        className={`rounded-full object-cover w-48 h-48 border-4 shadow-md ${
                                            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                                        }`}
                                    />
                                ) : user.profilePicture ? (
                                    <Image
                                        src={user.profilePicture}
                                        alt="Current"
                                        width={256}
                                        height={256}
                                        className={`rounded-full object-cover w-48 h-48 border-4 shadow-md ${
                                            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                                        }`}
                                    />
                                ) : (
                                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>No picture</span>
                                )}
                            </div>

                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className={`px-4 py-2 rounded-lg transition ${
                                        theme === 'dark' 
                                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                            : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                                    }`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-48 h-48">
                                    <Image
                                        src={user.profilePicture || "/default-profile.png"}
                                        alt="Profile"
                                        width={256}
                                        height={256}
                                        className={`rounded-full object-cover w-48 h-48 border-4 shadow-md ${
                                            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                                        }`}
                                    />
                                </div>

                                {/* User Info */}
                                <div className="w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                        <div>
                                            <p className={`text-sm font-semibold ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>First Name</p>
                                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>{user.firstName}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>Last Name</p>
                                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>{user.lastName}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>Email</p>
                                            <p className={`text-base break-all ${
                                                theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                                            }`}>{user.email}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>Role</p>
                                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>
                                                {user.role == "HOTEL_OWNER" ? "Hotel Owner" : "User"}
                                            </p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className={`text-sm font-semibold ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>Phone Number</p>
                                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>
                                                {user.phone ? user.phone : "None"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}>Loading...</p>
            )}
        </div>
    );
}
