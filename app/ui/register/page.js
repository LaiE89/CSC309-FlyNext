"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "USER",
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    async function handleRegister(e) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error);
        } else {
            setSuccess("Registration successful!");
        }
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-center text-black mb-6">Register</h1>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        type="submit"
                        className="text-black w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                    >
                    Register
                    </button>
                </form>
        
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                {success && <p className="text-green-500 text-center mt-4">{success}</p>}
                
                <p className="text-center mt-4">
                    <Link href="/" className="text-blue-500 hover:underline cursor-pointer">Back</Link>
                </p>
            </div>
        </div>
    );
}