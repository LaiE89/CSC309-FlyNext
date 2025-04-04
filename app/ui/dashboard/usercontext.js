"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState("VISITOR");
    const [showBadge, setShowBadge] = useState(true);

    const refreshBadge = () => {
        setShowBadge(false);
        setTimeout(() => {
            setShowBadge(true);
        }, 100);
    };

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/user/profile", {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    setUser(null);
                    setUserRole("VISITOR");
                    return;
                }

                const data = await res.json();
                setUser(data);
                setUserRole(data.role || "VISITOR");
            } catch (err) {
                setUser(null);
                setUserRole("VISITOR");
            }
        }

        fetchProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, userRole, setUser, setUserRole, refreshBadge }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}