"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchWithAuth } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { useTheme } from "../../themecontext";

export default function NotificationBadge() {
  const router = useRouter();
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true);
      // Append a timestamp to avoid caching issues
      const res = await fetchWithAuth("/api/user/notifications/badge?ts=" + Date.now());
      if (!res.ok) {
        if (res.status === 440) {
          router.push("/ui/error/session-expired");
          return;
        }
        throw new Error("Failed to fetch unread notifications count");
      }
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching unread notifications count:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);

  return (
    <div className="relative">
      <div
        title="Notifications"
        className={`p-2 rounded-full transition-colors ${
          theme === 'dark'
            ? 'hover:bg-gray-700 text-gray-200'
            : 'hover:bg-gray-200 text-gray-600'
        }`}
      >
        <svg 
          className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        {!isLoading && !error && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}