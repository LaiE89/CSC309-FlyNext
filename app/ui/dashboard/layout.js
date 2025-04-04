"use client";

import { useState } from "react";
import { UserProvider, useUser } from "./usercontext";
import { ThemeProvider, useTheme } from "./themecontext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import NotificationBadge from "@/app/ui/dashboard/notifications/badge/page";

export default function DashboardLayout({ children }) {
    return (
        <ThemeProvider>
            <UserProvider>
                <DashboardContent>{children}</DashboardContent>
            </UserProvider>
        </ThemeProvider>
    );
}

function DashboardContent({ children }) {
    const router = useRouter();
    const { userRole } = useUser();
    const { theme, toggleTheme } = useTheme();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    
    const toggleMobileNav = () => {
        setMobileNavOpen((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });
            localStorage.clear();
            router.push("/ui/login");
        } catch (err) {
            console.error("Failed to logout:", err);
        }
    };

    const handleBooking = async () => {
        router.push("/ui/dashboard/booking");
    };

    return (
        <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <nav className={`w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-md'} p-4 flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <Image src="/flynext.png" alt="FlyNext logo" width={256} height={256} className="w-6 h-auto" />
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>FlyNext</h2>
                </div>

                {/* Navigation links for medium and larger screens */}
                <div className="hidden lg:block">
                    <ul className="flex items-center space-x-4">
                        <li>
                            <button 
                                onClick={toggleTheme}
                                className={`p-2 rounded-full transition-colors ${
                                    theme === 'dark' 
                                        ? 'hover:bg-gray-700 text-gray-200' 
                                        : 'hover:bg-gray-200 text-gray-600'
                                }`}
                                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            >
                                {theme === 'dark' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>
                        </li>
                        {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                            <li>
                                <Link href="/ui/dashboard/notifications" className="relative">
                                    <NotificationBadge key={Date.now()} />
                                </Link>
                            </li>
                        )}
                        {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                            <li>
                                <button
                                    onClick={handleBooking}
                                    className={`p-2 rounded-full transition-colors ${
                                        theme === 'dark'
                                        ? 'hover:bg-gray-700 text-gray-200'
                                        : 'hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title="View Current Booking"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 3h2l.4 2m1.2 6h11.45a1 1 0 00.98-.8l1.2-6A1 1 0 0019.3 3H6.21M6.6 11l1.5 7.5a1 1 0 00.99.8h8.82a1 1 0 00.98-.8L21 8H7"
                                        />
                                        <circle cx="9" cy="20" r="1.5" />
                                        <circle cx="17" cy="20" r="1.5" />
                                    </svg>
                                </button>
                            </li>
                        )}
                        <li>
                            <button onClick={handleLogout} className={`hover:underline cursor-pointer ${
                                theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                                Logout
                            </button>
                        </li>
                        <li>
                            <Link href="/ui/dashboard/flights" className={`hover:underline ${
                                theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                                Flights
                            </Link>
                        </li>
                        <li>
                            <Link href="/ui/dashboard/all-hotels" className={`hover:underline ${
                                theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                                All Hotels
                            </Link>
                        </li>
                        {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                            <>
                                <li>
                                    <Link href="/ui/dashboard/bookings" className={`hover:underline ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        My Bookings
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/ui/dashboard/profile" className={`hover:underline ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/ui/dashboard/add-hotel" className={`hover:underline ${
                                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        Add Hotel
                                    </Link>
                                </li>
                            </>
                        )}
                        {userRole === "HOTEL_OWNER" && (
                            <li>
                                <Link href="/ui/dashboard/my-hotels" className={`hover:underline ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                                }`}>
                                    My Hotels
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Mobile navigation */}
                <div className="flex items-center space-x-4 lg:hidden">
                    <button 
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors ${
                            theme === 'dark' 
                                ? 'hover:bg-gray-700 text-gray-200' 
                                : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>
                    {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                        <Link href="/ui/dashboard/notifications" className="relative">
                            <NotificationBadge key={Date.now()} />
                        </Link>
                    )}
                    {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                        <button
                            onClick={handleBooking}
                            className={`p-2 rounded-full transition-colors ${
                                theme === 'dark'
                                ? 'hover:bg-gray-700 text-gray-200'
                                : 'hover:bg-gray-200 text-gray-600'
                            }`}
                            title="View Current Booking"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2m1.2 6h11.45a1 1 0 00.98-.8l1.2-6A1 1 0 0019.3 3H6.21M6.6 11l1.5 7.5a1 1 0 00.99.8h8.82a1 1 0 00.98-.8L21 8H7"
                                />
                                <circle cx="9" cy="20" r="1.5" />
                                <circle cx="17" cy="20" r="1.5" />
                            </svg>
                        </button>
                    )}
                    <button 
                        onClick={toggleMobileNav}
                        className={`p-2 rounded-full transition-colors ${
                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                    >
                        {mobileNavOpen ? (
                            <svg
                                className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>
            
            {mobileNavOpen && (
                <div className={`lg:hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-md'} px-6 py-4 space-y-2`}>
                    <ul className="flex flex-col gap-3 items-center text-center">
                        <li>
                            <button onClick={handleLogout} className={`hover:underline cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                Logout
                            </button>
                        </li>
                        <li>
                            <Link href="/ui/dashboard/flights" className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                Flights
                            </Link>
                        </li>
                        <li>
                            <Link href="/ui/dashboard/all-hotels" className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                All Hotels
                            </Link>
                        </li>
                        {(userRole === "USER" || userRole === "HOTEL_OWNER") && (
                            <>
                                <li>
                                    <Link href="/ui/dashboard/bookings" className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                        My Bookings
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/ui/dashboard/profile" className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                        Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/ui/dashboard/add-hotel" className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                        Add Hotel
                                    </Link>
                                </li>
                            </>
                        )}
                        {userRole === "HOTEL_OWNER" && (
                            <li>
                                <Link href="/ui/dashboard/my-hotels" className={`hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                    My Hotels
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            )}

            <main className={`flex-1 p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>{children}</main>
        </div>
    );
}