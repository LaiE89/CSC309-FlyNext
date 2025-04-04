"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const router = useRouter();

    async function handleLogin(e) {
        e.preventDefault();
        setError(null);

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, isVisitor: "false" }),
            credentials: "include",
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error);
            return;
        }

        router.push("/ui/dashboard/profile");
    }

    async function handleLoginVisitor(e) {
        e.preventDefault();
        setError(null);

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "", password: "", isVisitor: "true" }),
            credentials: "include",
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error);
            return;
        }

        router.push("/ui/dashboard/all-hotels");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-center text-black mb-6">Login</h1>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        type="submit"
                        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                    >
                        Login
                    </button>
                </form>
        
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        
                <div className="text-center mt-4 space-y-2">
                    <p>
                        <button onClick={handleLoginVisitor} className="text-blue-500 hover:underline cursor-pointer">
                            Login as Visitor
                        </button>
                    </p>
                    <p>
                        <Link href="/" className="text-blue-500 hover:underline">
                            Back
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
