"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/auth";
import { useTheme } from "../themecontext";
import NotificationBadge from "@/app/ui/dashboard/notifications/badge/page";

export default function NotificationsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [showBadge, setShowBadge] = useState(true);

  // Fetch notifications
  useEffect(() => {
    const getNotifications = async () => {
      try {
        const res = await fetchWithAuth("/api/user/notifications/recieve", { method: "GET", credentials: "include", });
        if (!res.ok) {
          if (res.status === 440) {
            router.push("/ui/error/session-expired");
          }
          throw new Error("Failed to fetch notifications");
        }
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      }
    };
    getNotifications();
  }, [router]);

  // Mark a single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const res = await fetchWithAuth("/api/user/notifications/read", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      if (!res.ok) {
        if (res.status === 440) {
          router.push("/ui/error/session-expired");
        }
        throw new Error("Failed to mark notification as read");
      }
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setShowBadge(false);
      setTimeout(() => {
        setShowBadge(true);
      }, 100);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-3xl font-bold text-gray-800 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Notifications</h1>
        {/* Force re-mount of NotificationBadge using key */}
        {showBadge && <NotificationBadge key={showBadge} />}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-lg shadow-sm transition-all duration-200 ${
                notification.isRead 
                  ? "bg-gray-50 dark:bg-gray-800" 
                  : "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`text-lg ${
                    notification.isRead 
                      ? "text-gray-700 dark:text-gray-300" 
                      : "text-gray-900 dark:text-white font-medium"
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
