import { createContext, useEffect, useState } from "react";
import { getMe } from "../api/auth";

export const AuthContext = createContext(null);

const STORAGE_KEY = "user";

function loadUser() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadUser);

    useEffect(() => {
        try {
            if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
        }
    }, [user]);

    useEffect(() => {
        if (user) getMe(user.user_id).then(setUser).catch(() => setUser(null));
    }, []);

    const signIn = (data) => setUser(data);
    const signOut = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
